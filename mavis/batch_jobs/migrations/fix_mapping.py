from core.decorators import with_mavis
from core.decorators.task import mutex_task
from core.logger import get_logger
from core.util.opensearch import opensearch_client
from core.v4.mavis import Mavis

logger = get_logger()


def get_prod_query(mavis: Mavis, company_name: str, limit: int = 1000, offset: int = 0):
    qm = mavis.qm
    query = qm.Query()
    query.set_from(qm.Table(schema=mavis.company.warehouse_schema, table="activity_stream_classified_software"))
    query.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(json_column="feature_json", json_key="company_name"),
            right=qm.Column(value=company_name),
        )
    )
    query.add_column(qm.Column(table_column="customer"))
    query.set_limit(limit)
    query.set_offset(offset)

    return query


def _clean_id(id: str):
    return id if not id.endswith(".0") else id[:-2]


@mutex_task(queue_name="transformations", time_limit=360_000_000)
@with_mavis
def fix_mapping(mavis: Mavis, **kwargs):
    # Get all opensearch indexes
    indices = opensearch_client.indices.get_alias().keys()

    for index in indices:
        logger.info(f"Processing index: {index}")

        if not index.startswith("clearfind_"):
            continue

        company_name = index.replace("clearfind_software_", "")
        all_production_ids = []
        offset = 0
        while True:
            sql_query = get_prod_query(mavis, company_name, limit=1000, offset=offset)
            table_data = mavis.run_query(sql_query.to_query())
            all_production_ids.extend([r["customer"].split(" - ")[1] for r in table_data.rows])
            offset += 1000
            if table_data.total_rows < 1000:
                break

        # Initialize pagination
        search_after = None
        total_processed = 0

        while True:
            # Search for just the IDs first
            query = {
                "query": {"match_all": {}},
                "_source": False,  # Don't fetch the source document
                "size": 1000,
                "sort": [{"_id": "asc"}],  # Required for search_after
            }

            # Add search_after for pagination
            if search_after:
                query["search_after"] = search_after

            try:
                results = opensearch_client.search(index=index, body=query)
                hits = results["hits"]["hits"]

                # Break if no more results
                if not hits:
                    break

                # Update search_after for next iteration
                search_after = hits[-1]["sort"]
                total_processed += len(hits)

                delete_ids = [hit["_id"] for hit in hits if _clean_id(hit["_id"]) not in all_production_ids]

                if delete_ids:
                    logger.info(
                        f"Found {len(delete_ids)} documents to delete in batch (total processed: {total_processed})"
                    )
                    for old_id in delete_ids:
                        try:
                            opensearch_client.delete(index=index, id=old_id)
                        except Exception as e:
                            logger.error(f"Error deleting document {old_id}: {str(e)}")

                # Filter IDs that need updating
                ids_to_update = [
                    hit["_id"] for hit in hits if hit["_id"].endswith(".0") and hit["_id"] not in delete_ids
                ]

                if ids_to_update:
                    logger.info(
                        f"Found {len(ids_to_update)} documents to update in batch (total processed: {total_processed})"
                    )

                    # Now fetch full documents only for IDs that need updating
                    for old_id in ids_to_update:
                        try:
                            # Get the full document
                            doc = opensearch_client.get(index=index, id=old_id)
                            new_id = old_id[:-2]  # Remove the '.0' suffix

                            logger.info(f"Fixing document {old_id} -> {new_id} in index {index}")

                            try:
                                # Delete the old document
                                opensearch_client.delete(index=index, id=old_id)

                                # Create new document with the same content but new ID
                                opensearch_client.index(index=index, id=new_id, body=doc["_source"])
                            except Exception as e:
                                logger.error(f"Error processing document {old_id}: {str(e)}")

                        except Exception as e:
                            logger.error(f"Error fetching document {old_id}: {str(e)}")

            except Exception as e:
                logger.error(f"Error processing index {index}: {str(e)}")
                break

        logger.info(f"Completed processing index {index}. Total documents processed: {total_processed}")

    logger.info("Mapping fix completed")
