import json

import requests
from github import Consts, Github, GithubIntegration, PaginatedList, Repository, enable_console_debug_logging
from ssm_cache import SecretsManagerParameter

from core.logger import get_logger
from core.models.settings import settings

logger = get_logger()

if settings.is_local:
    enable_console_debug_logging()

try:
    GITHUB_APP_CONFIG = (
        SecretsManagerParameter(settings.github_app_secrets_ref)
        if settings.github_app_secrets_ref is not None
        else None
    )
    GITHUB_APP_SECRETS: dict = json.loads(GITHUB_APP_CONFIG.value) if GITHUB_APP_CONFIG is not None else {}
except Exception:
    logger.exception()
    GITHUB_APP_SECRETS = {}

integration = GithubIntegration(
    integration_id=GITHUB_APP_SECRETS.get("GITHUB_APP_ID"),
    private_key=GITHUB_APP_SECRETS.get("GITHUB_PRIVATE_KEY"),
)


class GithubClient:
    def __init__(self, company_slug: str, installation_id: int, target_repo: str | None) -> None:
        self.company_slug = company_slug
        self.installation_id = installation_id
        self.target_repo = target_repo

        if installation_id is None:
            raise ValueError("Installation ID is required")

    @property
    def client(self):
        """
        Gets a github client authenticated to the company's app install
        """
        access = integration.get_access_token(self.installation_id)
        installation_client = Github(login_or_token=access.token)

        return installation_client

    @property
    def repo(self):
        """
        Gets the company's target repo
        """
        if self.target_repo is None:
            return None

        return self.client.get_repo(self.target_repo, lazy=True)

    @property
    def installation_repos(self):
        """
        Gets all the repos available to a company's github app installation

        Note: PyGithub didn't have a good way to do this, so this drops down into some lower level internals
        """
        access = integration.get_access_token(self.installation_id)

        headers = {
            "Accept": Consts.mediaTypeIntegrationPreview,
            "Authorization": f"Bearer {access.token}",
        }

        class Requester:
            per_page = 30

            def requestJsonAndCheck(self, method, url, parameters, headers):
                response = requests.request(
                    method=method,
                    url=f"https://api.github.com{url}",
                    params=parameters,
                    headers=headers,
                )
                response.raise_for_status()
                return (response.headers, response.json())

        response: PaginatedList.PaginatedList[Repository.Repository] = PaginatedList.PaginatedList(
            contentClass=Repository.Repository,
            requester=Requester(),
            firstUrl="/installation/repositories",
            firstParams={},
            headers=headers,
            list_item="repositories",
        )

        return list(response)
