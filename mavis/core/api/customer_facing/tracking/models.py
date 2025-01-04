from core.api.customer_facing.utils.pydantic import CamelModel


class TrackView(CamelModel):
    path: str
