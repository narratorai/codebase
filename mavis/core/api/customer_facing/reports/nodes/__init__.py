import json
from copy import deepcopy
from dataclasses import dataclass
from hashlib import md5

from core.api.customer_facing.reports.models import RunDetails, DatasetColumnFilter
from core.v4.dataset_comp.query.model import DetailKindEnum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis


@dataclass
class ReportNode:
    mavis: Mavis
    id: str
    config: any
    run_details: RunDetails

    @property
    def output_model(self):
        return dict

    def run(self):
        # check the cache for this run
        (cache_data, cache_key) = self.check_cache()
        if cache_data is not None:
            return self.output_model(**cache_data)

        # if not in cache, run the node
        data = self._run()

        # cache the data
        if cache_key is not None:
            self.mavis.company.s3.upload_object(data.dict(), cache_key)
        return data

    def check_cache(self):
        # Filter applied filters and decisions to only those used by this node
        if self.run_details.applied_filters:
            self.run_details.applied_filters = deepcopy(self.run_details.applied_filters)
            self.run_details.applied_filters = [
                f
                for f in self.run_details.applied_filters
                if f.filter_id != self.id and self.uses_filtered_dataset(f.applied_on)
            ]

        if self.run_details.decisions:
            self.run_details.decisions = deepcopy(self.run_details.decisions)
            self.run_details.decisions = [
                d
                for d in self.run_details.decisions
                if d.node_id != self.id and self.uses_filtered_dataset(d.applied_on)
            ]

        if self.run_details.run_key is not None:
            load_from = [
                "reports",
                self.run_details.id,
                "run",
                self.run_details.run_key,
                self.id,
                self.get_detail_hash() + ".json",
            ]
            data = self.mavis.company.s3.get_file(load_from)
            return (data, load_from)
        return (None, None)

    def _get_datasets(self) -> list[tuple[str, str]]:
        return []

    def _impacts_datasets(self) -> list[tuple[str, str]]:
        return []

    def uses_filtered_dataset(self, filters: list[DatasetColumnFilter]) -> bool:
        """Generic method to check if dataset filters are used by this node"""
        node_datasets = self._get_datasets()
        for f in filters:
            for dataset_id, tab_slug in node_datasets:
                if f.dataset.id == dataset_id:
                    if tab_slug is None or f.tab is None or f.tab.slug == tab_slug:
                        return True
        return False

    def _run(self):
        raise NotImplementedError()

    def get_dataset(self, dataset_id: str):
        # Get dataset and apply filters
        ds = Dataset(mavis=self.mavis, id=dataset_id)

        # Apply filters
        for f in self.run_details.applied_filters:
            for col in f.applied_on:
                if col.dataset.id == dataset_id:
                    if col.tab is None:
                        ds.model.column(col.id).add_filter(f.filter)
                    elif not col.tab.as_parent_filter:
                        ds.model.tab(col.tab.slug).column(col.id).add_filter(f.filter)
                    else:
                        ds.model.tab(col.tab.slug).add_parent_filter(col.id, [f.filter])

        # Apply decision replacements
        for decision in self.run_details.decisions:
            for col in decision.applied_on:
                if col.dataset.id == dataset_id:
                    if col.tab is None:
                        column = ds.model.column(col.id)
                    else:
                        column = ds.model.tab(col.tab.slug).column(col.id)

                    if column and column.details.type == DetailKindEnum.computed:
                        column.details.raw_str = column.details.raw_str.replace(
                            col.replace_content, str(decision.value)
                        )

        return ds

    def get_detail_hash(self) -> str:
        hash_parts = []

        # Hash filters
        if self.run_details.applied_filters:
            for f in self.run_details.applied_filters:
                json_str = json.dumps(f.filter.dict(), sort_keys=True, default=str)
                hash_parts.append(md5(json_str.encode(), usedforsecurity=False).hexdigest())

        # Hash decisions
        if self.run_details.decisions:
            for d in self.run_details.decisions:
                decision_str = f"{d.id}-{d.value}"
                for col in d.applied_on:
                    decision_str += f"-{col.dataset.id}-{col.id}-{col.replace_content}"
                hash_parts.append(md5(decision_str.encode(), usedforsecurity=False).hexdigest())

        return "-".join(hash_parts) if hash_parts else "none"
