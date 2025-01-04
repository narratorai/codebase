from core.api.customer_facing.utils.decorator import ensure_company, ensure_mavis, require_admin
from core.api.customer_facing.utils.pydantic import TeamPermission
from core.errors import InvalidPermission
from core.graph import graph_client
from core.logger import get_logger
from core.models.company import CompanyTable, query_graph_company
from core.models.ids import UUIDStr

from ..utils.updator import ItemUpdator

logger = get_logger()


class TableManager(ItemUpdator):
    @property
    def has_search(self) -> bool:
        return False

    @property
    def related_key(self):
        return "table"

    def resync_id(self, id: UUIDStr):
        query_graph_company(self.user.company.slug, True)

    @ensure_mavis
    @require_admin
    def create(
        self,
        identifier: str,
        activity_stream: str,
        default_time_between: str,
        is_imported: bool,
        manually_partition_activity: bool,
        maintainer_id: str,
    ):
        company_table = graph_client.insert_company_table(
            company_id=self.user.company.id,
            identifier=identifier,
            activity_stream=activity_stream,
            default_time_between=default_time_between,
            is_imported=is_imported,
            manually_partition_activity=manually_partition_activity,
            maintainer_id=maintainer_id,
        ).insert_company_table_one

        # TODO: Remove this when we support teams
        self.update_permissions(company_table.id, [], share_with_everyone=True, skip_check=True)

        # add the company table
        self.mavis.company.tables.append(CompanyTable(**company_table.dict()))
        self.resync_id(company_table.id)
        return company_table

    @ensure_mavis
    @require_admin
    def delete(self, id: str):
        company_table = self.company.table(id)
        if not company_table.manually_partition_activity:
            try:
                query = self.mavis.qm.get_drop_table_query(self.mavis.qm.stream_table(company_table))
                self.mavis.run_query(query)
            except Exception:
                logger.error("Could not delete table")

        graph_client.delete_company_table(id=id)
        self.resync_id(id)

    @ensure_company
    def update(
        self,
        id: UUIDStr,
        identifier: str,
        default_time_between: str,
        is_imported: bool,
        customer_dim_table_id: UUIDStr,
        maintainer_id: UUIDStr,
    ):
        # check to see if the object can be used
        self.check_update_permissions(id, obj=self.company.table(id))

        # check to see if
        graph_client.update_company_table(
            id=id,
            identifier=identifier,
            default_time_between=default_time_between,
            is_imported=is_imported,
            customer_dim_table_id=customer_dim_table_id,
            maintainer_id=maintainer_id,
        )
        self.resync_id(id)

    def update_rows(self, id: UUIDStr, row_count: int):
        graph_client.update_company_table_rows(id=id, row_count=row_count)
        self.resync_id(id)

    def update_partition(self, id: UUIDStr, manually_partition_activity: bool):
        graph_client.update_company_table_partition(id=id, manually_partition_activity=manually_partition_activity)
        self.resync_id(id)

    def add_aggregation_dim(self, id: UUIDStr, dim_table_id: UUIDStr):
        graph_client.insert_aggregation_dim(company_table_id=id, dim_table_id=dim_table_id)
        self.resync_id(id)

    def delete_aggregation_dim(self, id: UUIDStr, dim_id: UUIDStr):
        graph_client.delete_aggregation_dim(table_id=id, dim_id=dim_id)
        self.resync_id(id)

    def insert_slowly_changing_dim(self, id: UUIDStr, dim_table_id: UUIDStr, slowly_changing_ts_column: str):
        graph_client.insert_slowly_changing_dim(
            dim_table_id=dim_table_id, slowly_changing_ts_column=slowly_changing_ts_column, table_id=id
        )
        self.resync_id(id)

    def delete_slowly_changing_dim(self, id: UUIDStr, dim_id: UUIDStr):
        graph_client.delete_slowly_changing_dim(id=dim_id)
        self.resync_id(id)

    def check_dependent_permission(self, id: UUIDStr, permissions: TeamPermission):
        """Applies any custom checks for the permissions like dependency"""

        # Check to see if all activities associated with the table encompass the new permissions

        all_teams_id = [p.id for p in permissions]

        if self.user.company.everyone_team_id in all_teams_id:
            return None

        # ensure it is not encompassing
        missing_activities = graph_client.missing_activity_permission(id, all_teams_id).activity

        if missing_activities:
            raise InvalidPermission(
                f"The activities {', '.join([a.name for a in missing_activities])} have higher permissions then the stream you are updating the permissions of.  Update their permissions to ensure that the stream permissions ALWAYS encompass the activity permissions"
            )
