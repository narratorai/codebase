import base64
import json
import tempfile
from copy import deepcopy

from core.constants import DATASET_CSV_DOWNLOAD_EMAIL
from core.errors import SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.models.internal_link import PORTAL_URL
from core.util.email import send_email, send_raw_email
from core.utils import slugify, utcnow
from core.v4.dataset_comp.integrations.model import CSVDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class SendCSV(Integration):
    @property
    def details(self) -> CSVDetails:
        return self.mat.details

    def run(self):
        try:
            if not self.details.user_ids:
                raise SilenceError("Users have been removed, thus no one to send the CSV to.")

            all_users = graph_client.get_company_users(company_id=self.mavis.company.id).company_user
            recipients = [u for u in all_users if u.id in self.details.user_ids or u.user_id in self.details.user_ids]

            if not recipients:
                raise SilenceError("No Users Found")

            # upload the data to the temp folders
            object_name = f"{slugify(self.mat.label)}-{utcnow()}.{self.details.format}"

            # if you can user the sub query for count then swap it
            if self.dataset.ds._can_use_subquery(self.dataset.query) and self.mat.tab_slug is None:
                temp_query = deepcopy(self.dataset.qm_query())
                cohort_query = temp_query.ctes["cohort"]
                ctes_to_add = [t.cte for t in cohort_query.get_all_tables(recursive=True) if t.cte]

                # make sure the cohort stream in first always
                ctes_to_add = sorted(ctes_to_add, key=lambda x: 0 if x == "cohort_stream" else 2)

                for ct in ctes_to_add:
                    cohort_query.add_cte(ct, temp_query.ctes[ct])

                # flip the reference
                temp_query = cohort_query
            else:
                temp_query = self.dataset.qm_query()

            count_query = self.mavis.qm.get_count_query(temp_query).to_query()
            count_data = self.mavis.run_query(count_query, within_minutes=None)

            total_rows = count_data.rows[0]["total_rows"]
            logger.debug("Total Rows", total_rows=total_rows)
            SPLIT_LIMIT = 40_000

            self.dataset.limit = SPLIT_LIMIT
            # if the data is large then do it in multiparts
            if total_rows < SPLIT_LIMIT:
                raw_data = self.fetch_data()
                # get the data
                upload_path = self.mavis.company.s3.upload_object(
                    raw_data.to_csv() if self.details.format == "csv" else raw_data.to_xls(),
                    ["dataset_uploads", object_name],
                    is_temp=True,
                )

            else:
                offset = 0
                # Step 1: Create a temporary file and write to it
                with tempfile.NamedTemporaryFile(mode="w", delete=True) as temp_file:
                    # Slowly create the file in chunks
                    for _ in range(int(total_rows / SPLIT_LIMIT) + 1):
                        raw_data = self.fetch_data(offset=offset)
                        temp_file.write(
                            raw_data.to_csv(skip_header=offset > 0)
                            if self.details.format == "csv"
                            else raw_data.to_xls(skip_header=offset > 0)
                        )
                        temp_file.flush()  # Ensure data is written to disk
                        offset += SPLIT_LIMIT

                    # upload the file
                    upload_path = self.mavis.company.s3.upload_file(
                        temp_file.name, ["dataset_uploads", object_name], is_temp=True
                    )

            dataset_slug = graph_client.get_dataset_basic(id=self.mat.dataset_id).dataset_by_pk.slug
            meta = dict(s3_path=upload_path, type="datasets", slug=dataset_slug)
            encoded_meta = base64.urlsafe_b64encode(json.dumps(meta).encode("ascii")).decode()
            url = f"{PORTAL_URL}/{self.mavis.company.slug}/downloads/{encoded_meta}"

            # create the data model
            template_model = dict(name=self.mat.label, url=url)

            # send_email(
            #     self.mavis.company,
            #     # recipient.user.email,
            #     "ahmed@narrator.ai",
            #     DATASET_CSV_DOWNLOAD_EMAIL,
            #     template_model,
            #     tag="csv_email",
            #     skip_opt_out=True,
            # )

            # email the data
            for recipient in recipients:
                template_model["first_name"] = recipient.first_name
                send_email(
                    self.mavis.company,
                    recipient.user.email,
                    DATASET_CSV_DOWNLOAD_EMAIL,
                    template_model,
                    tag="csv_email",
                    skip_opt_out=True,
                )
        except Exception as e:
            send_raw_email(
                "ahmed@narrator.ai",
                "CSV Email Failed",
                f"CSV Email Failed with error: {str(e)}) For {self.mavis.company.slug} - {self.mat.dataset_id} - {self.mat.label}",
                tag="csv_email",
            )
