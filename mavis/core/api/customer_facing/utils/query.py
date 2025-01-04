from opensearch_dsl import Q, Search

from core.api.customer_facing.utils.pydantic import RangeParam
from core.constants import INTERNAL_TRACKING_URL
from core.errors import SilenceError
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.time import days_ago
from core.models.user import AuthenticatedUser
from core.util.llm import text_to_vector
from core.util.opensearch import opensearch_client
from core.util.tracking import fivetran_track
from core.v4.mavis import Mavis

logger = get_logger()

DEFAULT_FIELDS = ["favorited", "created_at", "team_ids", "tag_ids", "user_id", "ids", "is_shared_with_everyone"]


class BasicHandler:
    @property
    def has_search(self) -> bool:
        return True

    @property
    def index_name(self) -> str:
        raise NotImplementedError

    @property
    def use_semantic_search(self) -> bool:
        return False

    @property
    def related_key(self) -> str:
        return ""

    @property
    def display_name(self) -> str:
        return self.related_key

    @property
    def index_properties(self) -> dict:
        raise NotImplementedError


def internal_track(user, related_key, action: str, object_id: UUIDStr | None = None, meta_data: dict | None = None):
    data = dict(
        object_type=related_key,
        object_id=object_id,
        action=action,
        meta_data=meta_data or {},
    )
    fivetran_track(user, INTERNAL_TRACKING_URL, data)


def _clean_time(v):
    return {k: v[:19] for k, v in v.items() if v}


def _convert_filter(v):
    if isinstance(v, list):
        return [_convert_filter(i) for i in v]
    elif isinstance(v, RangeParam):
        return _clean_time(v.dict())
    elif isinstance(v, dict) and (v.get("gte") or v.get("lte")):
        return _clean_time(v)
    return v


