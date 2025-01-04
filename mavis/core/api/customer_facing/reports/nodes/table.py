from dataclasses import dataclass

from core.api.customer_facing.reports.models import DatasetConfig
from core.api.customer_facing.reports.nodes import ReportNode
from core.models.table import TableData


@dataclass
class TableNode(ReportNode):
    config: DatasetConfig

    @property
    def output_model(self):
        return TableData

    def _run(self) -> TableData:
        ds = self.get_dataset(self.config.dataset.id)
        res = ds.run(self.config.dataset.tab.slug)
        if self.run_details.applied_filters:
            res.context.applied_filters = self.run_details.applied_filters
        return res

    def _get_datasets(self) -> list[tuple[str, str]]:
        if self.config.dataset.id and self.config.dataset.tab.slug:
            return [(self.config.dataset.id, self.config.dataset.tab.slug)]
        return []
