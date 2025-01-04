from enum import StrEnum

import backoff
import boto3
from backoff import on_exception
from numpy import array, dot
from numpy.linalg import norm
from opensearchpy import OpenSearch, Urllib3AWSV4SignerAuth, helpers

from core.logger import get_logger
from core.models.settings import settings

logger = get_logger()

session = boto3.Session(region_name=settings.opensearch_aws_region)
aws_credentials = session.get_credentials()
aws_auth = Urllib3AWSV4SignerAuth(aws_credentials, session.region_name, "es")
opensearch_client = OpenSearch(
    hosts=[settings.opensearch_url.get_secret_value()],
    http_auth=aws_auth if settings.is_production else None,
    verify_certs=settings.is_production,
    ssl_show_warn=False,
    connection_pool_kwargs={"keep_alive": True},
)


# TODO: REMOVE EVERYTHING BELOW THIS LINE
class index_enum(StrEnum):
    activity_index = "activities"
    chat_index = "chats"
    trained_questions = "trained_questions"


def cos_sim(vec1, vec2):
    A = array(vec1)
    B = array(vec2)

    cosine_similarity = dot(A, B) / (norm(A) * norm(B))
    return cosine_similarity


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def insert_record(index_name: index_enum, id, record):
    return opensearch_client.index(index=index_name.value, id=id, body=record)


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def get_record(index_name: index_enum, id, _source=None):
    return opensearch_client.get(index=index_name.value, id=id, _source=_source)["_source"]


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def update_record(index_name: index_enum, id, updated_data):
    return opensearch_client.update(index=index_name.value, id=id, body={"doc": updated_data})


def bulk_update(bulk_data):
    return helpers.bulk(opensearch_client, bulk_data)


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def delete_record(index_name: index_enum, id):
    return opensearch_client.delete(index=index_name.value, id=id)


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def delete_query_record(index_name: index_enum, **kwargs):
    query = {"query": {"term": kwargs}}
    return opensearch_client.delete_by_query(index=index_name.value, body=query)


def _clean_hits(hits):
    return [h["_source"] | {"_id": h["_id"], "_score": h.get("_score")} for h in hits]


def _get_source(kind: index_enum, _source: list[str]):
    if _source:
        return _source
    else:
        return list(get_index_properties(kind).keys())


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def simple_search(
    index_name: index_enum,
    query_str: str,
    fields: list[str],
    top_n=4,
    _source: list = None,
    company_slug: str = None,
    table_id: str = None,
    filter: dict = None,
):
    non_nested_fields = [f for f in fields if "." not in f]
    nested_fields = [(f.split(".")[0], f) for f in fields if "." in f]

    query = {
        "size": top_n,
        "query": {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": query_str,
                        "type": "best_fields",
                        "fields": non_nested_fields,
                        "fuzziness": "AUTO",
                    }
                },
            }
        },
    }

    if non_nested_fields:
        query["query"]["bool"]["should"] = [query["query"]["bool"].pop("must")]

    # handle nesting
    for k in set(f[0] for f in nested_fields):
        query["query"]["bool"]["should"].append(
            {
                "nested": {
                    "path": k,
                    "query": {
                        "multi_match": {
                            "query": query_str,
                            "type": "best_fields",
                            "fields": [f[1] for f in nested_fields if f[0] == k],
                            "fuzziness": "AUTO",
                        }
                    },
                }
            }
        )

    # handle filters
    if table_id:
        query["query"]["bool"]["filter"] = {"term": {"table_id.keyword": table_id}}
    elif company_slug:
        query["query"]["bool"]["filter"] = {
            # filter for terms if it is a list
            f"term{'s'if isinstance(company_slug, list) else ''}": {"company_slug.keyword": company_slug}
        }

    if filter:
        if current_filt := query["query"]["bool"].get("filter"):
            query["query"]["bool"]["must"] = [current_filt, filter]
        else:
            query["query"]["bool"]["filter"] = filter

    query["_source"] = _get_source(index_name, _source)

    output = search_index(index_name, query)
    return output


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def search_similar_vectors(
    index_name: index_enum,
    vector,
    top_n=4,
    _source: list = None,
    company_slug: str = None,
    table_id: str = None,
    filter: dict = None,
):
    query = {
        "size": top_n,
        "query": {
            "bool": {
                "must": {"knn": {"vec": {"vector": vector, "k": top_n}}},
            }
        },
    }

    # handle filters
    if table_id:
        query["query"]["bool"]["filter"] = {"term": {"table_id.keyword": table_id}}
    elif company_slug:
        query["query"]["bool"]["filter"] = {
            # filter for terms if it is a list
            f"term{'s'if isinstance(company_slug, list) else ''}": {"company_slug.keyword": company_slug}
        }

    if filter:
        if current_filt := query["query"]["bool"].get("filter"):
            query["query"]["bool"]["must"] = [current_filt, filter]
        else:
            query["query"]["bool"]["filter"] = filter

    query["_source"] = _get_source(index_name, _source)

    output = search_index(index_name, query)

    return output


@on_exception(backoff.constant, ConnectionError, max_tries=2, logger=logger)
def search_index(index_name: index_enum, query: dict):
    response = opensearch_client.search(index=index_name.value, body=query)
    return _clean_hits(response["hits"]["hits"])


def delete_entire_index(index_name: index_enum):
    """
    Function to delete an entire index
    """
    try:
        return opensearch_client.indices.delete(index=index_name.value)
    except Exception as e:
        return str(e)


def create_vector_index(index_name: index_enum, mapping):
    try:
        return opensearch_client.indices.create(index=index_name.value, body=mapping)
    except Exception as e:
        return str(e)


def get_index_properties(kind: index_enum):
    if kind == index_enum.activity_index:
        properties = {
            "id": {"type": "keyword"},
            "slug": {"type": "keyword"},
            "name": {"type": "text"},
            "description": {"type": "text"},
            "table_id": {"type": "keyword"},
            "category": {"type": "keyword"},
            "columns": {
                "type": "nested",
                "properties": {
                    "name": {"type": "keyword"},
                    "label": {"type": "text"},
                    "type": {"type": "keyword"},
                    "examples": {"type": "text"},
                },
            },
        }
    elif kind == index_enum.chat_index:
        properties = {
            "id": {"type": "keyword"},
            "created_at": {"type": "date"},
            "summary": {"type": "text"},
            "detailed_summary": {"type": "text"},
            "user_id": {"type": "keyword"},
            "company_id": {"type": "keyword"},
            "table_id": {"type": "keyword"},
        }
    elif kind == index_enum.trained_questions:
        properties = {
            "table_id": {"type": "keyword"},
            "dataset_id": {"type": "keyword"},
            "plot_slug": {"type": "text"},
            "group_slug": {"type": "text"},
            "question": {"type": "text"},
        }
    return properties


def create_index(kind: index_enum):
    if not opensearch_client.indices.exists(index=kind.value):
        vec = {
            "type": "knn_vector",
            "dimension": 1536,
            "method": {
                "name": "hnsw",
                "space_type": "cosinesimil",
                "engine": "nmslib",
                "parameters": {"ef_construction": 128, "m": 24},
            },
        }
        properties = get_index_properties(kind)
        properties["vec"] = vec

        opensearch_client.indices.create(
            index=kind,
            body=dict(
                settings={"index": {"knn": True, "knn.algo_param.ef_search": 100}},
                mappings=dict(properties=properties),
            ),
        )
