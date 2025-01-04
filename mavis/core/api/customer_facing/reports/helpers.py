from collections import defaultdict
from graphlib import TopologicalSorter

from core.api.customer_facing.reports.models import (
    AppliedFilter,
    DatasetConfig,
    DecisionNodeConfig,
    FilterNodeConfig,
    MetricNodeConfig,
    RunDetails,
    node_type_enum,
)
from core.api.customer_facing.reports.nodes import ReportNode
from core.api.customer_facing.reports.nodes.decisions import DecisionNode
from core.api.customer_facing.reports.nodes.filter import FilterNode
from core.api.customer_facing.reports.nodes.metric import MetricNode
from core.api.customer_facing.reports.nodes.plot import PlotNode
from core.api.customer_facing.reports.nodes.table import TableNode
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid4, to_id
from core.v4.mavis import Mavis

logger = get_logger()

NODE_MAPPING = {
    node_type_enum.plot: (PlotNode, DatasetConfig),
    node_type_enum.data_table: (TableNode, DatasetConfig),
    node_type_enum.metric: (MetricNode, MetricNodeConfig),
    node_type_enum.filter: (FilterNode, FilterNodeConfig),
    node_type_enum.decision: (DecisionNode, DecisionNodeConfig),
}


def get_node(
    mavis: Mavis,
    id: str | None,
    type: node_type_enum,
    attrs: dict,
    run_details: RunDetails,
) -> ReportNode | None:
    if type in NODE_MAPPING:
        node_class = NODE_MAPPING[type][0]
        config = NODE_MAPPING[type][1](**attrs)
        node_id = id or to_id(attrs)

        return node_class(mavis=mavis, id=node_id, config=config, run_details=run_details)


def get_all_nodes(
    mavis: Mavis, content: list[dict], run_details: RunDetails | None = None, narrative_id: UUIDStr | None = None
):
    if run_details is None:
        run_details = RunDetails(
            id=narrative_id,
            run_key=None,
            applied_filters=[],
        )

    nodes: list[ReportNode] = []
    # TODO: Figure out the structure of the content
    for node in content:
        if isinstance(node, dict):
            for c in node.get("content") or []:
                nodes.extend(get_all_nodes(mavis, c, run_details, narrative_id))

            node_attrs: dict = node.get("attrs")
            # Some nodes, such as line breaks, do not have content or attrs
            if not node_attrs:
                continue
            else:
                node = get_node(mavis, node_attrs.get("uid") or get_uuid4(), node.get("type"), node_attrs, run_details)
                if node:
                    nodes.append(node)
    return nodes


def get_dependencies(mavis: Mavis, config: dict):
    if not config.get("document"):
        return []

    nodes = get_all_nodes(mavis, config["document"]["content"], None)
    dependencies = []
    for node in nodes:
        try:
            dependencies.append(
                {
                    "id": node.id,
                    "depends_on_dataset": node._get_datasets(),
                    "impacts_datasets": node._impacts_datasets(),
                }
            )
        except Exception as e:
            logger.debug("Error getting dependencies", error=e)

    ordered_dependencies = defaultdict(list)
    for i, node in enumerate(dependencies):
        for j in range(i + 1, len(dependencies)):
            other_node = dependencies[j]
            if any(dataset in node["impacts_datasets"] for dataset in other_node["depends_on_dataset"]):
                ordered_dependencies[node["id"]].append(other_node["id"])

    return [dict(id=k, depends_on_ids=v) for k, v in ordered_dependencies.items()]


def run_report(
    mavis: Mavis,
    narrative_id: UUIDStr,
    config: dict,
    version_id: UUIDStr | None = None,
    run_key: UUIDStr | None = None,
    applied_filters: list[AppliedFilter] | None = None,
):
    run_details = RunDetails(
        id=narrative_id,
        version_id=version_id,
        run_key=run_key or get_uuid4(),
        applied_filters=applied_filters or [],
    )
    dependencies = config["ordered_dependencies"]
    nodes = get_all_nodes(mavis, config["document"]["content"], run_details)

    # Create a map of node_id to node object
    node_map = {node.id: node for node in nodes}
    graph = {o["id"]: set(o["depends_on_ids"]) for o in dependencies}

    # Create and prepare topological sorter
    ts = TopologicalSorter(graph)
    ts.prepare()

    # Execute nodes in topologically sorted order
    while ts.is_active():
        for node_id in ts.get_ready():
            if node_id in node_map:
                node_map[node_id].run()
            ts.done(node_id)

    return run_details
