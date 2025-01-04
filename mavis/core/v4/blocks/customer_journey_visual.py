from core.api.v1.customer_journey.helpers import get_customer_journey
from core.api.v1.customer_journey.models import CustomerStreamInput
from core.graph import graph_client
from core.v4.blocks.shared_ui_elements import _checkbox, _drop_down, _object
from core.v4.mavis import Mavis

TITLE = "Visual Customer Journey"
DESCRIPTION = ""
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    all_activities = [
        dict(id=a.id, name=a.name, slug=a.slug)
        for a in graph_client.activity_index(company_id=mavis.company.id).all_activities
    ]

    schema = _object(
        dict(
            is_first=_checkbox("Only 1st Occurrence"),
            activity_slugs=_drop_down(all_activities, "slug", "name", is_multi=True, title="Activities"),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    schema_ui = dict()
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    qm = mavis.qm

    input = CustomerStreamInput(table="company_stream")
    (base_query, person_col, _) = get_customer_journey(mavis, input, just_query=True)

    # add the data
    base_query.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column="activity"),
                group=person_col,
                order=qm.Column(table_column="ts"),
            ),
            name_alias="next_activity",
        )
    )

    query = qm.wrap_query(base_query, alias="a")

    # TODO: CONDITION
    query.set_where(
        qm.Condition(
            operator="not_equal",
            left=qm.Column(table_column="activity"),
            right=qm.Column(table_column="next_activity"),
        )
    )
    query.add_column(
        qm.Column(
            function="row_number_w_group",
            fields=dict(group=person_col, order=qm.Column(table_column="ts")),
            name_alias="rw",
        )
    )

    count_query = qm.get_count_query(query, by_column=["rw", "activity", "next_activity"])

    final_query = qm.wrap_query(count_query)
    final_query.set_where(
        qm.Condition(
            operator="less_than",
            left=qm.Column(table_column="rw"),
            right=qm.Column(value=10),
        )
    )
    final_query.add_column(
        qm.Column(
            function="row_number_w_group",
            fields=dict(
                group=[qm.Column(table_column="total_rows")],
                order=qm.Column(table_column="total_rows").to_query() + " desc",
            ),
            name_alias="top_rows",
        )
    )

    final_query = qm.wrap_query(final_query)
    final_query.set_where(
        qm.Condition(
            operator="less_than",
            left=qm.Column(table_column="top_rows"),
            right=qm.Column(value=5),
        )
    )

    # order it better
    final_query.add_order_by([qm.Column(table_column="rw")])
    final_query.add_order_by([qm.Column(table_column="total_rows")], asc=False)

    # run the data
    count_data = mavis.run_query(final_query.to_query(), within_minutes=1000)

    for r in count_data.rows:
        r["source"] = f"{r['rw']} - {r['activity']}"
        r["target"] = f"{r['rw']+1} - {r['next_activity']}"

    plot_data = dict(
        chart_type="sankey",
        plot_config=dict(
            data=count_data.rows,
            sourceField="source",
            targetField="target",
            weightField="total_rows",
            nodeWidthRatio=0.008,
            nodePaddingRatio=0.03,
        ),
        use_antv=True,
    )

    return [
        dict(
            type="block_plot",
            value=plot_data,
        )
    ]
