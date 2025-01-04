import base64
import hashlib
import mimetypes

import boto3

from core.decorators import mutex_task, with_mavis
from core.utils import convert_to_byte
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def create_gsheet_keys(mavis: Mavis, **kwargs):
    directory = "/Users/ahmedelsamadisi/Downloads/"

    files = [
        "Customer Sheets IAM Admin (1).json",
        "Customer Sheets IAM Admin (2).json",
        "Customer Sheets IAM Admin (3).json",
        "Customer Sheets IAM Admin.json",
        "Customer Sheets Int.json",
        "IAM Admin Customer Sheets (1).json",
        "IAM Admin Customer Sheets (2).json",
        "IAM Admin Customer Sheets (3).json",
        "IAM Admin Customer Sheets.json",
        "ghseet-14 IAM Admin.json",
    ]

    TOTAL_GSHEET_CRED = 10

    # get all the files
    for ii, file in enumerate(files):
        with open(directory + file) as f:
            file_contents = f.read()
            key = f"gsheet{TOTAL_GSHEET_CRED + ii}.json"

            (content_type, _) = mimetypes.guess_type(key)
            body = convert_to_byte(file_contents)
            body_hash = hashlib.md5(body.getvalue(), usedforsecurity=False).digest()  # noqa: S303
            content_md5 = base64.b64encode(body_hash).decode("utf-8")

            boto3.resource("s3").Bucket("narratorai-keys").put_object(
                Key=key,
                Body=body,
                ACL="private",
                ServerSideEncryption="aws:kms",
                ContentMD5=content_md5,
                ContentType=content_type,
            )
