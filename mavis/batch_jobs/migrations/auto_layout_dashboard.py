from core.api.customer_facing.reports.utils import NarrativeManager
from core.decorators import with_mavis
from core.models.ids import get_uuid
from core.v4.mavis import Mavis


@with_mavis
def auto_layout_dashboard(mavis: Mavis, narrative_slug: str, **kwargs):
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(narrative_slug)
    nar = narrative_updator.get_config(narrative_id)

    for s in nar["narrative"]["sections"]:
        if s.get("id") is None:
            s["id"] = get_uuid()
        x = 0
        y = 0
        nx = 0
        ny = 0
        for c in s["content"]:
            if c["type"] == "metric_v2":
                if x == 0:
                    x = 2

                w = 2
                h = 2

                # show values
                if c["data"].get("add_comparison"):
                    h += 1
                if c["data"].get("show_values_in_plot"):
                    h += 2

                nx = x + w
                ny = y

                # new row
                if nx > 10:
                    nx = 0
                    ny = y + h

            elif c["type"] == "plot_v2":
                w = 8
                x = 2
                h = 9
                ny = y + h
                nx = 0

            elif c["type"] == "markdown":
                w = 8
                x = 2
                h = 1 + round(len(c["text"].split("\n")) / 3)
                ny = y + h
                nx = 0

            # fix
            c["grid_layout"] = dict(w=w, h=h, x=x, y=y)

            y = ny
            x = nx

    NarrativeManager(mavis=mavis).update_config(narrative_slug, nar)
