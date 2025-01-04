from core.api.customer_facing.reports.utils import NarrativeManager
from core.decorators import mutex_task, with_mavis
from core.models.ids import get_uuid
from core.v4.mavis import Mavis


def reset_narrative_content_ids(narrative):
    for section in narrative["sections"]:
        for content in section["content"]:
            content["id"] = get_uuid()


@mutex_task(queue_name="narratives")
@with_mavis
def reset_narrative_ids(mavis: Mavis, narrative_slug: str, **kwargs):
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(narrative_slug)
    nar = narrative_updator.get_config(narrative_id)

    if nar:
        reset_narrative_content_ids(nar["narrative"])
        narrative_updator.update_config(narrative_id, nar)
