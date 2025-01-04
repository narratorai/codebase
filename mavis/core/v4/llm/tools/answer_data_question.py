from typing import Generator

from pydantic import BaseModel

from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import DatasetPlot
from core.v4.llm.models import DatasetData, UIMessage, data_type_enum
from core.v4.llm.tools import Tool
from core.v4.llm.tools.check_dataset_columns import check_and_add_dataset_columns
from core.v4.llm.tools.dataset_config_generator import generate_dataset_config
from core.v4.llm.tools.plot_definer import create_plot_config


class AnswerDataQuestion(BaseModel):
    question: str


class DatasetTool(Tool):
    @property
    def model(self) -> AnswerDataQuestion:
        return AnswerDataQuestion

    @property
    def description(self) -> str:
        return "Generates a plot to answer a specific data question using the user's company data. The question must be clearly defined and focused, allowing for a single plot to provide a comprehensive answer. For instance, if the user wants to know the total sales from the top 10 customers, they should first ask for the top 10 customers by sales revenue and then request a plot showing the total sales over time for the list of customers."

    @property
    def when_to_use(self) -> str:
        return 'Use this tool when the user asks questions related to internal business data, such as those typically answered by BI tools (e.g., "What are the top-performing entities this quarter?").'

    @property
    def is_generator(self) -> bool:
        return True

    def run(self, model: AnswerDataQuestion) -> Generator:
        current_message = UIMessage(
            type=data_type_enum.dataset,
            data=DatasetData(
                question=model.question,
            ),
        )
        current_message.update_loading(10, (f"Answering the data question: {model.question}"))
        yield current_message

        generate_dataset_config(self.mavis, self.company_table.id, model.question, current_message)
        current_message.update_loading(
            25,
            "Got the dataset configuration (which activities to include and how to arrange them), checking if we need any filters or computed columns",
        )
        yield current_message
        if current_message.type == data_type_enum.user_message:
            current_message.complete()
            return

        check_and_add_dataset_columns(self.mavis, model.question, current_message)
        current_message.update_loading(
            35, "Added the needed computed columns, will now define the plot to best answer the data question"
        )
        yield current_message

        # Create the plot
        create_plot_config(self.mavis, model.question, current_message)
        current_message.update_loading(
            60, "Now that we defined, the plot, we will run the SQL query on your data warehouse to get the data."
        )

        tab = current_message.data.dataset.all_tabs[0]
        # run the plot
        dataset = Dataset(self.mavis, model=current_message.data.dataset)

        current_message.data.sql = dataset.sql(tab.slug)
        yield current_message

        table_data = dataset.run(tab.slug)
        current_message.data.table_data = table_data
        current_message.update_loading(85, "Got the data, now creating the plot")
        yield current_message
        # Create the dataset
        plot = DatasetPlot(
            dict(dataset=dict(tab_slug=tab.slug, plot_slug=tab.plots[0].slug)),
            dataset,
        )
        current_message.data.plot_data = plot.run_plot()
        # return the plot
        current_message.update_loading(95, "Looking at the data for insights and best follow up questions")
        yield current_message

        return current_message
