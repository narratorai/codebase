from functools import wraps

from core.api.auth import get_current_company_for_user
from core.errors import InvalidPermission
from core.v4.mavis import initialize_mavis


def require_admin(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.user.is_admin:
            raise InvalidPermission("Admin privileges are required to perform this action.")
        return func(self, *args, **kwargs)

    return wrapper


def ensure_mavis(func):
    """
    Decorator to ensure that a mavis instance is initialized before calling the ~method~.
    """

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.mavis:
            self.mavis = initialize_mavis(self.user.company.slug, self.user.id)

        if self.company is None:
            self.company = self.mavis.company
        if self.user is None:
            self.user = self.mavis.user
        return func(self, *args, **kwargs)

    return wrapper


def ensure_company(func):
    """
    Decorator to ensure that a mavis instance is initialized before calling the ~method~.
    """

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.company:
            if self.mavis:
                self.company = self.mavis.company
            else:
                self.company = get_current_company_for_user(self.user)

        if not self.user:
            self.user = self.company.user
        # return the same data
        return func(self, *args, **kwargs)

    return wrapper
