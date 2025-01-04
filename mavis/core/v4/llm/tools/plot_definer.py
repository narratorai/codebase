from pydantic import BaseModel

from core.constants import LLM_AGENT_MODEL
from core.logger import get_logger
from core.models.table import ColumnTypeEnum
from core.util.llm import llm_client
from core.v4.dataset_comp.query.model import (
    AggregateFunctionEnum,
    DetailKindEnum,
    GroupColumn,
    GroupDetails,
    MetricsDetails,
    PlotKindEnum,
    Tab,
    TabKindEnum,
    TabPlot,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import DatasetPlot, SelectedColumn
from core.v4.llm.helpers import load_prompt
from core.v4.llm.models import DatasetData, UIMessage
from core.v4.llm.tools.check_dataset_columns import get_column_text
from core.v4.mavis import Mavis

logger = get_logger()


class MetricColumn(BaseModel):
    column: str | None
    metric: AggregateFunctionEnum


class ChatPlotConfig(BaseModel):
    title: str
    xs: list[str]
    metrics: list[MetricColumn]
    color_bys: list[str]
    plot_kind: PlotKindEnum


def create_plot_config(mavis: Mavis, question: str, message: UIMessage) -> UIMessage:
    if not isinstance(message.data, DatasetData):
        raise ValueError("This tool only works with dataset messages")

    dataset = Dataset(mavis, model=message.data.dataset)

    # we need to get the internal columns first to keep the IDs consistent
    columns = []
    columns.extend(
        [
            c
            for c in dataset.model.columns
            if c.details.kind != DetailKindEnum.activity and c.details.name != "activity_id"
        ]
    )
    # HACK: Added the dim_id is None to not deal with dimensions yet
    columns.extend([c for c in dataset.get_available_columns() if c not in columns and c.details.dim_id is None])

    column_text = get_column_text(dataset.model, columns)

    user_message = "\n".join([f"Question: {question}", "Columns: "] + column_text)

    prompt = load_prompt(mavis.company, "plot_config")
    messages = [
        dict(role="system", content=prompt),
    ]
    # TODO: add Few-Shot examples

    # Add the user question
    messages.append(dict(role="user", content=user_message))

    logger.debug("Asking LLM for plot config", prompt=prompt, user_message=user_message)

    response = llm_client.beta.chat.completions.parse(
        model=LLM_AGENT_MODEL,
        messages=messages,
        response_format=ChatPlotConfig,
    )
    response = response.choices[0].message.parsed

    logger.debug("LLM returned plot config", response=response.dict())

    # Create the Tab and plot
    tab = Tab(kind=TabKindEnum.group, slug="answer", label="Question")
    plot_columns = SelectedColumn()

    cm = {c.clean_label: c for c in columns}

    # add the columns to the dataset
    for c in response.xs + response.color_bys:
        nc = GroupColumn(
            label=cm[c].label,
            type=cm[c].type,
            details=GroupDetails(
                column_id=cm[c].id,
            ),
        )
        if c in response.xs:
            plot_columns.xs.append(nc.id)
        elif c in response.color_bys:
            plot_columns.color_bys.append(nc.id)

        tab.columns.append(nc)
        message.data.dataset.add_column(cm[c])

    for mc in response.metrics:
        if mc.metric != AggregateFunctionEnum.count_all:
            nc = GroupColumn(
                label=cm[mc.column].label,
                type=ColumnTypeEnum.number,
                details=MetricsDetails(
                    agg_function=mc.metric,
                    column_id=cm[mc.column].id,
                ),
            )
            # update the label
            tab.columns.append(nc)
            message.data.dataset.add_column(cm[mc.column])
            plot_columns.ys.append(nc.id)
            nc.label = dataset.model.default_metric_label(nc)
        else:
            count_col = GroupColumn(
                label="Total Rows",
                type=ColumnTypeEnum.number,
                details=MetricsDetails(agg_function=AggregateFunctionEnum.count_all),
            )
            # update the label
            tab.columns.append(count_col)
            plot_columns.ys.append(count_col.id)
            count_col.label = dataset.model.default_metric_label(count_col)

    dataset.model.all_tabs.append(tab)

    # add the plot to the dataset
    plot = DatasetPlot(
        dict(dataset=dict(tab_slug=tab.slug), columns=plot_columns.dict()),
        dataset,
    )

    # add the plot to the dataset
    plot.reset_axis()
    plot.config.axes.plot_kind = response.plot_kind
    plot.config.axes.title = response.title

    # add the keys
    tab.plots.append(TabPlot(name="answer", slug="answer", config=plot.get_config()))
    message.data.group_slug = tab.slug
    message.data.plot_slug = "answer"
    # add the plot to the dataset
    return message
