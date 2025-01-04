from core.decorators import with_mavis
from core.graph import graph_client
from core.v4.mavis import Mavis


@with_mavis
def upload_all_materialization(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """
    company = mavis.company

    # get all materializations
    all_mats = graph_client.execute(
        """
        query GetAllMaterializations($company_id: uuid!) {
            materializations: dataset_materialization(
                where: { dataset: { company_id: { _eq: $company_id } } }
            ) {
                id
                column_id
                days_to_resync
                group_slug
                label
                sheet_key
                template_id
                updated_by
                postmark_from
                type
                s3_secret_key
                webhook_url
                user_ids
                task_id
                dataset {
                slug
                }
            }
        }

        """,
        dict(company_id=company.id),
    ).json()["data"]["materializations"]

    for mat in all_mats:
        if mat.get("s3_secret_key"):
            s3_file = mavis.company.load_secret(mat["s3_secret_key"])

            if mat["type"] == "webhook":
                mat["webhook"] = s3_file
            else:
                mat.update(**s3_file)
        mavis.upload_materialization(mat["id"], mat)

        if mat["type"] in ("gsheets",):
            mat["external_link"] = f'https://docs.google.com/spreadsheets/d/{mat["sheet_key"]}'
        # elif mat["type"] == "postmark":
        #     mat["external_link"] = ''
        elif mat["type"] == "webhook":
            mat["external_link"] = mat["webhook_url"]

        # upload the materialization
        graph_client.update_dataset_materialization(
            id=mat["id"],
            type=mat["type"],
            group_slug=mat["group_slug"],
            label=mat["label"],
            updated_by=mat["updated_by"],
            external_link=mat.get("external_link"),
        )
