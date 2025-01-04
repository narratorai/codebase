from datetime import date

from core.errors import SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.models.table import TableColumn, TableData
from core.util.twilio import send_text
from core.utils import human_format
from core.v4.dataset_comp.integrations.model import TextDetails
from core.v4.dataset_comp.integrations.util import Integration
from core.v4.dataset_comp.query.model import DetailKindEnum

logger = get_logger()


def create_text(data: TableData, label: str, group_columns: list[TableColumn]):
    """
    Sends the message and email
    """
    group_columns = group_columns or []
    txt = [f"{label} - {date.today()}", ""]

    g_ids = [g.id for g in group_columns]
    for row in data.rows:
        header = [f"{g.header_name}: {row[g.field]}" for g in group_columns]
        txt.extend(header)
        txt.extend(
            [
                f" - {col.header_name}: {human_format(row[col.field], col.context.format)}"
                for col in data.columns
                if col.id not in g_ids
            ]
        )
        txt.append("")

    return "\n".join(txt)


class SendText(Integration):
    @property
    def details(self) -> TextDetails:
        return self.mat.details

    def run(self):
        all_users = graph_client.get_company_users(company_id=self.mavis.company.id).company_user

        if self.details.user_ids:
            raise SilenceError("Users have been removed, thus no one to send the text to.")

        to_numbers = [u.phone for u in all_users if u.id in self.details.user_ids and u.phone]
        data = self.fetch_data()

        # create a mappign for the columns
        group_columns = [data.column(c.id) for c in self.model.columns(DetailKindEnum.group)]

        # create the text
        text_message = create_text(data, self.mat.label, group_columns)

        # send the text to all the numbers  z
        for t in to_numbers:
            send_text(t, text_message)
