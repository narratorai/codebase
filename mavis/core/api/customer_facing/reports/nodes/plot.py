from dataclasses import dataclass

from core.api.customer_facing.reports.models import DatasetConfig
from core.api.customer_facing.reports.nodes import ReportNode
from core.v4.datasetPlotter import AntVPlot, DatasetPlot


@dataclass
class PlotNode(ReportNode):
    config: DatasetConfig

    @property
    def output_model(self):
        return AntVPlot

    def _run(self) -> AntVPlot:
        ds = self.get_dataset(self.config.dataset.id)
        # HACK for fixing the data
        if "." in self.config.dataset.tab.plot.slug:
            self.config.dataset.tab.plot.slug = self.config.dataset.tab.plot.slug.split(".")[1]

        plot = DatasetPlot(
            dict(dataset=dict(tab_slug=self.config.dataset.tab.slug, plot_slug=self.config.dataset.tab.plot.slug)),
            ds,
            version=2,
        )
        res = plot.run_plot()

        # add a filter flag
        if self.run_details.applied_filters:
            res.config.applied_filters = self.run_details.applied_filters
        return res

    def _get_datasets(self) -> list[tuple[str, str]]:
        if self.config.dataset.id and self.config.dataset.tab.slug:
            return [(self.config.dataset.id, self.config.dataset.tab.slug)]
        return []
