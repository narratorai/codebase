import boto3
import structlog

from core.graph import graph_client

logger = structlog.get_logger()


def delete_bucket(s3, bucket_name):
    bucket = s3.Bucket(bucket_name)
    try:
        logger.debug("Deleting all the versions")
        bucket.object_versions.delete()

        logger.debug("Deleting the bucket")
        bucket.delete()
    except Exception as e:
        if "(NoSuchBucket)" in str(e):
            logger.info(f"Bucket {bucket_name} already deleted")
    return None


def clean_up_buckets(company_slug: str):
    if company_slug != "narrator":
        raise Exception("This batch job is only for the narrator instance")

    s3 = boto3.resource("s3")
    s3_client = boto3.client("s3")

    # If there is a company that is archived in Narrator then it should be deleted in auth0
    # get all the companies in graph
    data = graph_client.execute(
        """
        query UsedBuckets {
          company_resources {
            s3_bucket
          }
        }
        """
    ).json()
    company_buckets = data["data"]["company_resources"]
    used_buckets = {b["s3_bucket"] for b in company_buckets}

    all_buckets = s3_client.list_buckets()
    for bucket in all_buckets["Buckets"]:
        if bucket["Name"].startswith("narratorai-company-") and bucket["Name"] not in used_buckets:
            delete_bucket(s3, bucket["Name"])
