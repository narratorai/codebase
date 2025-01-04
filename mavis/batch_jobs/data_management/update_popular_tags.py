from collections import defaultdict

from core import utils
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.v4.mavis import Mavis

TOP_N = 20
DAY_WINDOW = 100


def zero_func():
    return 0


@mutex_task()
@with_mavis
def update_popular_tags(mavis: Mavis, **kwargs):
    """
    Updates the popular tag
    """

    tags = graph_client.get_popular_tags(company_id=mavis.company.id).company_tags

    popular_tag = next((tag for tag in tags if tag.tag == "popular"), None)
    recently_viewed_tag = [tag.id for tag in tags if tag.tag == "recently_viewed"]

    # don't deal with it
    if not recently_viewed_tag:
        return None

    if not popular_tag:
        data = graph_client.insert_tag(company_id=mavis.company.id, tag="popular", color="#D00000")
        popular_id = data.inserted_tag.id
    else:
        popular_id = popular_tag.id

    all_new_tags = []

    for related_to in ("dataset", "narrative"):
        if related_to == "dataset":
            datasets = graph_client.dataset_index(company_id=mavis.company.id).dataset

            recently_viewed = [
                dict(
                    related_id=dataset.id,
                    updated_at=next(t.updated_at for t in dataset.tags if t.tag_id in recently_viewed_tag),
                )
                for dataset in datasets
                if dataset.status == dataset.status.live
                and any(t.tag_id for t in dataset.tags if t.tag_id in recently_viewed_tag)
            ]
        elif related_to == "narrative":
            narratives = graph_client.narrative_index(company_id=mavis.company.id).narrative

            recently_viewed = [
                dict(
                    related_id=narrative.id,
                    updated_at=next(t.updated_at for t in narrative.tags if t.tag_id in recently_viewed_tag),
                )
                for narrative in narratives
                if narrative.state == narrative.state.live
                and any(t.tag_id for t in narrative.tags if t.tag_id in recently_viewed_tag)
            ]

        temp_mapping = defaultdict(zero_func)

        for r in recently_viewed:
            temp_mapping[r["related_id"]] += 1 + max(
                5.0 - utils.date_diff(r["updated_at"], utils.utcnow(), "day") * 1.0 / DAY_WINDOW,
                0,
            )

        # create an ordered list
        ordered = sorted(temp_mapping, key=temp_mapping.get, reverse=True)[:TOP_N]

        # add all the tags to the list
        all_new_tags.extend([dict(related_to=related_to, related_id=o, tag_id=popular_id) for o in ordered])

    # delete all the popular tags
    graph_client.delete_tag_items(tag_id=popular_id)

    # add all the tags
    for new_tag in all_new_tags[::-1]:
        graph_client.insert_tag_item_one(**new_tag)
