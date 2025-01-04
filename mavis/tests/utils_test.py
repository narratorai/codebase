import datetime as dt

import pytest

from core import utils
from core.util.mutex import create_mutex_key
from core.utils import get_required_fields, slug_path, without_keys


def test_without_keys():
    test_obj = without_keys({"some": "stuff", "secret": "this should be removed"}, ("secret"))

    assert test_obj.get("secret") is None
    assert test_obj.get("some") is not None


@pytest.mark.parametrize(
    "input, expected",
    [
        (None, None),
        ("", ""),
        (1, 1),
        ("1", "1"),
        ("$", "$"),
        ("foo", "foo"),
        ("Foo", "Foo"),
        ("Foo@o", "Foo@o"),
        (["foo", "$"], "foo_or"),
        (["foo", "$_"], "foo_or"),
        (["foo", "$_!@#$%^&"], "foo_or"),
        (["foo", "bar"], "foo_or_bar"),
        (["foo", "$bar"], "foo_or_bar"),
        (["foo", "Foo@o"], "foo_or_foo_o"),
        (["Foo@1", "bar"], "foo_1_or_bar"),
    ],
)
def test_slug_path(input, expected):
    assert slug_path(input) == expected


@pytest.mark.parametrize(
    "input, expected",
    [
        ("this is a test with one {field}", ["field"]),
        ("this is a {test} with multiple {fields}", ["test", "fields"]),
        (
            "this is a {test} with weird {fields} {{double_curley}} {field*} {field name}",
            ["test", "fields", "double_curley"],
        ),
    ],
)
def test_get_required_fields(input, expected):
    assert get_required_fields(input) == expected


@pytest.mark.parametrize(
    "input, expected",
    [
        (("0 0 * * *", None), ("0 0 * * *")),
        (("? 4 * * *", None), ("8 4 * * *")),
        (("? 4 * * *", dt.datetime.fromisoformat("2018-01-01T04:33")), ("33 4 * * *")),
        (("? 4 * * *", dt.datetime.fromisoformat("2018-01-01T04:33")), ("33 4 * * *")),
        (("0 4 1 * *", dt.datetime.fromisoformat("2018-01-01T04:33")), ("0 4 1 * *")),
        (("0 ? 1 * *", dt.datetime.fromisoformat("2018-01-01T06:33")), ("0 6 1 * *")),
    ],
)
def test_fix_cron(input, expected):
    assert utils._fix_cron(input[0], input[1]) == expected


# def test_sort_jobs_by_dependency():
#     job1 = CompanyJob("1", "1", "1", "1", 0, 0, company_job_execution_environment_enum.batch)
#     job2 = CompanyJob(
#         "2",
#         "2",
#         "2",
#         "2",
#         0,
#         0,
#         company_job_execution_environment_enum.batch,
#         depends_on="1",
#     )
#     job3 = CompanyJob(
#         "3",
#         "3",
#         "3",
#         "3",
#         0,
#         0,
#         company_job_execution_environment_enum.batch,
#         depends_on="1",
#     )
#     job4 = CompanyJob(
#         "4",
#         "4",
#         "4",
#         "4",
#         0,
#         0,
#         company_job_execution_environment_enum.batch,
#         depends_on="2",
#     )
#     job5 = CompanyJob(
#         "5",
#         "5",
#         "5",
#         "5",
#         0,
#         0,
#         company_job_execution_environment_enum.batch,
#         depends_on="4",
#     )
#     job6 = CompanyJob("6", "6", "6", "6", 0, 0, company_job_execution_environment_enum.batch)

#     jobs = [job1, job2, job3, job4, job5, job6]
#     result = utils.sort_jobs_by_dependency(jobs)

#     assert len(result) == len(jobs)
#     assert result == [job1, job6, job2, job3, job4, job5]


