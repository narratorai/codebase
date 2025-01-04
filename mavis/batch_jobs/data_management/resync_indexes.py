from core.api.customer_facing.activities.utils import ActivityManager
from core.api.customer_facing.chats.utils import ChatUpdator
from core.api.customer_facing.datasets.utils import DatasetUpdator
from core.api.customer_facing.reports.utils import NarrativeManager
from core.api.customer_facing.sql.utils import WarehouseManager
from core.api.customer_facing.tables.utils import TableManager
from core.api.customer_facing.tasks.utils import TaskUpdator
from core.api.customer_facing.transformations.utils import TransformationUpdator
from core.api.customer_facing.users.utils import UserManager, UserUpdator
from core.api.customer_facing.utils.updator import Updator
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import narrative_types_enum
from core.logger import get_logger
from core.util.opensearch import opensearch_client
from core.v4.mavis import Mavis

logger = get_logger()


def loop_through(query_builder: Updator, all_objects):
    for ii, obj in enumerate(all_objects):
        print(f"processing {ii} of {len(all_objects)}")
        query_builder.resync_id(obj.id)


@mutex_task(queue_name="resync")
@with_mavis
def resync_indexes(mavis: Mavis, index: str = None, delete_index=False, **kwargs):
    company = mavis.company
    if index == "all":
        idxs = ["table", "users", "activities", "chats", "datasets", "reports", "transformations", "tasks", "sql"]
    else:
        idxs = [index]

    # go through each index and make sure it is working
    for t_id in idxs:
        print(f"processing {t_id}")
        if t_id == "table":
            updator = TableManager(mavis=mavis)
            updator.resync_id(None)
            continue
        if t_id == "users":
            all_objs = graph_client.get_company_users(company.id).company_user
            updator = UserUpdator(mavis=mavis)
        elif t_id == "activities":
            all_objs = graph_client.activity_index(company.id).all_activities
            updator = ActivityManager(mavis=mavis)
        elif t_id == "chats":
            all_objs = graph_client.chat_index(company.id).chat
            updator = ChatUpdator(mavis=mavis)
        elif t_id == "datasets":
            all_objs = graph_client.dataset_index(company.id).dataset
            updator = DatasetUpdator(mavis=mavis)
        elif t_id == "reports":
            all_objs = graph_client.narrative_index(company.id).narrative
            all_objs = [n for n in all_objs if n.type == narrative_types_enum.Story]
            updator = NarrativeManager(mavis=mavis)

            # for o in all_objs:
            #     config = updator.get_config(o.id)
            #     print(config)
            # return None
        elif t_id == "transformations":
            all_objs = graph_client.transformation_index(company_id=mavis.company.id).all_transformations
            updator = TransformationUpdator(mavis=mavis)
        elif t_id == "tasks":
            all_objs = graph_client.get_company_tasks(company.id).company_task
            updator = TaskUpdator(mavis=mavis)
        elif t_id == "sql":
            updator = WarehouseManager(mavis=mavis)
            if delete_index:
                opensearch_client.indices.delete(index=updator.index_name, ignore=[400, 404])

            # # delete from open search anything with company_slug = self.company.slug
            # opensearch_client.delete_by_query(
            #     index=updator.index_name, body={"query": {"term": {"company_slug": mavis.company.slug}}}
            # )

            create_index(updator)
            updator.sync_schema()
            return None

    # delete the index if needed
    if delete_index:
        opensearch_client.indices.delete(index=updator.index_name, ignore=[400, 404])

    # create the index
    create_index(updator)
    loop_through(updator, all_objs)

    if index == "users":
        for u in all_objs:
            updator = UserManager(mavis=mavis)
            updator.reset(u.user_id)


def create_index(query_build):
    if not opensearch_client.indices.exists(index=query_build.index_name):
        print(f"creating index {query_build.index_name}")
        properties = query_build.index_properties

        if query_build.use_semantic_search:
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
            properties["vec"] = vec
            opensearch_client.indices.create(
                index=query_build.index_name,
                body=dict(
                    settings={"index": {"knn": True, "knn.algo_param.ef_search": 100}},
                    mappings=dict(properties=properties),
                ),
            )
        else:
            opensearch_client.indices.create(
                index=query_build.index_name,
                body=dict(mappings=dict(properties=properties)),
            )
