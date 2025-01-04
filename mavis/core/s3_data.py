import base64
import hashlib
import json
import mimetypes
import sys
from datetime import UTC, datetime, timedelta

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from core.logger import get_logger
from core.models.settings import settings
from core.ttl_cache import ttl_cache
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.utils import convert_to_byte, get_error_message

logger = get_logger()


@ttl_cache(minutes=55)
def get_credentials(slug: str, company_role_arn: str, **kwargs):
    sts = boto3.client("sts")
    company_role = sts.assume_role(
        RoleArn=company_role_arn,
        RoleSessionName=f"mavis-{slug}-s3",
        DurationSeconds=3_600,  # this is the max duration
    )
    response = company_role.get("Credentials")

    return {
        "access_key": response.get("AccessKeyId"),
        "secret_key": response.get("SecretAccessKey"),
        "token": response.get("SessionToken"),
    }


def _s3_key(load_from, is_temp=False):
    if isinstance(load_from, list):
        s3_path = ["temp"] if is_temp else ["prod", "mavis"]
        s3_key = "/".join(s3_path + load_from)
    else:
        s3_key = load_from
    return s3_key


class S3Data:
    @tracer.start_as_current_span("s3_data_init")
    def __init__(
        self,
        company_slug: str,
        company_role_arn: str,
        company_bucket: str,
        company_key_id: str,
        **kwargs,
    ):
        self.company_slug = company_slug
        self.company_role_arn = company_role_arn
        self.kms_key_id = company_key_id
        self._s3 = None
        self.bucket = None
        # simply get the credentials for the company
        company_credentials = get_credentials(company_slug, company_role_arn)
        self.create_s3_bucket(company_credentials, company_bucket)
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=company_credentials["access_key"],
            aws_secret_access_key=company_credentials["secret_key"],
            aws_session_token=company_credentials["token"],
            config=Config(
                signature_version="v4",
            ),
        )
        self.caches = dict()

    def create_s3_bucket(self, company_credentials, company_bucket):
        # create the resource
        self._s3 = boto3.resource(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=company_credentials["access_key"],
            aws_secret_access_key=company_credentials["secret_key"],
            aws_session_token=company_credentials["token"],
        )

        # create the bucket
        self.bucket = self._s3.Bucket(company_bucket)

    def put_object(self, key, data, **kwargs):
        (content_type, _) = mimetypes.guess_type(key)
        body = convert_to_byte(data)
        body_hash = hashlib.md5(body.getvalue(), usedforsecurity=False).digest()  # noqa: S303
        content_md5 = base64.b64encode(body_hash).decode("utf-8")

        return self._invoke_object(
            key,
            "put",
            **kwargs,
            Body=body,
            ACL="private",
            ServerSideEncryption="aws:kms",
            SSEKMSKeyId=self.kms_key_id,
            ContentMD5=content_md5,
            ContentType=content_type,
            # TODO setup tagging and metadata on written files
            # Tagging='string',
            # Metadata={
            #     'string': 'string'
            # },
        )

    def _delete_object(self, key: str):
        return self._invoke_object(key, "delete")

    def delete_object(self, obj_name: list[str]):
        s3_path = ["prod", "mavis", *obj_name]
        s3_key = "/".join(s3_path)

        self._delete_object(s3_key)

    def get_object(self, key: str):
        return self._invoke_object(key, "get")

    @tracer.start_as_current_span("get_file")
    def get_file(
        self,
        load_from: list[str] | str,
        is_temp=False,
        within_minutes=None,
        raise_on_error=False,
        cache=False,
    ) -> dict | tuple[str, bytes] | None:
        """
        Gets a file from s3
        """
        s3_key = _s3_key(load_from, is_temp)

        if cache and s3_key in self.caches.keys():
            logger.debug("returning from cache", s3_key=s3_key)
            return self.caches[s3_key]

        try:
            s3_data = self.get_object(s3_key)
        except Exception as e:
            if raise_on_error:
                raise e
            else:
                logger.info("Filed to get file", error=str(e))
                if cache:
                    self.caches[s3_key] = None
                return None

        # Handle missing data
        last_modified: datetime = s3_data["LastModified"]
        time_since_uploaded = datetime.now(UTC) - last_modified
        if (
            within_minutes
            # grab the full time
            and (time_since_uploaded.days * 60 * 24 + time_since_uploaded.seconds / 60) > within_minutes
        ):
            logger.debug(
                "File is too old",
                s3_key=s3_key,
                last_modified=last_modified.isoformat(),
            )
            return None

        if s3_data["ContentType"] == "application/json":
            body = s3_data["Body"]
            raw_data = body.read().decode("utf-8")
            body.close()
            # load the data
            json_obj: dict = json.loads(raw_data)
            json_obj["last_modified_at"] = last_modified.isoformat()

            if cache:
                logger.debug("save the data in cache", s3_key=s3_key)
                self.caches[s3_key] = json_obj

            return json_obj
        else:
            return s3_data["ContentType"], s3_data["Body"]._raw_stream.data

    @tracer.start_as_current_span("delete_object")
    def delete_file(self, obj_name: list[str]):
        s3_key = _s3_key(obj_name)
        try:
            self.delete_object(s3_key)
        except Exception as e:
            logger.error("Filed to delete file", error=str(e))

    @tracer.start_as_current_span("expire_file")
    def expire_file(self, obj_name: list[str], expire_in_days: int = 30):
        self.upload_object(
            self.get_object(obj_name),
            obj_name,
            expire_in_days=expire_in_days,
        )

    @tracer.start_as_current_span("list_all_files")
    def list_all_files(self, file_path: list[str]):
        """
        gets a segment for a slug
        """
        load_from = _s3_key(file_path)
        items = [item for item in self.bucket.objects.filter(Prefix=load_from)]
        logger.info("List from s3", load_from=load_from, total_found=len(items))

        # add slugs
        all_slugs = []
        for item in items:
            all_slugs.append(
                {
                    "last_modified_at": item.last_modified.isoformat(),
                    "key": item.key,
                    "slug": item.key.split("/")[-1].split(".")[0],
                }
            )

        return all_slugs

    @tracer.start_as_current_span("upload_object")
    def upload_object(self, data, obj_name: list[str] | str, is_temp=False, expire_in_days: int = None):
        """
        Uploads a file to s3
        """
        s3_key = _s3_key(obj_name)

        logger.info("Uploading to s3", s3_key=s3_key, size=sys.getsizeof(data))

        if expire_in_days:
            self.put_object(
                s3_key,
                data,
                Expires=datetime.now(UTC) + timedelta(days=expire_in_days),
            )
        else:
            self.put_object(s3_key, data)

        return s3_key

    def get_object_meta(self, key: str):
        return self._invoke_object(key, "load")

    @tracer.start_as_current_span("generate_presigned_url")
    def generate_presigned_url(
        self,
        client_method: str,
        params: dict,
        expires_in: datetime,
        http_method: str,
    ) -> str:
        set_current_span_attributes(op="generate_presigned_url", key=params.get("Key"))

        return self.s3_client.generate_presigned_url(
            ClientMethod=client_method,
            Params={
                **params,
                "Bucket": self.bucket.name,
            },
            ExpiresIn=expires_in,
            HttpMethod=http_method,
        )

    def upload_file(self, file_path, obj_name: list[str], is_temp=False):
        """
        Uploads a file to s3
        """
        s3_key = _s3_key(obj_name)

        logger.info("Uploading to s3", s3_key=s3_key)
        self._upload_file(s3_key, file_path)
        return s3_key

    def _upload_file(self, key, file_path):
        try:
            self.s3_client.upload_file(
                file_path,
                self.bucket.name,
                key,
                ExtraArgs=dict(
                    ACL="private",
                    ServerSideEncryption="aws:kms",
                    SSEKMSKeyId=self.kms_key_id,
                ),
            )
        except ClientError as e:
            logger.error(e)
            return False
        return True

    def _invoke_object(self, key: str, operation: str, **kwargs):
        set_current_span_attributes(op=operation, key=key)

        try:
            # dynamically load and call an operation on an Object
            # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.Object
            func = getattr(self.bucket.Object(key), operation)
            return func(**kwargs)
        except self._s3.meta.client.exceptions.NoSuchKey as e:
            raise FileNotFoundError(f"Unable to {operation} {key}") from e
        except ClientError as e:
            if "ExpiredToken" in get_error_message(e):
                # if the token is expired, then we need to refresh the credentials and try again
                company_credentials = get_credentials(self.company_slug, self.company_role_arn, refresh_cache=True)
                # recreate the bucket
                self.create_s3_bucket(company_credentials, self.bucket.name)
                self.s3_client = boto3.client(
                    "s3",
                    region_name=settings.aws_region,
                    aws_access_key_id=company_credentials["access_key"],
                    aws_secret_access_key=company_credentials["secret_key"],
                    aws_session_token=company_credentials["token"],
                    config=Config(
                        signature_version="v4",
                    ),
                )
                return self._invoke_object(key, operation, **kwargs)
            else:
                raise e
