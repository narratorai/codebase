import json
from urllib.parse import parse_qs, urlparse

import pytest

from core.s3_data import S3Data, get_credentials


@pytest.fixture()
def company_s3(s3):
    """
    S3 Fixture with a mock company bucket created
    """
    s3.create_bucket(Bucket="test_s3_bucket")
    return s3


def get_data_client():
    return S3Data(
        company_slug="test",
        company_role_arn="test_company_role_arn",
        company_bucket="test_s3_bucket",
        company_key_id="test_kms_key",
    )


def test_init():
    data = get_data_client()
    assert data.company_slug == "test"
    assert data.bucket.name == "test_s3_bucket"


def test_refresh_credentials(sts):
    credentials = get_credentials("test", "test_company_role_arn")

    assert isinstance(credentials.get("access_key"), str)
    assert isinstance(credentials.get("secret_key"), str)
    assert isinstance(credentials.get("token"), str)


def test_put_object_missing_bucket(sts, s3):
    data = get_data_client()

    with pytest.raises(data._s3.meta.client.exceptions.NoSuchBucket):
        data.put_object(key="test.json", data=json.dumps({"test": True}))


def test_put_object(sts, company_s3):
    data = get_data_client()

    # Upload a fake object
    test_data = {"test": True}
    data.put_object(key="test.json", data=json.dumps(test_data))

    result = company_s3.get_object(Bucket=data.bucket.name, Key="test.json")
    saved_data = json.loads(result["Body"].read())

    assert saved_data == test_data


def test_delete_object_missing_file(sts, company_s3):
    data = get_data_client()
    data._delete_object(key="test.json")


def test_delete_object(sts, company_s3):
    data = get_data_client()

    # Put a fake object
    data.put_object(key="test.json", data=json.dumps({"test": True}))

    # Delete it
    data._delete_object(key="test.json")

    # Try to get it and expect NoSuchKey
    with pytest.raises(company_s3.exceptions.NoSuchKey):
        company_s3.get_object(Bucket=data.bucket.name, Key="test.json")


def test_get_object(sts, company_s3):
    data = get_data_client()

    # Put a fake object
    test_data = {"test": True}
    data.put_object(key="test.json", data=json.dumps(test_data))

    # Get it
    result = data.get_object(key="test.json")

    saved_data = json.loads(result["Body"].read())
    assert saved_data == test_data


def test_get_object_meta(sts, company_s3):
    data = get_data_client()

    # Put a fake object
    test_data = {"test": True}
    data.put_object(key="test.json", data=json.dumps(test_data))

    # Get meta
    data.get_object_meta(key="test.json")


def test_get_object_missing_file(sts, company_s3):
    data = get_data_client()

    # Get a file that doesn't exist
    with pytest.raises(FileNotFoundError) as excinfo:
        data.get_object(key="test.json")

    assert "Unable to get test.json" in str(excinfo.value)


def test_generate_presigned_url(sts, company_s3):
    data = get_data_client()
    credentials = get_credentials("test", "test_company_role_arn")

    result = data.generate_presigned_url(
        http_method="get",
        client_method="get_object",
        params={
            "ResponseContentType": "application/json",
            "Key": "test.json",
        },
        expires_in=900,
    )

    assert isinstance(result, str)

    parsed = urlparse(result)
    query = parse_qs(parsed.query)

    assert parsed.path == "/test_s3_bucket/test.json"
    assert query.get("response-content-type") == ["application/json"]
    assert [query["X-Amz-Credential"][0].split("/")[0]] == [credentials.get("access_key")]
    assert "X-Amz-Expires" in query
    assert "X-Amz-Signature" in query
