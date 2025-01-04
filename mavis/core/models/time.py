from datetime import date, datetime, timedelta, timezone
import random

from croniter import croniter
from dateutil import tz as dt_tz


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def today():
    return datetime.now(timezone.utc).date().isoformat()


def minutes_ago(minutes: int):
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


def days_ago(days: int):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def second_diff(start: str, end: str | None = None):
    return date_diff(start, end or utcnow(), "second")


def date_diff(from_date, to_date, datepart):
    from_date = todt(from_date)
    to_date = todt(to_date)
    # fid the s
    datepart += "" if datepart.endswith("s") else "s"

    diff = to_date - from_date
    second_diff = abs(diff.seconds)
    day_diff = abs(diff.days)

    # the dict
    res = dict(
        seconds=(1, 24 * 60 * 60),
        minutes=(1 / 60, 24 * 60),
        hours=(1 / 3600, 24),
        days=(0, 1),
        weeks=(0, 1 / 7),
        months=(0, 1 / 30),
        quarters=(0, 1 / 90),
        years=(0, 1 / 365),
    )
    # deal with the output
    return round(second_diff * res[datepart][0] + day_diff * res[datepart][1], 1)


def remove_tz(s):
    return s.split("+00:00")[0]


def todt(s):
    if isinstance(s, str):
        if len(s) == 10:
            s += "T00:00:00"
        return datetime.fromisoformat(remove_tz(s)).replace(tzinfo=timezone.utc)
    else:
        return s


def unix_time(ds_date):
    if isinstance(ds_date, date):
        ds_date = datetime(ds_date.year, ds_date.month, ds_date.day)
    if not isinstance(ds_date, datetime):
        ds_date = todt(ds_date)
    return ds_date.timestamp()


def pretty_diff(from_date, to_date=None, kind=None):
    if to_date is None:
        to_date = utcnow()

    from_date = todt(from_date)
    to_date = todt(to_date)

    if kind is None:
        if to_date >= from_date:
            kind = "past"
        else:
            kind = "future"

    diff = to_date - from_date

    second_diff = abs(diff.seconds)
    day_diff = abs(diff.days)
    return pretty_duration(second_diff, day_diff, kind)


def pretty_duration(second_diff, day_diff, kind=None):
    if second_diff < 0:
        name = ""

    if day_diff == 0:
        if second_diff < 60:
            name = f"{round(second_diff)} seconds"
        elif second_diff < 120:
            name = "a minute"
        elif second_diff < 3600:
            name = f"{round(second_diff / 60)} minutes"
        elif second_diff < 7200:
            name = "an hour"
        elif second_diff < 86400:
            name = f"{round(second_diff / 3600)} hours"
    elif day_diff == 1:
        if kind == "future":
            return "Tomorrow"
        else:
            return "Yesterday"

    elif day_diff < 7:
        name = f"{round(day_diff)} days"
    elif day_diff < 31:
        name = f"{round(day_diff / 7)} weeks"
    elif day_diff < 365:
        name = f"{round(day_diff / 30)} months"
    else:
        name = f"{round(day_diff / 365)} years"

    if kind == "past":
        name = f"{name} ago"
    elif kind == "future":
        name = f"in {name}"

    return name


def _convert_tz(timestamp, from_tz="UTC", to_tz="UTC"):
    from_time = todt(timestamp)

    from_time = from_time.replace(tzinfo=dt_tz.gettz(from_tz))
    return from_time.astimezone(dt_tz.gettz(to_tz))


def make_local(timestamp, tz, pretty=False):
    new_time = _convert_tz(timestamp, to_tz=tz)
    if pretty:
        if "america" in tz.lower():
            return new_time.strftime("%m/%d/%Y %I:%M %p")
        else:
            return new_time.strftime("%d/%m/%Y %I:%M %p")
    else:
        return new_time.isoformat()[:19]


def is_same_cron(cron1: str, cron2: str) -> bool:
    # checks if the cron is the same and ignores the ?
    parts1 = cron1.split(" ")
    parts2 = cron2.split(" ")
    for p1, p2 in zip(parts1, parts2):
        if p1 not in (p2, "?") and p2 not in (p1, "?"):
            return False
    return True


def update_cron(cron: str) -> str:
    replace_parts = [
        random.randint(0, 59),  # noqa: S311
        random.randint(0, 23),  # noqa: S311
        random.randint(1, 28),  # noqa: S311
        random.randint(1, 12),  # noqa: S311
        random.randint(0, 6),  # noqa: S311
    ]
    parts = cron.split(" ")
    parts = [p if p != "?" else str(replace_parts[ii]) for ii, p in enumerate(parts)]
    fixed = " ".join(parts)

    if not croniter.is_valid(fixed):
        raise ValueError(f"Invalid cron definition {fixed}")

    return fixed
