from core.api.customer_facing.sql.utils import WarehouseManager
from core.logger import get_logger
from core.models.warehouse_schema import TableSchema
from core.utils import slugify
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class CreateView(Integration):
    def run(self):
        qm = self.mavis.qm
        table = qm.Table(
            schema=self.mavis.company.materialize_schema,
            table=f"v_{slugify(self.mat.label)}",
        )

        # check if it is missing the schema then create it otherwise fail
        wh = WarehouseManager(mavis=self.mavis).get_schema(False)
        if self.mavis.company.materialize_schema not in wh.schemas:
            self.mavis.create_schema(schema=self.mavis.company.materialize_schema)
        self.dataset.limit = None
        # create the view
        query = [
            qm.get_drop_view_query(table),
            qm.get_create_view_query(table, self.dataset.qm_query(self.mat.tab_slug)),
        ]
        if any(query):
            self.mavis.run_query(query)

        tb = TableSchema(
            schema_name=table.schema,
            table_name=table.table,
            columns=[
                dict(name=c.clean_label, type=c.type, examples=c.examples)
                for c in self.dataset.model.get_all_columns(self.mat.tab_slug, output=True)
            ],
        )
        # Add the table to the warehouse
        WarehouseManager(mavis=self.mavis).create(tb)
