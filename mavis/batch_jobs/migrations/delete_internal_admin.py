from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def delete_internal_admin(mavis: Mavis, email: str | None = None, **kwargs):
    # Transfer the user
    graph_client.execute(
        """
        mutation TransferUserItems($email: String!, $to_email: String!) {
            update_sql_queries(where: {updated_by: {_eq: $email}}, _set: {updated_by: $to_email}) {
                returning {
                id
                }
            }
        }
        """,
        dict(
            email=email,
            to_email="ahmed@narrator.ai",
        ),
    )
    # delete internal admin
    user_id = graph_client.get_user_by_email(email=email).user[0].id
    new_user_id = graph_client.get_user_by_email(email="ahmed@narrator.ai").user[0].id

    # Transfer the user
    graph_client.execute(
        """
        mutation TransferUserItems($user_id: uuid!, $new_user_id: uuid!) {
            update_dataset(
                where: { created_by: { _eq: $user_id } }
                _set: { created_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_narrative(
                where: { created_by: { _eq: $user_id } }
                _set: { created_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            delete_watcher(
                where: { user_id: { _eq: $user_id } }
            ){
                returning {
                id
                }
            }
            update_transformation_test(
                where: { updated_by: { _eq: $user_id } }
                _set: { updated_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_company_query_alert(
                where: { updated_by: { _eq: $user_id } }
                _set: { updated_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_query_template(
                where: { updated_by: { _eq: $user_id } }
                _set: { updated_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_transformation(
                where: { updated_by: { _eq: $user_id } }
                _set: { updated_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_company(
                where: { created_by: { _eq: $user_id } }
                _set: { created_by: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_company_github_sync(
                where: { user_id: { _eq: $user_id } }
                _set: { user_id: $new_user_id }
            ){
                returning {
                id
                }
            }
            update_narrative_template(
                where: { created_by: { _eq: $user_id } }
                _set: { created_by: $new_user_id }
            ){
                returning {
                id
                }
            }
        }
        """,
        dict(
            user_id=user_id,
            new_user_id=new_user_id,
        ),
    )

    # delete the user
    graph_client.execute(
        """
        mutation DeleteUser($user_id: uuid!) {
             delete_user_by_pk(id: $user_id){
                id
            }
        }
        """,
        dict(user_id=user_id),
    )
