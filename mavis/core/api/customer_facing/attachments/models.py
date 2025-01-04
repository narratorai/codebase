from ..utils.pydantic import CamelModel


class AttachmentOutput(CamelModel):
    id: str
    file_extension: str


class AttachmentInput(CamelModel):
    pass
