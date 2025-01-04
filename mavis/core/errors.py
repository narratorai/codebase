import ast
from abc import ABC
from dataclasses import dataclass, field

from fastapi import status

from core.utils import get_error_message, human_format, sanitize_event, title


class InternalError(Exception):
    """
    Represents an error that includes context for better logging.
    Example:
        raise InternalError("oh no!", company="narrator")

    For errors raised during a http response, a http_status_code keyword arg controls the error code
    """

    message: str
    code: str
    http_status_code: int
    context: dict = field(default_factory=dict)

    def __init__(
        self,
        message: str,
        *,
        code: str = "InternalError",
        http_status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        **kwargs,
    ):
        self.context = sanitize_event({**kwargs})
        self.message = message
        self.code = code
        self.http_status_code = http_status_code

        super().__init__(message)


class WrappedError(InternalError, ABC):
    """
    Represents an error that includes the original exception.
    """

    original_exception: Exception

    def __init__(self, exc: Exception, **kwargs):
        self.original_exception = exc

        message = str(exc)
        # Pass the original error's http_status_code through, if not present in kwargs
        if hasattr(exc, "http_status_code"):
            kwargs["http_status_code"] = kwargs.get("http_status_code", exc.http_status_code)  # type: ignore

        super().__init__(message, **kwargs)


class SilenceError(InternalError):
    """
    Represents an error that will not be reported to Sentry
    """


class WarehouseRandomError(SilenceError):
    """
    Represents an error in the warehouse that we should just wait to deal with
    """


class ConnectionError(SilenceError):
    pass


class AstevalError(SilenceError):
    pass


@dataclass
class MissingCompanyError(SilenceError):
    """
    Represents an error when its not possible to determine the company for an execution
    """

    message: str = "Missing company slug"
    code: str = "MissingCompany"
    http_status_code: int = status.HTTP_400_BAD_REQUEST


@dataclass
class MissingUserError(SilenceError):
    """
    Represents an error when its not possible to determine the user for an execution
    """

    message: str = "Could not find the user in the company"
    code: str = "MissingUser"
    http_status_code: int = status.HTTP_400_BAD_REQUEST


class InvalidPermission(SilenceError):
    """
    Represents an error when a plot depends on a group slug that no longer exists
    """

    def __init__(self, message: str, **kwargs):
        self.http_status_code = status.HTTP_403_FORBIDDEN
        self.code = "InvalidPermission"
        super().__init__(message, **kwargs)


class MissingDatasetGroupSlug(SilenceError):
    """
    Represents an error when a plot depends on a group slug that no longer exists
    """

    def __init__(self, message: str, **kwargs):
        self.http_status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        super().__init__(message, **kwargs)


class MissingPlotSlug(SilenceError):
    """
    Represents an error when a plot depends on a plot slug that no longer exists
    """

    def __init__(self, message: str, **kwargs):
        self.http_status_code = status.HTTP_404_NOT_FOUND
        super().__init__(message, **kwargs)


class BadLLMResponse(SilenceError):
    pass


class MissingActivities(SilenceError):
    pass


class WehbookError(SilenceError):
    pass


class FieldProcessingError(SilenceError):
    pass


class QueryRunError(SilenceError):
    """
    Represents an error when a query fails to execute for any reason
    """

    message_map = {
        'relation "dw.customer" does not exist': "Missing customer table - please create a customer attribute script",
        # "not found: table" : "Table does not exist",
        # "does not exist" : "Table does not exist"
    }

    def __init__(self, message: str, **kwargs):
        self.http_status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

        def humanize_message():
            for key in QueryRunError.message_map.keys():
                if key in message:
                    return QueryRunError.message_map[key]
            return message

        message = humanize_message()

        super().__init__(message, **kwargs)


class AnalysisInputError(SilenceError):
    def __init__(self, message: str, **kwargs):
        self.http_status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        super().__init__(message, **kwargs)


class GraphError(WrappedError):
    def __init__(self, e, **kwargs):
        try:
            # Errors from the Graph server cam come back with the message as a poorly formatted JSON string
            parsed = ast.literal_eval(get_error_message(e))
            kwargs["extensions"] = parsed["extensions"]
            super().__init__(Exception(parsed["message"]).with_traceback(e.__traceback__), **kwargs)
        except Exception:
            # For other errors, fall-through
            super().__init__(e, **kwargs)


class UnexpectedError(SilenceError):
    pass


class DatasetCompileError(SilenceError):
    pass


class RunDatasetError(WrappedError):
    def __init__(self, exc: Exception, **kwargs):
        self.http_status_code = status.HTTP_400_BAD_REQUEST
        super().__init__(exc, **kwargs)


class InvalidServiceLimit(ValueError):
    pass


class ServiceLimitError(SilenceError):
    def __init__(self, limit_name: str, limit_val: int, **kwargs):
        self.code = "PaymentRequired"
        self.http_status_code = status.HTTP_402_PAYMENT_REQUIRED

        message = f"You have exceeded the {title(limit_name)} (currently: {human_format(limit_val, 'number')}). Please reach out to sales@narrator.ai or visit the plans page to upgrade."

        super().__init__(message, limit_name=limit_name, limit_val=limit_val, **kwargs)


class RunTransformationError(InternalError):
    def __init__(self, error: Exception, *, transformation, retry_count: int):
        self.http_status_code = status.HTTP_400_BAD_REQUEST

        def build_message():
            messages = [
                f"`{transformation.name}` failed to update `{transformation.table}`",
                f"Error: {error}",
                f'We retried {retry_count} time{"s" if retry_count > 1 else ""}',
            ]
            if transformation.next_resync_at:
                messages.append(f"Scheduled resync for: {transformation.next_resync_at}")
            return "\n".join(messages)

        message = build_message()
        super().__init__(
            message,
            transformation_id=transformation.id,
            error=error,
            retry_count=retry_count,
        )


@dataclass
class AuthenticationError(SilenceError):
    message: str = "The provided credentials are invalid"
    code: str = "Unauthorized"
    http_status_code: int = status.HTTP_401_UNAUTHORIZED


@dataclass
class GsheetAuthenticationError(SilenceError):
    message: str = "Missing Permissions! Please share gsheet with reports@narrator.ai"
    code: str = "Unauthorized"
    http_status_code: int = status.HTTP_401_UNAUTHORIZED


@dataclass
class GsheetKeyError(SilenceError):
    message: str = "The google sheetkey you gave cannot be found."
    code: str = "InvalidSheetkey"
    http_status_code: int = status.HTTP_400_BAD_REQUEST


@dataclass
class ForbiddenError(SilenceError):
    message: str = "You do not have permission to access this resource"
    code: str = "Forbidden"
    http_status_code: int = status.HTTP_403_FORBIDDEN


@dataclass
class CompanyArchivedError(SilenceError):
    message: str = "This company has been archived"
    code: str = "CompanyArchived"
    http_status_code: int = status.HTTP_403_FORBIDDEN


@dataclass
class TaskPendingError(SilenceError):
    message: str = "This task has already been scheduled to run"
    code: str = "TaskPending"
    http_status_code: int = status.HTTP_409_CONFLICT
