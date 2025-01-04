from core.api.customer_facing.trainings.models import TrainingTypeEnum
from core.api.customer_facing.utils.updator import Updator
from core.decorators.task import task
from core.graph.sync_client.enums import access_role_enum
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid4
from core.v4.dataset_comp.query.model import DatasetObject, Tab, TabPlot
from core.v4.dataset_comp.query.util import Dataset
from core.v4.llm.tools.dataset_config_generator import ChatDatasetConfig, ChatDatasetConfigResponse
from core.v4.mavis import initialize_mavis

from ..utils import BasicHandler, QueryBuilder

logger = get_logger()


class BasicDatasetTrainingHandler(BasicHandler):
    @property
    def index_name(self):
        return "training"

    @property
    def related_key(self):
        return "training"

    @property
    def display_name(self):
        return "training"

    @property
    def use_semantic_search(self):
        return True

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            "company_slug": {"type": "keyword"},
            "dataset_id": {"type": "keyword"},
            "kind": {"type": "keyword"},
            "question": {"type": "text"},
            "answer": {"type": "keyword"},
        }


class TrainingQueryBuilder(BasicDatasetTrainingHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["question"]

    @property
    def filter_fields(self):
        return ["kind"]


class TrainingUpdator(BasicDatasetTrainingHandler, Updator):
    def vectorize(self, search_data: dict):
        return search_data["question"]


class TrainingManager(TrainingUpdator):
    def get_all_training(self, dataset_id: UUIDStr):
        return TrainingQueryBuilder(user=self.user, dataset_id=dataset_id).get_results(
            ignore_fields=["question", "answer", "type"]
        )

    def train_on_plot(self, dataset: DatasetObject, tab: Tab, plot: TabPlot):
        ds = Dataset(self.mavis, model=dataset)
        model = ds.remove_unessary_columns(tab.slug)

        # Process the dataset config
        ds_config = ChatDatasetConfigResponse(dataset_config=ChatDatasetConfig(**model.dict())).json()

        self.create_search_data(
            id=get_uuid4(),
            company_slug=self.mavis.company.slug,
            dataset_id=dataset.id,
            kind=TrainingTypeEnum.config,
            question=plot.config.question,
            answer=ds_config,
        )

        # process Computed Columns
        # if computed_columns := model.get_columns(DetailKindEnum.computed):
        # TODO: convert question to just the computed column part
        # TODO: add the computed column to the dataset config
        # self.create_search_data(
        #     id=get_uuid4(),
        #     company_slug=self.mavis.company.slug,
        #     dataset_id=dataset.id,
        #     kind=TrainingTypeEnum.computed,
        #     question=column.details.name,
        # )

        # Get the plot config part
        # plot_config = plot.config.dict()

        return None

    def process_dataset(self, dataset: DatasetObject):
        if not self.user.has_role(access_role_enum.create_dataset_training):
            return None

        # remove all the datasets
        for training in self.get_all_training(dataset.id)["data"]:
            self.delete_id(training["id"])

        for tab, plot in dataset.all_plots:
            if plot.config.question:
                self.train_on_plot(dataset, tab, plot)


@task(queue_name="tracking")
def async_train_on_dataset(company_slug: str, dataset_id: UUIDStr):
    mavis = initialize_mavis(company_slug)
    TrainingManager(mavis=mavis).process_dataset(dataset_id)