class QueryBuilder(BasicHandler):
    user: AuthenticatedUser
    company: Company | None
    mavis: Mavis | None
    search: str | None
    page: int
    per_page: int
    filters: dict

    def __init__(
        self,
        *,
        user: AuthenticatedUser = None,
        company: Company = None,
        mavis: Mavis = None,
        search: str | None = None,
        page: int = 1,
        per_page: int = 10,
        **kwargs,
    ):
        self.user = user
        self.company = company
        self.mavis = mavis
        self.page = page
        self.per_page = per_page
        self.search = search
        self.filters = {
            k: _convert_filter(v)
            for k, v in kwargs.items()
            if (k in self.filter_fields or k in DEFAULT_FIELDS) and v is not None
        }
        if self.mavis:
            self.company = self.mavis.company

        if self.company:
            self.user = self.company.user

    @property
    def search_fields(self) -> list[str]:
        raise NotImplementedError

    @property
    def sort_by(self) -> list[tuple]:
        return [("created_at", "desc")]

    @property
    def nested_search_fields(self) -> dict:
        return {}

    @property
    def filter_fields(self):
        return []

    def track(self, action: str, object_id: UUIDStr | None = None, data: dict | None = None):
        internal_track(self.user, self.related_key, action, object_id, data)

    def pre_process_filters(self):
        return None

    def get_search_results(self, skip_search: bool = False):
        return self._search(skip_search=skip_search)

    def get_search_data(self, ids: list[str]):
        return None

    def get_graph_data(self, ids: list[UUIDStr]):
        return None

    def combine_search_and_graph_data(self, search_result: dict, graph_data: dict | None):
        if graph_data is None:
            return search_result
        return {**search_result, **graph_data}

    def get_with_permissions(self, ids: list[UUIDStr]):
        # grab the search request data
        search_request = Search(index=self.index_name, using=opensearch_client)

        # Do not bother if the user is not an admin
        if "team_ids" in self.index_properties and not self.user.is_admin:
            # Add a filter for team_ids overlap with input_team_ids and also add the user_id since we use this to quickly handle created by permissions
            search_request = search_request.filter("terms", team_ids=self.user.team_ids + ["user:" + self.user.id])

        search_request = search_request.filter("terms", id=[str(i) for i in ids])
        search_request = search_request[(self.page - 1) * self.per_page : self.page * self.per_page]
        response = search_request.execute()
        return [hit.to_dict() for hit in response.hits]

    def _apply_search_filters(self, search_request: Search):
        # Add a filter for company_id
        search_request = search_request.filter("term", company_slug=self.user.company.slug)

        # Do not bother if the user is not an admin
        if "team_ids" in self.index_properties and not self.user.is_admin:
            # Add a filter for team_ids overlap with input_team_ids and also add the user_id since we use this to quickly handle created by permissions
            search_request = search_request.filter("terms", team_ids=self.user.team_ids + ["user:" + self.user.id])

        # handle any filters added
        for k, v in self.filters.items():
            column = k
            if k == "favorited":
                if (isinstance(v, bool) and v) or (isinstance(v, str) and v.lower() == "true"):
                    key = "term"
                    column = "favorited_by"
                    v = self.user.tags.favorite
                else:
                    continue
            elif k == "is_shared_with_everyone":
                if (isinstance(v, bool) and v) or (isinstance(v, str) and v.lower() == "true"):
                    key = "term"
                    column = "team_ids"
                    v = self.user.company.everyone_team_id
                else:
                    continue
            elif k == "ids":
                key = "terms"
                column = "id"
            elif self.index_properties.get(k) is None:
                continue
            elif v == "not_null":
                key = "exists"
                column = "field"
                v = k
            elif self.index_properties[k]["type"] == "boolean":
                key = "term"
                v = True if v.lower() == "true" else False
            elif self.index_properties[k]["type"] == "date":
                key = "range"
                v = {tk: tv for tk, tv in v.items() if v}
            elif isinstance(v, list):
                key = "terms"
            else:
                key = "term"
            # add the value
            search_request = search_request.filter(key, **{column: v})

        return search_request

    def _apply_sorting(self, s: Search):
        # Apply sorting
        sort_criteria = []

        for field, order in self.sort_by:
            # Sort by the views of the user
            if field == "user_views":
                # add the recently viewed
                sort_criteria.append(
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "lang": "painless",
                                "source": """
                                if (!doc.containsKey('user_views') || doc['user_views'].size() == 0) {
                                return Long.MIN_VALUE;  // Return minimum possible value for unviewed items

                                }
                                long lastViewed = 0;
                                for (int i = 0; i < doc['user_views'].length; i++) {
                                if (doc['user_views'][i]['user_id'].value.equals(params.user_id)) {
                                    lastViewed = doc['user_views'][i]['viewed_at'].value.millis;
                                    break;
                                }
                                }
                                return lastViewed;
                                """,
                                "params": {"user_id": self.user.id},
                            },
                            "order": order,
                        }
                    }
                )
            elif field == "last_viewed_by_anyone_at":
                sort_criteria.append(
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "lang": "painless",
                                "source": """
                                if (!doc.containsKey('user_views') || doc['user_views'].size() == 0) {
                                return 0;
                                }
                                long lastViewed = 0;
                                for (int i = 0; i < doc['user_views'].length; i++) {
                                    long viewedAt = doc['user_views'][i]['viewed_at'].value.millis;
                                    if (viewedAt > lastViewed) {
                                        lastViewed = viewedAt;
                                    }
                                }
                                return lastViewed;
                                """,
                            },
                            "order": order,
                        }
                    }
                )
            # Sort by total view count
            elif field == "total_user_views":
                sort_criteria.append(
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "lang": "painless",
                                "source": """
                                if (!doc.containsKey('user_views')) {
                                    return 0;
                                }
                                return doc['user_views'].length;
                                """,
                            },
                            "order": order,
                        }
                    }
                )

            # then sort by favorited
            elif field == "favorited_by":
                sort_criteria.append(
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "lang": "painless",
                                "source": """
                                    return doc['favorited_by'].contains(params['user_id']) ? 1 : 0;
                                """,
                                "params": {"user_id": self.user.id},
                            },
                            "order": order,
                        }
                    }
                )
            elif field == "total_favorites":
                sort_criteria.append(
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "lang": "painless",
                                "source": """
                                return doc['favorited_by'].length;
                                """,
                            },
                            "order": "desc",
                        }
                    }
                )
            elif field in self.index_properties:
                sort_criteria.append({field: {"order": order}})

        # add the sorting by the fields
        if sort_criteria:
            s = s.sort(*sort_criteria)

        return s

    def get_results(self, ignore_fields: list[str] | None = None):
        total_count, results = self._search(ignore_fields)
        graph_data = self.get_graph_data([row["id"] for row in results])
        data = []
        for row in results:
            row = self._process_common_search_data(row)
            combined_data = self.combine_search_and_graph_data(row, graph_data)
            # Add the data
            if combined_data:
                data.append(combined_data)
            else:
                # remove the row from search since it is not in the graph
                opensearch_client.delete(self.index_name, row["id"])

        return {
            "total_count": total_count,
            "page": self.page,
            "per_page": self.per_page,
            "data": data,
        }

    def _search(self, ignore_fields: list[str] | None = None, skip_search: bool = False):
        """Filter the data based on the search query param."""
        self.pre_process_filters()
        search_request = Search(index=self.index_name, using=opensearch_client)
        search_request = self._apply_search_filters(search_request)
        search_request = self._apply_sorting(search_request)

        should_conditions = []

        if self.search:
            # Search query for `id` exact match
            should_conditions.append(Q("term", id={"value": self.search, "boost": 10}))

            # Search query for `slug` exact match
            if "slug" in self.index_properties:
                should_conditions.append(Q("term", slug={"value": self.search, "boost": 10}))

            for ii, field in enumerate(self.search_fields):
                if ii == 0 or field.startswith("*"):
                    field = field.replace("*", "").split("^")[0]
                    should_conditions.append(Q("wildcard", **{field: f"*{self.search}_*"}))

            # add the fuzzy match
            should_conditions.append(_create_match(self.search, self.search_fields))

            # add support for nested search fields
            if self.nested_search_fields:
                for key, fields in self.nested_search_fields.items():
                    fields = [f"{key}.{field}" for field in fields]
                    should_conditions.append(
                        Q(
                            "nested",
                            path=key,
                            query=_create_match(self.search, fields),
                        )
                    )

            # Combine all queries using `should` for OR logic
            combined_query = Q(
                "bool",
                should=should_conditions,
                minimum_should_match=1,
            )

            # Apply function score to weight the combined query
            function_score_query = Q("function_score", query=combined_query, boost_mode="sum")

            # Apply the function score query to the search object
            search_request = search_request.query(function_score_query)

        # Set the pagination
        search_request = search_request[(self.page - 1) * self.per_page : self.page * self.per_page]
        exclude_fields = ["vec", "company_slug"]

        if ignore_fields:
            exclude_fields.extend(ignore_fields)

        search_request = search_request.source(list(set(self.index_properties.keys()) - set(exclude_fields)))

        # Log the query before execution
        logger.debug("Query before execution", data=search_request.to_dict())
        if not skip_search:
            response = search_request.execute()

        if self.use_semantic_search and self.search and (skip_search or response.hits.total.value == 0):
            logger.debug("No results found, trying semantic search")
            search_vec = text_to_vector(self.search)
            dsl_query = search_request.to_dict()

            dsl_query["query"]["bool"]["must"] = {"knn": {"vec": {"vector": search_vec, "k": self.per_page}}}

            response = opensearch_client.search(index=self.index_name, body=dsl_query)
            results = response["hits"]["hits"]
            for hit in results:
                if "id" not in hit:
                    hit["id"] = hit["_id"]
            total_count = response["hits"]["total"]["value"]
        else:
            results = [hit.to_dict() | {"id": hit.id} for hit in response.hits]
            total_count = response.hits.total.value

        # handle the lack of response
        if total_count == 0:
            results = []

        return total_count, results

    def semantic_search(self, search_vec, _source):
        """Filter the data based on the search query param."""
        if not self.use_semantic_search:
            raise SilenceError("Semantic search is not enabled for this handler")

        # create the Search query
        search_request = Search(index=self.index_name, using=opensearch_client)
        search_request = self._apply_search_filters(search_request)
        search_request = self._apply_sorting(search_request)

        # Set the pagination
        search_request = search_request[(self.page - 1) * self.per_page : self.page * self.per_page]
        search_request = search_request.source(_source)

        dsl_query = search_request.to_dict()

        dsl_query["query"]["bool"]["must"] = {"knn": {"vec": {"vector": search_vec, "k": self.per_page}}}

        response = opensearch_client.search(index=self.index_name, body=dsl_query)
        hits = response["hits"]["hits"]
        return hits

    def _process_common_search_data(self, search_row: dict):
        # add the favorited and favorite count
        search_row["favorited"] = self.user.id in search_row.get("favorited_by", [])
        search_row["total_favorites"] = len(search_row.get("favorited_by", []))
        search_row["created_by"] = search_row.get("user_id")
        search_row["tag_ids"] = search_row.get("tag_ids") or []

        # when the user last viewed this
        search_row["last_viewed_at"] = next(
            (t["viewed_at"] for t in search_row.get("user_views", []) if t["user_id"] == self.user.id), None
        )
        search_row["total_user_views"] = len(
            [t for t in search_row.get("user_views", []) if t["viewed_at"] > days_ago(30)]
        )
        search_row["last_viewed_by_anyone_at"] = max(
            (t["viewed_at"] for t in search_row.get("user_views", [])), default=None
        )

        search_row["shared_with_everyone"] = any(
            [t for t in search_row.get("team_ids", []) if t == self.user.company.everyone_team_id]
        )
        search_row["team_ids"] = [t for t in search_row.get("team_ids", []) if not t.startswith("user:")]
        return search_row

    def overlap_permissions(self, team_ids: list[UUIDStr]):
        return set(self.user.team_ids) & set(team_ids)


def _create_match(search_term, fields):
    fields = [f.replace("*", "") for f in fields]
    words = search_term.split(" ")
    if len(words) > 1:
        return Q(
            "bool",
            should=[
                Q("multi_match", query=word, fields=fields, type="best_fields", operator="or", minimum_should_match="1")
                for word in words
            ],
            minimum_should_match=1,
        )
        # return Q(
        #     "multi_match" if len(fields) > 1 else "match",
        #     query=search_term,
        #     fields=fields if len(fields) > 1 else fields[0],
        #     type="phrase",
        #     analyzer="stop",
        #     slop=4,
        # )
    else:
        return Q(
            "multi_match" if len(fields) > 1 else "match",
            query=search_term,
            fields=fields if len(fields) > 1 else fields[0],
            fuzziness="AUTO",
        )
