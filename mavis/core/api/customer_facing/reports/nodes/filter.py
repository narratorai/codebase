from dataclasses import dataclass

from core.api.customer_facing.reports.models import FilterData, FilterDefaultStateEnum, FilterNodeConfig
from core.api.customer_facing.reports.nodes import ReportNode
from core.models.table import ColumnTypeEnum
from core.v4.dataset_comp.query.model import TabKindEnum


@dataclass
class FilterNode(ReportNode):
    config: FilterNodeConfig

    @property
    def output_model(self):
        return FilterData

    def _run(self) -> FilterData:
        default_value = None
        constraint_list = []
        if self.config.give_dropdown_options:
            if self.config.type == ColumnTypeEnum.boolean:
                constraint_list = [True, False]
            elif len(self.config.apply_on) > 0:
                # get the possible values from the first filter
                use_filter = self.config.apply_on[0]
                ds = self.get_dataset(use_filter.dataset.id)
                data = ds.run(use_filter.tab.slug if use_filter.tab else None)
                constraint_list = data.unique_column_values(data.column(use_filter.id))

        # take a look at the default state and decide to return the values or not
        if self.config.default_state == FilterDefaultStateEnum.custom:
            default_value = self.config.default_value
        elif self.config.default_state == FilterDefaultStateEnum.first and len(constraint_list) > 0:
            default_value = constraint_list[0]
        elif self.config.default_state == FilterDefaultStateEnum.current_user:
            default_value = self.mavis.user.email
        return FilterData(
            constraint_list=constraint_list,
            default_value=default_value,
            is_editable=self.config.is_editable or self.mavis.user.is_admin,
        )

    def _impacts_datasets(self) -> list[tuple[str, str]]:
        ds = set()
        for f in self.config.apply_on:
            ds.set((f.dataset.id, f.tab.slug))
        return list(ds)

    def _get_datasets(self) -> list[tuple[str, str]]:
        if (
            self.config.give_dropdown_options
            and self.config.type != ColumnTypeEnum.boolean
            and len(self.config.apply_on) > 0
        ):
            use_filter = self.config.apply_on[0]
            return [
                (
                    use_filter.dataset.id,
                    use_filter.tab.slug if use_filter.tab and use_filter.kind == TabKindEnum.group else None,
                )
            ]

        return []
