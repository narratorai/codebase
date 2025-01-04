import base64
import json
import tempfile

from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.constants import DATASET_CSV_DOWNLOAD_EMAIL
from core.decorators import with_mavis
from core.logger import get_logger
from core.models.internal_link import PORTAL_URL
from core.util.email import send_email
from core.v4.mavis import Mavis
from core.v4.utils.query_results import serialize_query_result_to_dsv

logger = get_logger()


def send_csv(mavis: Mavis, name, sql_query):
    # upload the data to the temp folders
    object_name = f"{utils.slugify(name)}-{utils.utcnow()}.csv"

    count_query = mavis.qm.get_count_query(sql_query).to_query()
    count_data = mavis.run_query(count_query, within_minutes=None, as_admin=True)

    total_rows = count_data["rows"][0]["total_rows"]
    SPLIT_LIMIT = 40_000

    # if the data is large then do it in multiparts
    if total_rows < SPLIT_LIMIT:
        data = mavis.run_query(sql_query.to_query(), within_minutes=None, as_admin=True)

        # get the data
        upload_path = mavis.upload_object(data, ["dataset_uploads", object_name], is_temp=True)

    else:
        offset = 0
        sql_query.set_limit(SPLIT_LIMIT)

        # Step 1: Create a temporary file and write to it
        with tempfile.NamedTemporaryFile(mode="w", delete=True) as temp_file:
            # Slowly create the file in chunks
            for _ in range(int(total_rows / SPLIT_LIMIT) + 1):
                sql_query.set_offset(offset)
                temp_data = mavis.run_query(sql_query.to_query(), within_minutes=None, as_admin=True)
                temp_file.write(serialize_query_result_to_dsv(temp_data, ",", skip_header=offset > 0))
                temp_file.flush()  # Ensure data is written to disk
                offset += SPLIT_LIMIT

            # upload the file
            upload_path = mavis.upload_file(temp_file.name, ["dataset_uploads", object_name], is_temp=True)

    meta = dict(s3_path=upload_path, type="manual")
    encoded_meta = base64.urlsafe_b64encode(json.dumps(meta).encode("ascii")).decode()
    url = f"{PORTAL_URL}/{mavis.company.slug}/downloads/{encoded_meta}"

    # create the data model
    template_model = dict(name=utils.title(name), url=url, first_name="Ahmed")

    send_email(
        mavis.company,
        "ahmed@narrator.ai",
        DATASET_CSV_DOWNLOAD_EMAIL,
        template_model,
        tag="csv_email",
        skip_opt_out=True,
    )


@with_mavis
def download_schema(mavis: Mavis, company_slug: str = None, schema_name: str = None):
    tables = WarehouseManager(mavis=mavis).get_schema(include_columns=True)
    for t in tables["schema"]:
        (schema, table_name) = utils.split_schema_table_name(t["name"])
        if schema == schema_name:
            logger.debug("Starting to run the data")
            query = mavis.qm.wrap_query(mavis.qm.Table(schema=schema_name, table=table_name))

            send_csv(
                mavis,
                table_name,
                query,
            )
