import pytest

from core.errors import MissingCompanyError


def test_initialize_missing_slug(monkeypatch):
    monkeypatch.undo()

    from core.models.company import initialize_company

    with pytest.raises(MissingCompanyError):
        initialize_company(None)  # type: ignore


def test_initialize(company):
    from core.models.company import initialize_company

    # We can pass anything to this function, but it is going to return a mocked company object
    new_company = initialize_company("mocked")
    assert company == new_company
