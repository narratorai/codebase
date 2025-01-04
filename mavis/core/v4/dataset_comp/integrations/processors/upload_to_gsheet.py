from core.errors import SilenceError
from core.logger import get_logger
from core.models.table import TableColumn
from core.util.google import get_google_sheet, update_sheet
from core.utils import utcnow
from core.v4.dataset_comp.integrations.model import GsheetDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class MaterializeDatasetError(SilenceError):
    pass


class PermissionDeniedError(SilenceError):
    def __init__(self, message: str, **kwargs):
        self.http_status_code = 403
        super().__init__(message, **kwargs)


class SpreadsheetNotFoundError(SilenceError):
    def __init__(self, message: str, **kwargs):
        self.http_status_code = 404
        super().__init__(message, **kwargs)


class ResourceError(SilenceError):
    pass


class UploadGSheets(Integration):
    @property
    def details(self) -> GsheetDetails:
        return self.mat.details

    @staticmethod
    def validate(mat):
        try:
            get_google_sheet(mat.details.sheet_key, mat.label)
        except Exception:
            raise SilenceError(
                "Could Not access the gsheet.  Please make sure the sheet is shared with reports@narrator.ai or contact support for help."
            )

    def run(self):
        try:
            ws = get_google_sheet(self.details.sheet_key, self.mat.label)
        except Exception:
            raise SilenceError(
                "Could Not access the gsheet.  Please make sure the sheet is shared with reports@narrator.ai or contact support for help."
            )

        ws.clear()

        is_last = False
        offset = 0
        while not is_last:
            raw_data = self.fetch_data(offset=offset)

            raw_data.columns.append(
                TableColumn(
                    id="synced_by_narrator_at",
                    field="synced_by_narrator_at",
                    header_name="Synced by Narrator at",
                    column_type="timestamp",
                    raw_type="timestamp",
                    type="timestamp",
                )
            )

            # sync the row data
            for row in raw_data.rows:
                row["synced_by_narrator_at"] = utcnow()

            num_row = offset + raw_data.total_rows + 100
            num_cols = len(raw_data.columns) + 10

            # Make sure the sheet is large enough
            try:
                ws.resize(num_row, num_cols)
            except Exception as e:
                if "increase the number of cells" in str(e):
                    raise MaterializeDatasetError(
                        "Could not continue updating the Gsheet because there is a limit of 10M cells in the entire workbook. \nCreate a new google sheet or reduce the dataset size and try again."
                    )
                else:
                    raise e

            rows = []
            # add the first row
            if offset == 0:
                # This is a hack for the data
                if self.mat.version == 1:
                    rows.append(
                        [self.model.column(c.id).clean_label for c in raw_data.columns[:-1]] + ["synced_by_narrator_at"]
                    )
                else:
                    rows.append([c.header_name for c in raw_data.columns])

            rows.extend([[r[c.field] for c in raw_data.columns] for r in raw_data.rows])
            update_sheet(ws, rows, offset)

            # update the offset
            offset += raw_data.total_rows
            is_last = raw_data.context.is_all
