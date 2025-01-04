import ldclient
from cachetools import TTLCache, cached
from ldclient.config import Config

from core.models.settings import settings
from core.models.user import AuthenticatedUser

ldclient.set_config(
    Config(
        sdk_key=(settings.launch_darkly_key.get_secret_value() if settings.launch_darkly_key else None),
        diagnostic_opt_out=True,
    )
)

flags_client = ldclient.get()


def get_flags_user(company: str, email: str | None, user_id: str | None):
    """
    Takes company and user data and returns a Context object for LaunchDarkly. Anything on this object can be used for
    targeting.

    For batch jobs that do not run in the context of a company, a `company:no-user` user will be created to target the
    company itself.
    """
    return (
        ldclient.Context.builder("user")
        .key(f"{company}:{email}" if email else f"{company}:no-user")
        .set("email", email)
        .set("company", company)
        .set("user_id", user_id)
        .build()
    )


@cached(cache=TTLCache(maxsize=20, ttl=1800))
def _should_show_flag(flag_name, company_slug: str, email: str | None, user_id: str | None):
    context = get_flags_user(company_slug, email, user_id)
    return flags_client.variation(flag_name, context, False)


def should_show_flag(flag_name, user: AuthenticatedUser):
    if user.company.slug == "test":
        return False
    return _should_show_flag(flag_name, user.company.slug, user.email, user.id)
