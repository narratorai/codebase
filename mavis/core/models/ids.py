import json
from hashlib import md5
from random import randint
from uuid import UUID, uuid4

from pydantic import BaseModel


class UUIDStr(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        try:
            # Attempt to create a UUID from the string
            UUID(v)
        except ValueError:
            raise ValueError(f"Invalid UUID string: {v}")
        return v


def get_uuid4() -> str:
    return str(uuid4())


def get_uuid(replace=True) -> str:
    if replace:
        return str(uuid4()).replace("-", "_")
    else:
        return str(uuid4())


def get_id() -> str:
    return str(randint(0, 1000000))  # noqa


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except ValueError:
        return False


def to_id(value) -> str:
    if isinstance(value, BaseModel):
        value = value.json()
    elif isinstance(value, dict):
        value = json.dumps(value)
    elif isinstance(value, list):
        value = json.dumps(value)
    else:
        value = str(value)
    return md5(value.encode("utf-8"), usedforsecurity=False).hexdigest()  # noqa
