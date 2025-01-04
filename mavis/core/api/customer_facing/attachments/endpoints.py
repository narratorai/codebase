import mimetypes
from typing import Annotated

from fastapi import APIRouter, Depends, File, Response, UploadFile

from core.api.auth import get_current_company
from core.models.company import Company
from core.models.ids import get_uuid4

from .models import AttachmentInput, AttachmentOutput

router = APIRouter(prefix="/attachments", tags=["attachment"])


@router.get(
    "/{id}.{ext}",
    response_model=AttachmentInput,
    name="Get an attachment",
    description="Returns a company attachment",
)
async def get_attchment(id: str, ext: str, company: Company = Depends(get_current_company)):
    if file := company.s3.get_file(["media", f"{id}.{ext}"]):
        media_type, content = file
        media_type = "application/pdf" if ext == "pdf" else "image/png"
        return Response(content=content, media_type=media_type)
    else:
        raise FileNotFoundError


@router.post(
    "",
    response_model=AttachmentOutput,
    name="Save an attachment",
    description="Saves an attachment to the company encrypted storage",
)
async def save_attachment(
    file: Annotated[UploadFile, File()],
    company: Company = Depends(get_current_company),
):
    return _upload_attachment(company, file)


def _upload_attachment(company: Company, file: Annotated[UploadFile, File()]):
    data = file.file.read()
    file_extension = mimetypes.guess_extension(file.content_type or "application/octet-stream", strict=False)
    if not file_extension:
        raise TypeError("Invalid file type")

    file_extension = file_extension[1:] if file_extension.startswith(".") else file_extension
    attchment_id = get_uuid4()

    company.s3.upload_object(data, ["media", f"{attchment_id}.{file_extension}"])

    return dict(id=attchment_id, file_extension=file_extension)
