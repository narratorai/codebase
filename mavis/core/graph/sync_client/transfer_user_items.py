from typing import Any, List, Optional

from .base_model import BaseModel


class TransferUserItems(BaseModel):
    update_dataset: Optional["TransferUserItemsUpdateDataset"]
    update_narrative: Optional["TransferUserItemsUpdateNarrative"]
    update_chat: Optional["TransferUserItemsUpdateChat"]
    update_transformation: Optional["TransferUserItemsUpdateTransformation"]


class TransferUserItemsUpdateDataset(BaseModel):
    returning: List["TransferUserItemsUpdateDatasetReturning"]


class TransferUserItemsUpdateDatasetReturning(BaseModel):
    id: Any


class TransferUserItemsUpdateNarrative(BaseModel):
    returning: List["TransferUserItemsUpdateNarrativeReturning"]


class TransferUserItemsUpdateNarrativeReturning(BaseModel):
    id: Any


class TransferUserItemsUpdateChat(BaseModel):
    returning: List["TransferUserItemsUpdateChatReturning"]


class TransferUserItemsUpdateChatReturning(BaseModel):
    id: Any


class TransferUserItemsUpdateTransformation(BaseModel):
    returning: List["TransferUserItemsUpdateTransformationReturning"]


class TransferUserItemsUpdateTransformationReturning(BaseModel):
    id: Any


TransferUserItems.update_forward_refs()
TransferUserItemsUpdateDataset.update_forward_refs()
TransferUserItemsUpdateDatasetReturning.update_forward_refs()
TransferUserItemsUpdateNarrative.update_forward_refs()
TransferUserItemsUpdateNarrativeReturning.update_forward_refs()
TransferUserItemsUpdateChat.update_forward_refs()
TransferUserItemsUpdateChatReturning.update_forward_refs()
TransferUserItemsUpdateTransformation.update_forward_refs()
TransferUserItemsUpdateTransformationReturning.update_forward_refs()
