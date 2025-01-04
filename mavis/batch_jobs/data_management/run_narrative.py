from time import sleep

from opentelemetry.trace import get_current_span

from core.api.customer_facing.reports.helpers import run_report
from core.api.customer_facing.reports.utils import NarrativeManager
from core.api.v1.narrative.helpers import get_dynamic_narrative
from core.api.v1.narrative.models import DynamicInput
from core.decorators import mutex_task, with_mavis
from core.logger import get_logger, set_contextvars
from core.util.opentelemetry import set_current_span_attributes
from core.utils import date_add, utcnow
from core.v4.analysisGenerator import assemble_narrative
from core.v4.mavis import Mavis

logger = get_logger()


@mutex_task(queue_name="narratives")
@with_mavis
def run_narrative(mavis: Mavis, slug: str = None, **kwargs):
    if nar_id := kwargs.get("id"):
        manager = NarrativeManager(mavis=mavis)
        details = manager.run(nar_id)

        # rerun all the caches
        used_filters = manager.get_used_filters(nar_id)
        for used_filt in used_filters.used_filters:
            run_report(
                mavis,
                nar_id,
                details.config,
                version_id=details.version_id,
                run_key=details.run_key,
                applied_filters=used_filt.filters,
            )

    else:
        old_narrative_run(mavis, slug, **kwargs)


def old_narrative_run(mavis: Mavis, slug: str, **kwargs):
    set_contextvars(narrative_slug=slug)
    set_current_span_attributes(narrative_slug=slug)

    nar = assemble_narrative(mavis, slug)
    nar_options = nar["narrative"].get("dynamic_options") or []
    dynamic_options = {f["name"]: f["value_options"] for f in nar_options}
    views = NarrativeManager(mavis=mavis).get_views(slug)

    # process all the values
    for view in views["views"].values():
        if view and view["current_time"] > date_add(utcnow(), "day", -15):
            if any(
                dynamic_options.get(tv["name"]) and tv["value"] not in dynamic_options[tv["name"]]
                for tv in view["dynamic_fields"]
            ):
                continue

            try:
                sleep(5)
                get_dynamic_narrative(
                    mavis,
                    slug,
                    nar["output_key"].split("/")[-1][:-5],
                    [DynamicInput(**tv) for tv in view["dynamic_fields"]],
                )
            except Exception as e:
                logger.exception("Failed to get dynamic narrative")
                get_current_span().record_exception(e)
