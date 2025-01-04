import json
import time

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.api.auth import AuthenticatedUser, get_current_company, get_current_user
from core.models.company import Company

router = APIRouter(prefix="/test", tags=["test"])


class PingInput(BaseModel):
    ping: str = Field(..., title="The ping to be ponged")


class PingOutput(BaseModel):
    ping: str = Field(..., title="The ping that was ponged")
    company: str


class UserOutput(BaseModel):
    user_id: str
    user_email: str
    user_role: str
    company_user_role: str | None
    is_super_admin: bool
    is_company_admin: bool


class BadResponseModel(BaseModel):
    foo: str


@router.get("/ping", response_model=PingOutput)
async def get_ping(
    pong: str | None = "pong",
    current_company: Company = Depends(get_current_company),
):
    """
    Sanity check.

    This will let the user know that the service is operational.
    """
    return {"ping": pong, "company": current_company.slug}


@router.get("/ping/{pong}", response_model=PingOutput)
async def get_ping_with_path(
    pong: str,
    current_company: Company = Depends(get_current_company),
):
    """
    Sanity check.

    This will let the user know that the service is operational.
    """
    return {"ping": pong, "company": current_company.slug}


@router.post("/ping", response_model=PingOutput)
async def post_ping(
    input: PingInput,
    current_company: Company = Depends(get_current_company),
):
    """
    Sanity check.

    This will let the user know that the service is operational.
    """
    return {"ping": input.ping, "company": current_company.slug}


@router.get("/user", response_model=UserOutput)
async def test_user(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Sanity check.

    Makes sure user id and email and role properties are set.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_super_admin": current_user.is_super_admin,
        "company_user_role": current_user.company_user_role,
        "is_company_admin": current_user.user_is_company_admin,
    }


@router.post("/stream", response_model=None)
async def test_stream():
    return StreamingResponse(stream_generator(), media_type="text/event-stream")


def stream_generator():
    response = {
        "id": "4f2e52a5-edf0-44e8-891a-dc50445b4c42",
        "type": "json",
        "role": "mavis",
        "agent": None,
        "data": "",
    }

    code = [
        "// Warning: This code is not meant to be serious!\n",
        "const funnyFunction = () => {\n",
        "    console.log('Why did the JavaScript developer go broke?');\n",
        "    setTimeout(() => {\n",
        "        console.log('Because he lost his domain in a closure!');\n",
        "    }, 3000);\n",
        "};\n",
        "\n",
        "// Invoke the function\n",
        "funnyFunction();\n",
        "// Always remember to laugh at your own code!\n",
    ]

    for line in code:
        response["data"] = response["data"] + line
        print(response)

        yield json.dumps(response)
        time.sleep(3)
