import logging
from functools import cache

from pydantic import BaseSettings, Extra, SecretStr


class Settings(BaseSettings):
    """
    Application settings based on environment variables.
    These are provided by doppler.
    """

    stage: str = "local"
    env: str = "development"

    api_token_secret_key: SecretStr
    """Secret key used to sign Paseto tokens"""

    auth0_audience: str
    auth0_domain: str
    auth0_client_id: str
    auth0_client_secret: SecretStr
    auth0_portal_client_id: str
    auth0_issuer: str

    aws_region: str = "us-east-1"
    datacenter_region: str = "US"

    task_type: str = "unknown"
    mavis_path: str = ""

    company_slug: str | None
    """In some paths this is passed as an arg, other times it comes from the env"""

    bucket_directory: str | None
    sqs_queue_url: str

    sentry_dsn: SecretStr
    sentry_monitor_id: str | None
    sentry_traces_sample_rate: float = 1.0

    stripe_key: SecretStr

    # Text Embedding and GPT4 (WEST US 3)
    azure_openai_endpoint: str
    azure_openai_key: SecretStr

    # GPT 3
    azure_west_openai_endpoint: str
    azure_west_openai_key: SecretStr

    openai_key: SecretStr
    bing_api_key: SecretStr

    api_otel_service_name: str
    worker_otel_service_name: str
    honeycomb_api_key: SecretStr
    honeycomb_sample_rate: int = 1
    """1 in sample_rate events, defaults to 1 in 1"""

    launch_darkly_key: SecretStr | None

    git_sha: str | None
    git_branch: str | None

    # Build arguments for docker images,
    # not present in lambdas
    build_label: str | None
    build_revision: str | None
    build_arch: str | None

    mavis_notification_topic: str | None

    graph_domain: str | None
    """The domain of Graph to use"""

    graph_retries: int = 3
    """Number of graph retries to configure client with"""

    github_app_secrets_ref: str | None
    """Github App secrets from secretsmanager"""

    redis_url: str

    postmark_api_key: SecretStr

    opensearch_url: SecretStr
    opensearch_aws_region: str

    # Emails of the super admins that will get data alerts through email
    data_alert_recipients: list[str] = ["ahmed@narrator.ai"]

    # twillio
    twilio_sid: str
    twilio_key: SecretStr
    twilio_number: str

    class Config:
        validate_all = True
        allow_mutation = False
        extra = Extra.ignore

    @property
    def is_production(self):
        return self.env == "production"

    @property
    def is_test(self):
        return self.env == "test"

    @property
    def is_local(self):
        return self.env == "development" or self.stage == "local"

    @property
    def log_level(self):
        return logging.DEBUG if self.is_local else logging.INFO


@cache
def get_settings():
    return Settings()  # type: ignore


settings = get_settings()