@pytest.mark.parametrize(
    "cron, tz, test_now, expected",
    [
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T00:55:00",
            "2017-12-31T17:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T01:01:59",
            "2017-12-31T17:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T01:02:00",
            "2017-12-31T18:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T01:02:01",
            "2017-12-31T18:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T01:20:00",
            "2017-12-31T18:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/Los Angeles",
            "2018-01-01T01:59:00",
            "2017-12-31T18:02:00-08:00",
        ),
        (
            "2 */1 * * *",
            "America/New York",
            "2018-01-01T01:59:00",
            "2017-12-31T21:02:00-05:00",
        ),
        ("2 */1 * * *", "UTC", "2018-01-01T01:59:00", "2018-01-01T02:02:00+00:00"),
    ],
)
def test_next_run(cron, tz, test_now, expected):
    assert utils.next_run(tz, cron, test_now, None).isoformat() == expected


@pytest.mark.parametrize(
    "cron, tz, test_now, expected",
    [
        ("2 */1 * * *", "America/Los Angeles", "2017-12-31T17:01:59", False),
        ("2 */1 * * *", "America/Los Angeles", "2017-12-31T17:02:00", True),
        ("2 */1 * * *", "America/Los Angeles", "2017-12-31T17:02:01", True),
        ("2 */1 * * *", "America/Los Angeles", "2017-12-31T17:02:59", True),
        ("2 */1 * * *", "America/Los Angeles", "2017-12-31T17:03:00", False),
    ],
)
def test_should_cron_run(cron, tz, test_now, expected):
    assert utils.should_cron_run(tz, cron, test_now) == expected


@pytest.mark.parametrize(
    "company_slug, fn, kwargs",
    [("narrator", print, {})],
    ids=["default"],
)
def test_create_mutex_key_default(company_slug, fn, kwargs):
    key = create_mutex_key(company_slug, fn, kwargs)
    assert key == "worker_mutex:narrator:print"


# Test with additional kwargs
@pytest.mark.parametrize(
    "company_slug, fn, kwargs",
    [("narrator", print, {"task_id": "b4e770bb-3449-461b-87e8-f5642de27745"})],
    ids=["with_kwargs"],
)
def test_create_mutex_key_with_kwargs(company_slug, fn, kwargs):
    key = create_mutex_key(company_slug, fn, kwargs)
    assert key == "worker_mutex:narrator:print"


@pytest.mark.parametrize(
    "company_slug, fn, kwargs, check_args",
    [("narrator", print, {"task_id": "b4e770bb-3449-461b-87e8-f5642de27745"}, True)],
    ids=["with_check_args"],
)
def test_create_mutex_key_with_check_args(company_slug, fn, kwargs, check_args):
    key = create_mutex_key(company_slug, fn, kwargs, check_args)
    assert key == "worker_mutex:narrator:print:da39a3ee5e6b4b0d3255bfef95601890afd80709"


@pytest.mark.parametrize(
    "company_slug, fn, kwargs, check_args",
    [("narrator", print, {"task_id": "b4e770bb-3449-461b-87e8-f5642de27745", "company_slug": "narrator"}, True)],
    ids=["with_check_args_keeps_kwargs_intact"],
)
def test_create_mutex_key_with_check_args_keeps_kwargs_intact(company_slug, fn, kwargs, check_args):
    create_mutex_key(company_slug, fn, kwargs, check_args)
    assert kwargs == {"task_id": "b4e770bb-3449-461b-87e8-f5642de27745", "company_slug": "narrator"}


@pytest.mark.parametrize(
    "company_slug,fn,kwargs",
    [("narrator", 123, {})],
    ids=["invalid_fn_type"],
)
def test_create_mutex_key_invalid_fn_type(company_slug, fn, kwargs):
    with pytest.raises(AttributeError):
        create_mutex_key(company_slug, fn, kwargs)


@pytest.mark.parametrize(
    "company_slug,fn,kwargs",
    [("narrator", print, "kwargs")],
    ids=["invalid_kwargs_type"],
)
def test_create_mutex_key_invalid_kwargs_type(company_slug, fn, kwargs):
    with pytest.raises(ValueError):
        create_mutex_key(company_slug, fn, kwargs)
