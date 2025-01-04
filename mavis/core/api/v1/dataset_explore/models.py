# from enum import Enum

# from pydantic import BaseModel

# from core.models.company import CompanyTable
# from core.v4 import createDataset
# from core.v4.datasetPlotter import PlotKindEnum

# OutputKindEnum = Enum(
#     value="Output Kind",
#     names=[(b.upper(), b.lower()) for b in ("plot", "metric", "table")],
# )


# class CacheOutput(BaseModel):
#     slug: str


# class Metric(BaseModel):
#     value: str = "No Data"
#     title: str | None
#     description: str | None
#     header: str | None


# class DatasetBasic(BaseModel):
#     activity_id: str | None
#     slug: str | None
#     group_slug: str | None
#     plot_slug: str | None
#     staged_dataset: dict | None
#     # For loading datasets from narratives
#     narrative_slug: str | None
#     upload_key: str | None


# class ExploreColumnsInput(BaseModel):
#     dataset_config: DatasetBasic
#     activity_stream: CompanyTable | None = None
#     cohort: createDataset.CohortActivity | None = None
#     append_activities: list[createDataset.AppendActivity] | None = None
#     fields: dict | None


# class ApplyExploreColumnsInput(ExploreColumnsInput):
#     # default the data from the plot or raw
#     y_metrics: list[createDataset.PossibleColumnMetric]
#     segment_bys: list[createDataset.PossibleColumn]
#     selected_filters: list[createDataset.PossibleColumnFilter]

#     time_filter: createDataset.Filter = None
#     time_resolution: createDataset.ResolutionEnum = None

#     plot_kind: PlotKindEnum | None = None
#     output_kind: OutputKindEnum | None = None


# class ExploreColumnsOutput(ApplyExploreColumnsInput):
#     # get all the options
#     y_metric_options: list[createDataset.PossibleColumnMetric]
#     segment_by_options: list[createDataset.PossibleColumn]
#     filter_column_options: list[createDataset.PossibleColumnFilter]
#     plot_options: list[PlotKindEnum]
#     plot_kind: PlotKindEnum | None = None
#     loading_screen: list[dict] | None = None


# class ApplyExploreColumnsOutput(BaseModel):
#     staged_dataset: dict
#     plot_data: dict
#     is_actionable: bool = False
#     analyze_button_input: dict | None
#     table_data: dict | None
#     metric_data: dict | None
#     output_kind: OutputKindEnum = None
