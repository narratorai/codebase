from core.api.customer_facing.datasets.utils import DatasetManager
from core.decorators import with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import materialization_type_enum
from core.logger import get_logger
from core.v4.dataset_comp.integrations.model import (
    Materialization,
    MaterializationTypeEnum,
)
from core.v4.mavis import Mavis

logger = get_logger()


@with_mavis
def create_custom_materialization(mavis: Mavis, company_slug=None, id: str = None):
    if id:
        mat = graph_client.get_dataset_materialization(id=id).materialization

        # added the materialization
        graph_client.update_dataset_materialization(
            id=id,
            updated_by=mavis.user.id,
            type=materialization_type_enum.clearfind_software_match,
            label=mat.label,
            group_slug=mat.group_slug,
            external_link=None,
        )
        materialzation = Materialization(
            id=id,
            label=mat.label,
            type=MaterializationTypeEnum.clearfind_loader,
            dataset_id=mat.dataset.id,
            tab_slug=mat.group_slug,
            details={},
        )
        DatasetManager(mavis=mavis)._update_materialization(id, materialzation.dict())
