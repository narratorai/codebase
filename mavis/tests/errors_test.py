from core.errors import InternalError


def test_internal_error():
    error = InternalError("test exception")
    assert str(error) == "test exception"

    error = InternalError("test exception", http_status_code=418)
    assert error.http_status_code == 418

    error = InternalError("test exception", random="context")
    assert error.context["random"] == "context"
