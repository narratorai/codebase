import importlib
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from moto import mock_aws

import core
import core.logger
import core.models.company
import core.v4
import core.v4.mavis
from core.models.company import Company
from core.models.company import company_status_enum as CompanyStatusEnum
from core.models.user import AuthenticatedUser, UserCompany, UserTags


### UTIL Fixtures
@pytest.fixture(scope="function")
def no_requests(monkeypatch):
    """Remove requests.sessions.Session.request for a test to ensure no requests are made"""
    monkeypatch.delattr("requests.sessions.Session.request")


### AWS Fixtures
@pytest.fixture(scope="function", autouse=True)
def aws_credentials(monkeypatch):
    """Mocked AWS Credentials for moto."""
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing_key_id")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing_access_key")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing_security_token")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing_session_token")


@pytest.fixture(scope="function")
def s3(aws_credentials):
    """Mocked S3 Client for tests."""
    with mock_aws():
        import boto3

        yield boto3.client("s3")


@pytest.fixture(scope="function")
def sts(aws_credentials):
    """Mocked STS Client for tests."""
    with mock_aws():
        import boto3

        yield boto3.client("sts")


@pytest.fixture(scope="function")
def ssm(aws_credentials):
    """Mocked SSM Client for tests."""
    with mock_aws():
        import boto3

        yield boto3.client("ssm")


@pytest.fixture(scope="function")
def sns(aws_credentials):
    """Mocked SNS Client for tests."""
    with mock_aws():
        import boto3

        yield boto3.client("sns")


@pytest.fixture(scope="function")
def sqs(aws_credentials):
    """Mocked SQS Client for tests."""
    with mock_aws():
        import boto3

        yield boto3.client("sqs")


### MAVIS Fixtures


@pytest.fixture(scope="function")
def company(s3, sts):
    """Mocked Company"""
    slug = "test-company"
    bucket = "TEST_COMPANY_BUCKET"
    logger = core.logger.get_logger(__name__).new(company=slug)

    # Create a fake bucket for the company
    s3.create_bucket(Bucket=bucket)

    company_id = str(uuid.UUID(int=0))
    return Company(
        id=company_id,
        updated_at="2020-01-10T00:00:00",
        logger=logger,
        slug=slug,
        name="TEST COMPANY",
        status=CompanyStatusEnum.active,
        production_schema="test-prod",
        materialize_schema="test-mv",
        warehouse_language="redshift",
        timezone="UTC",
        cache_minutes=5,
        index_warehouse_count=0,
        resources={
            "s3_bucket": bucket,
            "company_role": "TEST_COMPANY_FAKE_ROLE",
            "kms_key": "TEST_COMPANY_KEY",
        },
        current_user=AuthenticatedUser(
            id="5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1",
            email="ahmed@narrator.ai",
            tags=UserTags(favorite=None, recently_viewed=None),
            is_internal_admin=True,
            is_admin=True,
            company=UserCompany(
                id=company_id,
                slug=slug,
                name="TEST COMPANY",
                everyone_team_id=str(uuid.UUID(int=0)),
                auth0_org_id="",
            ),
        ),
    )


@pytest.fixture(autouse=True)
def mock_init_company(monkeypatch, company):
    """initialize company auto-mocked to return a fixture"""

    def mock_init(*args, **kwargs):
        return company

    monkeypatch.setattr(core.models.company, "initialize_company", mock_init)

    # Clear importlib cache so imports get the mock
    importlib.invalidate_caches()


@pytest.fixture(scope="function")
def graph_client(ssm):
    """Mocked Graph Client"""
    # FIXME


@pytest_asyncio.fixture(scope="function")
async def test_app(sts, company):
    """
    API client
    Note the company query param is automatically included, others can be added per-request
    """
    from core.api.main import app

    async def test_app(scope, receive, send):
        await app(scope, receive, send)

    client = AsyncClient(app=test_app, base_url="http://test", params={"company": company.slug})
    yield client

    # Cleanup: client must be manually closed
    await client.aclose()
