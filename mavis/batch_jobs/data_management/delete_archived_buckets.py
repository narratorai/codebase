import boto3

from batch_jobs.migrations.create_company import destroy_resources
from core import utils
from core.decorators import mutex_task, with_mavis
from core.errors import ForbiddenError
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


def delete_versions(bucket_name, s3=None):
    if s3 is None:
        s3 = boto3.resource("s3")

    bucket = s3.Bucket(bucket_name)
    try:
        logger.debug("Deleting all the versions")
        bucket.object_versions.delete()
    except Exception as e:
        if "(NoSuchBucket)" in str(e):
            logger.info(f"Bucket {bucket_name} already deleted")


def delete_bucket(s3, bucket_name):
    bucket = s3.Bucket(bucket_name)
    try:
        logger.debug("Deleting the bucket")
        bucket.delete()
    except Exception as e:
        if "(NoSuchBucket)" in str(e):
            logger.warn(f"Bucket {bucket_name} already deleted")


@mutex_task()
@with_mavis
def delete_archived_buckets(mavis: Mavis, **kwargs):
    if mavis.company.slug != "narrator":
        raise ForbiddenError("This batch job is only for the narrator instance")

    all_companies = graph_client.get_archived_companies(updated_befor=utils.date_add(utils.utcnow(), "day", 1)).company

    s3 = boto3.resource("s3")
    for c in all_companies:
        logger.info(f"Deleting bucket for company {c.name}:  {c.resources.s3_bucket}")
        delete_versions(c.resources.s3_bucket, s3=s3)
        destroy_resources(c.slug)
        graph_client.delete_company_resource(c.resources.id)
