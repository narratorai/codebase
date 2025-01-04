from typing import Any, List, Optional, Union

from .activity_index import ActivityIndex
from .activity_index_w_columns import ActivityIndexWColumns
from .add_user_to_company import AddUserToCompany
from .archive_company import ArchiveCompany
from .archive_execution_history import ArchiveExecutionHistory
from .archive_query_updates import ArchiveQueryUpdates
from .auth_get_user_company import AuthGetUserCompany
from .base_client import BaseClient
from .base_model import UNSET, UnsetType
from .chat_index import ChatIndex
from .chat_user_index import ChatUserIndex
from .create_company_user_api_key import CreateCompanyUserApiKey
from .create_narrative import CreateNarrative
from .create_new_activity import CreateNewActivity
from .create_new_column import CreateNewColumn
from .create_new_transformation import CreateNewTransformation
from .create_user import CreateUser
from .dashboard_index import DashboardIndex
from .dataset_index import DatasetIndex
from .delete_activity import DeleteActivity
from .delete_activity_columns import DeleteActivityColumns
from .delete_activity_dim import DeleteActivityDim
from .delete_aggregation_dim import DeleteAggregationDim
from .delete_aggregation_dims import DeleteAggregationDims
from .delete_all_alerts_with_tasks import DeleteAllAlertsWithTasks
from .delete_all_queries import DeleteAllQueries
from .delete_category import DeleteCategory
from .delete_chat import DeleteChat
from .delete_columns import DeleteColumns
from .delete_company_resource import DeleteCompanyResource
from .delete_company_table import DeleteCompanyTable
from .delete_company_user import DeleteCompanyUser
from .delete_dataset import DeleteDataset
from .delete_dataset_narrative import DeleteDatasetNarrative
from .delete_dim import DeleteDim
from .delete_materialization import DeleteMaterialization
from .delete_narrative import DeleteNarrative
from .delete_narrative_integration import DeleteNarrativeIntegration
from .delete_query_template import DeleteQueryTemplate
from .delete_slowly_changing_dim import DeleteSlowlyChangingDim
from .delete_tag import DeleteTag
from .delete_tag_item import DeleteTagItem
from .delete_tag_items import DeleteTagItems
from .delete_tagged_item import DeleteTaggedItem
from .delete_team import DeleteTeam
from .delete_template import DeleteTemplate
from .delete_template_by_name import DeleteTemplateByName
from .delete_timeline import DeleteTimeline
from .delete_transformation import DeleteTransformation
from .delete_transformation_activity import DeleteTransformationActivity
from .delete_transformation_columns import DeleteTransformationColumns
from .delete_user import DeleteUser
from .delete_user_question import DeleteUserQuestion
from .delete_user_role import DeleteUserRole
from .delete_user_team import DeleteUserTeam
from .end_activity_maintenance import EndActivityMaintenance
from .end_dim_maintenance import EndDimMaintenance
from .end_transformation_maintenance import EndTransformationMaintenance
from .enums import (
    access_role_enum,
    column_rename_relations_enum,
    company_config_warehouse_language_enum,
    company_query_alert_kinds_enum,
    company_status_enum,
    company_task_category_enum,
    company_timeline_relations_enum,
    company_user_role_enum,
    datacenter_region_enum,
    maintenance_kinds_enum,
    materialization_type_enum,
    narrative_integration_kind_enum,
    narrative_template_kinds_enum,
    narrative_template_states_enum,
    narrative_types_enum,
    sql_query_kinds_enum,
    sql_query_relations_enum,
    status_enum,
    tag_relations_enum,
    task_execution_status_enum,
    trainining_request_status_enum,
    transformation_kinds_enum,
    transformation_test_status_enum,
    transformation_update_types_enum,
)
from .get_active_maintenance import GetActiveMaintenance
from .get_active_task_executions import GetActiveTaskExecutions
from .get_active_transformation_maintenance import GetActiveTransformationMaintenance
from .get_activities_by_slugs import GetActivitiesBySlugs
from .get_activities_w_columns import GetActivitiesWColumns
from .get_activity import GetActivity
from .get_activity_count import GetActivityCount
from .get_activity_dependencies import GetActivityDependencies
from .get_activity_dependency import GetActivityDependency
from .get_activity_features import GetActivityFeatures
from .get_activity_rows import GetActivityRows
from .get_activity_simple import GetActivitySimple
from .get_activity_transformations import GetActivityTransformations
from .get_activity_w_columns import GetActivityWColumns
from .get_alert import GetAlert
from .get_all_active_activity_maintenance import GetAllActiveActivityMaintenance
from .get_all_active_transformation_maintenance import (
    GetAllActiveTransformationMaintenance,
)
from .get_all_activities import GetAllActivities
from .get_all_activities_full import GetAllActivitiesFull
from .get_all_categories import GetAllCategories
from .get_all_chats import GetAllChats
from .get_all_companies import GetAllCompanies
from .get_all_companies_for_admin_user import GetAllCompaniesForAdminUser
from .get_all_companies_for_user import GetAllCompaniesForUser
from .get_all_companies_with_user_and_limit import GetAllCompaniesWithUserAndLimit
from .get_all_company_api_keys import GetAllCompanyApiKeys
from .get_all_company_tasks import GetAllCompanyTasks
from .get_all_custom_functions import GetAllCustomFunctions
from .get_all_identity_transformations import GetAllIdentityTransformations
from .get_all_internal_templates import GetAllInternalTemplates
from .get_all_materializations import GetAllMaterializations
from .get_all_narrative_integrations import GetAllNarrativeIntegrations
from .get_all_narratives import GetAllNarratives
from .get_all_roles import GetAllRoles
from .get_all_tags import GetAllTags
from .get_all_tasks_processing_no_batch_halt import GetAllTasksProcessingNoBatchHalt
from .get_all_template_versions import GetAllTemplateVersions
from .get_all_templates import GetAllTemplates
from .get_all_transformations import GetAllTransformations
from .get_all_users import GetAllUsers
from .get_allowed_prototypes import GetAllowedPrototypes
from .get_archived_companies import GetArchivedCompanies
from .get_auth_org import GetAuthOrg
from .get_basic_activities import GetBasicActivities
from .get_chat import GetChat
from .get_chat_context import GetChatContext
from .get_chats import GetChats
from .get_company import GetCompany
from .get_company_dims import GetCompanyDims
from .get_company_events import GetCompanyEvents
from .get_company_slug import GetCompanySlug
from .get_company_table import GetCompanyTable
from .get_company_table_aggregation import GetCompanyTableAggregation
from .get_company_table_aggregation_w_columns import GetCompanyTableAggregationWColumns
from .get_company_tag import GetCompanyTag
from .get_company_tasks import GetCompanyTasks
from .get_company_tasks_by_path import GetCompanyTasksByPath
from .get_company_templates import GetCompanyTemplates
from .get_company_user import GetCompanyUser
from .get_company_user_api_key import GetCompanyUserApiKey
from .get_company_user_id import GetCompanyUserId
from .get_company_users import GetCompanyUsers
from .get_dataset import GetDataset
from .get_dataset_basic import GetDatasetBasic
from .get_dataset_count import GetDatasetCount
from .get_dataset_maintenance import GetDatasetMaintenance
from .get_dataset_materialization import GetDatasetMaterialization
from .get_dataset_materializations import GetDatasetMaterializations
from .get_datasets_by_slug import GetDatasetsBySlug
from .get_dim import GetDim
from .get_dim_maintenance import GetDimMaintenance
from .get_dim_with_dependencies import GetDimWithDependencies
from .get_dims_with_dependencies import GetDimsWithDependencies
from .get_enrichment_tables import GetEnrichmentTables
from .get_fivex_companies import GetFivexCompanies
from .get_free_templates import GetFreeTemplates
from .get_full_activity import GetFullActivity
from .get_full_dataset import GetFullDataset
from .get_full_narrative import GetFullNarrative
from .get_full_task import GetFullTask
from .get_full_transformation import GetFullTransformation
from .get_internal_template_by_name import GetInternalTemplateByName
from .get_internal_users import GetInternalUsers
from .get_items_for_tag import GetItemsForTag
from .get_last_executed_tasks import GetLastExecutedTasks
from .get_last_executions import GetLastExecutions
from .get_materialization_count import GetMaterializationCount
from .get_narrative import GetNarrative
from .get_narrative_basic import GetNarrativeBasic
from .get_narrative_by_slug import GetNarrativeBySlug
from .get_narrative_count import GetNarrativeCount
from .get_narrative_integration import GetNarrativeIntegration
from .get_narrative_snapshots import GetNarrativeSnapshots
from .get_narrative_task import GetNarrativeTask
from .get_narratives import GetNarratives
from .get_opt_out_emails import GetOptOutEmails
from .get_popular_tags import GetPopularTags
from .get_query_template_sources import GetQueryTemplateSources
from .get_query_templates import GetQueryTemplates
from .get_query_templates_for_source import GetQueryTemplatesForSource
from .get_recent_transformation_tests import GetRecentTransformationTests
from .get_reports import GetReports
from .get_running_executions import GetRunningExecutions
from .get_service_limit import GetServiceLimit
from .get_single_activity_table_count import GetSingleActivityTableCount
from .get_single_task import GetSingleTask
from .get_slowly_changing_customer_dim import GetSlowlyChangingCustomerDim
from .get_table import GetTable
from .get_tagged_items import GetTaggedItems
from .get_task_by_slug import GetTaskBySlug
from .get_task_execution import GetTaskExecution
from .get_task_watchers import GetTaskWatchers
from .get_tasks import GetTasks
from .get_team import GetTeam
from .get_team_permissions import GetTeamPermissions
from .get_template import GetTemplate
from .get_template_by_name import GetTemplateByName
from .get_timeline import GetTimeline
from .get_training_request import GetTrainingRequest
from .get_transformation_context import GetTransformationContext
from .get_transformation_count import GetTransformationCount
from .get_transformation_for_processing import GetTransformationForProcessing
from .get_transformation_for_production import GetTransformationForProduction
from .get_transformation_query_updates import GetTransformationQueryUpdates
from .get_transformation_simple import GetTransformationSimple
from .get_transformation_tests import GetTransformationTests
from .get_transformation_updates import GetTransformationUpdates
from .get_transformations import GetTransformations
from .get_transformations_for_activity import GetTransformationsForActivity
from .get_user import GetUser
from .get_user_by_email import GetUserByEmail
from .get_user_companies import GetUserCompanies
from .get_user_special_tags import GetUserSpecialTags
from .get_version import GetVersion
from .get_versions import GetVersions
from .get_view_tag import GetViewTag
from .input_types import (
    activity_bool_exp,
    chat_bool_exp,
    company_narrative_templates_insert_input,
    company_user_set_input,
    dataset_activities_insert_input,
    narrative_datasets_insert_input,
    narrative_narratives_insert_input,
    tag_insert_input,
    team_permission_insert_input,
    transformation_depends_on_insert_input,
    transformation_run_after_insert_input,
)
from .insert_activity_dim import InsertActivityDim
from .insert_activity_maintenance import InsertActivityMaintenance
from .insert_aggregation_dim import InsertAggregationDim
from .insert_category import InsertCategory
from .insert_chat import InsertChat
from .insert_company import InsertCompany
from .insert_company_org import InsertCompanyOrg
from .insert_company_resources import InsertCompanyResources
from .insert_company_table import InsertCompanyTable
from .insert_company_timeline import InsertCompanyTimeline
from .insert_custom_function import InsertCustomFunction
from .insert_dataset import InsertDataset
from .insert_dataset_materialization import InsertDatasetMaterialization
from .insert_default_service_limit import InsertDefaultServiceLimit
from .insert_dim_table import InsertDimTable
from .insert_narrative import InsertNarrative
from .insert_narrative_integration import InsertNarrativeIntegration
from .insert_narrative_run import InsertNarrativeRun
from .insert_narrative_template import InsertNarrativeTemplate
from .insert_query_alert import InsertQueryAlert
from .insert_query_template import InsertQueryTemplate
from .insert_query_update import InsertQueryUpdate
from .insert_service_limit import InsertServiceLimit
from .insert_slowly_changing_dim import InsertSlowlyChangingDim
from .insert_sql_query import InsertSqlQuery
from .insert_tag import InsertTag
from .insert_tag_item_one import InsertTagItemOne
from .insert_task import InsertTask
from .insert_task_execution import InsertTaskExecution
from .insert_team import InsertTeam
from .insert_test import InsertTest
from .insert_training_request import InsertTrainingRequest
from .insert_transformation_activity import InsertTransformationActivity
from .insert_transformation_maintenance import InsertTransformationMaintenance
from .insert_user_role import InsertUserRole
from .insert_user_team import InsertUserTeam
from .insert_version import InsertVersion
from .missing_activity_permission import MissingActivityPermission
from .narrative_index import NarrativeIndex
from .ordered_dataset_index import OrderedDatasetIndex
from .ordered_narrative_index import OrderedNarrativeIndex
from .record_task_cancelled import RecordTaskCancelled
from .record_task_complete import RecordTaskComplete
from .record_task_failed import RecordTaskFailed
from .record_task_query import RecordTaskQuery
from .record_tasks_stuck import RecordTasksStuck
from .rename_company_table import RenameCompanyTable
from .revoke_company_user_api_key import RevokeCompanyUserApiKey
from .task_index import TaskIndex
from .training_request_index import TrainingRequestIndex
from .transfer_api_keys import TransferApiKeys
from .transfer_user_items import TransferUserItems
from .transformation_index import TransformationIndex
from .transformation_index_w_dependency import TransformationIndexWDependency
from .update_activity import UpdateActivity
from .update_activity_category import UpdateActivityCategory
from .update_activity_rows import UpdateActivityRows
from .update_chat_summary import UpdateChatSummary
from .update_chat_vote import UpdateChatVote
from .update_column import UpdateColumn
from .update_company import UpdateCompany
from .update_company_batch_halt import UpdateCompanyBatchHalt
from .update_company_status import UpdateCompanyStatus
from .update_company_table import UpdateCompanyTable
from .update_company_table_partition import UpdateCompanyTablePartition
from .update_company_table_rows import UpdateCompanyTableRows
from .update_company_templates import UpdateCompanyTemplates
from .update_company_timeline import UpdateCompanyTimeline
from .update_company_with_auth0_org import UpdateCompanyWithAuth0Org
from .update_dataset import UpdateDataset
from .update_dataset_created_by import UpdateDatasetCreatedBy
from .update_dataset_materialization import UpdateDatasetMaterialization
from .update_dataset_relations import UpdateDatasetRelations
from .update_datasetstatus import UpdateDatasetstatus
from .update_datasource import UpdateDatasource
from .update_execution_status import UpdateExecutionStatus
from .update_item_tags import UpdateItemTags
from .update_narrative import UpdateNarrative
from .update_narrative_config import UpdateNarrativeConfig
from .update_narrative_depends import UpdateNarrativeDepends
from .update_narrative_meta import UpdateNarrativeMeta
from .update_narrative_relations import UpdateNarrativeRelations
from .update_narrative_snapshot import UpdateNarrativeSnapshot
from .update_narrative_template import UpdateNarrativeTemplate
from .update_narrative_with_template import UpdateNarrativeWithTemplate
from .update_next_resync import UpdateNextResync
from .update_query_template import UpdateQueryTemplate
from .update_role import UpdateRole
from .update_sql_query import UpdateSqlQuery
from .update_tag import UpdateTag
from .update_task import UpdateTask
from .update_task_orchestration_id import UpdateTaskOrchestrationId
from .update_task_schedule import UpdateTaskSchedule
from .update_team import UpdateTeam
from .update_team_permissions import UpdateTeamPermissions
from .update_test import UpdateTest
from .update_training_request import UpdateTrainingRequest
from .update_transformation_column_casting import UpdateTransformationColumnCasting
from .update_transformation_config import UpdateTransformationConfig
from .update_transformation_maintenance_note import UpdateTransformationMaintenanceNote
from .update_transformation_name import UpdateTransformationName
from .update_transformation_resync import UpdateTransformationResync
from .update_transformation_run_depends import UpdateTransformationRunDepends
from .update_transformation_single_activity import UpdateTransformationSingleActivity
from .update_transformation_update_type import UpdateTransformationUpdateType
from .update_user_avatar import UpdateUserAvatar
from .update_user_context import UpdateUserContext


def gql(q: str) -> str:
    return q


class Client(BaseClient):
    def activity_index(self, company_id: Any) -> ActivityIndex:
        query = gql(
            """
            query ActivityIndex($company_id: uuid!) {
              all_activities: activity(
                where: {company_id: {_eq: $company_id}}
                order_by: {table_id: asc}
              ) {
                id
                name
                slug
                description
                category
                updated_at
                table_id
                row_count
                maintainer_id
                company_table {
                  activity_stream
                  maintainer_id
                }
                activity_maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ActivityIndex.parse_obj(data)

    def activity_index_w_columns(self, company_id: Any) -> ActivityIndexWColumns:
        query = gql(
            """
            query ActivityIndexWColumns($company_id: uuid!) {
              all_activities: activity(
                where: {company_id: {_eq: $company_id}}
                order_by: {table_id: asc}
              ) {
                category
                description
                id
                name
                slug
                updated_at
                table_id
                company_table {
                  activity_stream
                }
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                }
                activity_dims {
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      type
                      label
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ActivityIndexWColumns.parse_obj(data)

    def add_user_to_company(
        self,
        company_id: Any,
        user_id: Any,
        first_name: Union[Optional[str], UnsetType] = UNSET,
        last_name: Union[Optional[str], UnsetType] = UNSET,
        job_title: Union[Optional[str], UnsetType] = UNSET,
    ) -> AddUserToCompany:
        query = gql(
            """
            mutation AddUserToCompany($company_id: uuid!, $user_id: uuid!, $first_name: String, $last_name: String, $job_title: String) {
              insert_company_user_one(
                object: {company_id: $company_id, user_id: $user_id, first_name: $first_name, last_name: $last_name, job_title: $job_title}
                on_conflict: {constraint: company_user_company_id_user_id_key, update_columns: [first_name, last_name, job_title]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "job_title": job_title,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return AddUserToCompany.parse_obj(data)

    def archive_company(self, company_id: Any) -> ArchiveCompany:
        query = gql(
            """
            mutation ArchiveCompany($company_id: uuid!) {
              update_company_by_pk(pk_columns: {id: $company_id}, _set: {status: archived}) {
                id
              }
              update_service_limit(
                where: {company_id: {_eq: $company_id}, end_on: {_is_null: true}}
                _set: {end_on: "now()"}
              ) {
                returning {
                  company_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ArchiveCompany.parse_obj(data)

    def archive_execution_history(self, before: Any) -> ArchiveExecutionHistory:
        query = gql(
            """
            mutation ArchiveExecutionHistory($before: timestamptz!) {
              delete_task_execution(where: {created_at: {_lt: $before}}) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"before": before}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ArchiveExecutionHistory.parse_obj(data)

    def archive_query_updates(self, before: Any) -> ArchiveQueryUpdates:
        query = gql(
            """
            mutation ArchiveQueryUpdates($before: timestamptz!) {
              delete_query_updates(where: {created_at: {_lt: $before}}) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"before": before}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ArchiveQueryUpdates.parse_obj(data)

    def auth_get_user_company(self, user_id: Any, auth0_org_id: str) -> AuthGetUserCompany:
        query = gql(
            """
            query AuthGetUserCompany($user_id: uuid!, $auth0_org_id: String!) {
              user: user_by_pk(id: $user_id) {
                id
                email
                role
                company_users {
                  id
                  company_id
                  team_users {
                    team_id
                  }
                  user_access_roles {
                    role
                  }
                }
              }
              companies: company(where: {auth0: {org_id: {_eq: $auth0_org_id}}}) {
                id
                slug
                name
                status
                auth0 {
                  org_id
                }
                teams {
                  id
                  name
                }
                company_tags(
                  where: {user_id: {_eq: $user_id}, tag: {_in: ["recently_viewed", "favorite"]}}
                ) {
                  id
                  tag
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "user_id": user_id,
            "auth0_org_id": auth0_org_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return AuthGetUserCompany.parse_obj(data)

    def chat_index(self, company_id: Any) -> ChatIndex:
        query = gql(
            """
            query ChatIndex($company_id: uuid!) {
              chat(
                where: {company_table: {company_id: {_eq: $company_id}}}
                order_by: {created_at: desc}
              ) {
                id
                table_id
                created_by
                created_at
                question
                rating
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ChatIndex.parse_obj(data)

    def chat_user_index(self, company_id: Any, user_id: Any) -> ChatUserIndex:
        query = gql(
            """
            query ChatUserIndex($company_id: uuid!, $user_id: uuid!) {
              chat(
                where: {company_table: {company_id: {_eq: $company_id}}, created_by: {_eq: $user_id}}
                order_by: {created_at: desc}
              ) {
                id
                table_id
                created_by
                created_at
                question
                rating
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return ChatUserIndex.parse_obj(data)

    def create_company_user_api_key(
        self, company_user_id: Any, label: Union[Optional[str], UnsetType] = UNSET
    ) -> CreateCompanyUserApiKey:
        query = gql(
            """
            mutation CreateCompanyUserApiKey($label: String, $company_user_id: uuid!) {
              inserted_api_key: insert_company_user_api_key_one(
                object: {label: $label, company_user_id: $company_user_id}
              ) {
                id
                label
                created_at
                company_user {
                  user {
                    id
                    email
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "label": label,
            "company_user_id": company_user_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateCompanyUserApiKey.parse_obj(data)

    def create_narrative(
        self,
        company_id: Any,
        slug: str,
        name: str,
        created_by: Any,
        description: Union[Optional[str], UnsetType] = UNSET,
        type: Union[Optional[narrative_types_enum], UnsetType] = UNSET,
    ) -> CreateNarrative:
        query = gql(
            """
            mutation CreateNarrative($company_id: uuid!, $slug: String!, $name: String!, $description: String, $created_by: uuid!, $type: narrative_types_enum) {
              narrative: insert_narrative_one(
                object: {company_id: $company_id, created_by: $created_by, slug: $slug, name: $name, type: $type, description: $description}
              ) {
                id
                name
                description
                type
                created_at
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "name": name,
            "description": description,
            "created_by": created_by,
            "type": type,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateNarrative.parse_obj(data)

    def create_new_activity(
        self,
        company_id: Any,
        slug: str,
        table_id: Any,
        name: str,
        description: Union[Optional[str], UnsetType] = UNSET,
        maintainer_id: Union[Optional[Any], UnsetType] = UNSET,
        updated_by: Union[Optional[str], UnsetType] = UNSET,
    ) -> CreateNewActivity:
        query = gql(
            """
            mutation CreateNewActivity($company_id: uuid!, $slug: String!, $table_id: uuid!, $name: String!, $description: String, $maintainer_id: uuid, $updated_by: String) {
              insert_activity_one(
                object: {company_id: $company_id, name: $name, description: $description, updated_by: $updated_by, slug: $slug, table_id: $table_id, maintainer_id: $maintainer_id}
              ) {
                id
                name
                slug
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "table_id": table_id,
            "name": name,
            "description": description,
            "maintainer_id": maintainer_id,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateNewActivity.parse_obj(data)

    def create_new_column(
        self,
        related_to: column_rename_relations_enum,
        related_to_id: Any,
        name: str,
        type: str,
        label: Union[Optional[str], UnsetType] = UNSET,
        casting: Union[Optional[str], UnsetType] = UNSET,
        has_data: Union[Optional[bool], UnsetType] = UNSET,
    ) -> CreateNewColumn:
        query = gql(
            """
            mutation CreateNewColumn($related_to: column_rename_relations_enum!, $related_to_id: uuid!, $name: String!, $label: String, $type: String!, $casting: String, $has_data: Boolean) {
              insert_column_renames_one(
                object: {related_to: $related_to, related_to_id: $related_to_id, name: $name, label: $label, type: $type, casting: $casting, has_data: $has_data}
                on_conflict: {constraint: column_renames_related_to_related_to_id_name_key, update_columns: [label, type, has_data, casting]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "related_to_id": related_to_id,
            "name": name,
            "label": label,
            "type": type,
            "casting": casting,
            "has_data": has_data,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateNewColumn.parse_obj(data)

    def create_new_transformation(
        self,
        company_id: Any,
        slug: str,
        table: str,
        update_type: transformation_update_types_enum,
        kind: transformation_kinds_enum,
        name: str,
        task_id: Union[Optional[Any], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
    ) -> CreateNewTransformation:
        query = gql(
            """
            mutation CreateNewTransformation($company_id: uuid!, $slug: String!, $table: String!, $update_type: transformation_update_types_enum!, $kind: transformation_kinds_enum!, $name: String!, $task_id: uuid, $updated_by: uuid) {
              transformation: insert_transformation_one(
                object: {company_id: $company_id, update_type: $update_type, table: $table, slug: $slug, name: $name, kind: $kind, task_id: $task_id, updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "table": table,
            "update_type": update_type,
            "kind": kind,
            "name": name,
            "task_id": task_id,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateNewTransformation.parse_obj(data)

    def create_user(self, email: str) -> CreateUser:
        query = gql(
            """
            mutation CreateUser($email: String!) {
              insert_user_one(
                object: {email: $email, role: user}
                on_conflict: {constraint: user_email_key, update_columns: [email]}
              ) {
                id
                role
              }
            }
            """
        )
        variables: dict[str, object] = {"email": email}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return CreateUser.parse_obj(data)

    def dashboard_index(self, company_id: Any) -> DashboardIndex:
        query = gql(
            """
            query DashboardIndex($company_id: uuid!) {
              narrative(
                where: {company_id: {_eq: $company_id}, state: {_neq: archived}, type: {_eq: dashboard}}
                order_by: [{updated_at: desc}]
              ) {
                id
                slug
                name
                state
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DashboardIndex.parse_obj(data)

    def dataset_index(self, company_id: Any) -> DatasetIndex:
        query = gql(
            """
            query DatasetIndex($company_id: uuid!) {
              dataset(
                where: {company_id: {_eq: $company_id}, status: {_neq: archived}}
                order_by: [{updated_at: desc}]
              ) {
                created_by
                description
                name
                slug
                status
                category
                updated_at
                metric_id
                id
                tags {
                  tag_id
                  updated_at
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DatasetIndex.parse_obj(data)

    def delete_activity(self, id: Any) -> DeleteActivity:
        query = gql(
            """
            mutation DeleteActivity($id: uuid!) {
              delete_activity_by_pk(id: $id) {
                id
                table_id
                slug
              }
              update_dataset(
                where: {dataset_activities: {activity_id: {_eq: $id}}}
                _set: {status: archived}
              ) {
                returning {
                  id
                }
              }
              update_narrative(
                where: {narrative_datasets: {dataset: {dataset_activities: {activity_id: {_eq: $id}}}}}
                _set: {state: archived}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteActivity.parse_obj(data)

    def delete_activity_columns(self, activity_id: Any) -> DeleteActivityColumns:
        query = gql(
            """
            mutation DeleteActivityColumns($activity_id: uuid!) {
              delete_column_renames(
                where: {related_to: {_eq: activity}, related_to_id: {_eq: $activity_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"activity_id": activity_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteActivityColumns.parse_obj(data)

    def delete_activity_dim(self, id: Any) -> DeleteActivityDim:
        query = gql(
            """
            mutation DeleteActivityDim($id: uuid!) {
              delete_activity_dim_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteActivityDim.parse_obj(data)

    def delete_aggregation_dim(self, dim_id: Any, table_id: Any) -> DeleteAggregationDim:
        query = gql(
            """
            mutation DeleteAggregationDim($dim_id: uuid!, $table_id: uuid!) {
              delete_company_table_aggregation_dim(
                where: {dim_table_id: {_eq: $dim_id}, company_table_id: {_eq: $table_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"dim_id": dim_id, "table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteAggregationDim.parse_obj(data)

    def delete_aggregation_dims(self, company_table_id: Any) -> DeleteAggregationDims:
        query = gql(
            """
            mutation DeleteAggregationDims($company_table_id: uuid!) {
              delete_company_table_aggregation_dim(
                where: {company_table_id: {_eq: $company_table_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_table_id": company_table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteAggregationDims.parse_obj(data)

    def delete_all_alerts_with_tasks(
        self,
        related_to: sql_query_relations_enum,
        related_id: Any,
        related_kind: sql_query_kinds_enum,
    ) -> DeleteAllAlertsWithTasks:
        query = gql(
            """
            mutation DeleteAllAlertsWithTasks($related_to: sql_query_relations_enum!, $related_id: uuid!, $related_kind: sql_query_kinds_enum!) {
              delete_company_task(
                where: {company_query_alerts: {sql_query: {related_id: {_eq: $related_id}, related_kind: {_eq: $related_kind}, related_to: {_eq: $related_to}}}}
              ) {
                affected_rows
              }
              delete_sql_queries(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $related_id}, related_kind: {_eq: $related_kind}}
              ) {
                returning {
                  id
                }
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "related_id": related_id,
            "related_kind": related_kind,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteAllAlertsWithTasks.parse_obj(data)

    def delete_all_queries(
        self,
        related_to: sql_query_relations_enum,
        related_id: Any,
        related_kind: sql_query_kinds_enum,
    ) -> DeleteAllQueries:
        query = gql(
            """
            mutation DeleteAllQueries($related_to: sql_query_relations_enum!, $related_id: uuid!, $related_kind: sql_query_kinds_enum!) {
              delete_sql_queries(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $related_id}, related_kind: {_eq: $related_kind}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "related_id": related_id,
            "related_kind": related_kind,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteAllQueries.parse_obj(data)

    def delete_category(self, id: Any) -> DeleteCategory:
        query = gql(
            """
            mutation DeleteCategory($id: uuid!) {
              delete_company_categories_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteCategory.parse_obj(data)

    def delete_chat(self, id: Any) -> DeleteChat:
        query = gql(
            """
            mutation DeleteChat($id: uuid!) {
              delete_chat_by_pk(id: $id) {
                id
                table_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteChat.parse_obj(data)

    def delete_columns(self, id: Any, related_to: column_rename_relations_enum) -> DeleteColumns:
        query = gql(
            """
            mutation DeleteColumns($id: uuid!, $related_to: column_rename_relations_enum!) {
              delete_column_renames(
                where: {related_to: {_eq: $related_to}, related_to_id: {_eq: $id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "related_to": related_to}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteColumns.parse_obj(data)

    def delete_company_resource(self, id: Any) -> DeleteCompanyResource:
        query = gql(
            """
            mutation DeleteCompanyResource($id: uuid!) {
              delete_company_resources_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteCompanyResource.parse_obj(data)

    def delete_company_table(self, id: Any) -> DeleteCompanyTable:
        query = gql(
            """
            mutation DeleteCompanyTable($id: uuid!) {
              delete_company_table_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteCompanyTable.parse_obj(data)

    def delete_company_user(self, user_id: Any, company_id: Any) -> DeleteCompanyUser:
        query = gql(
            """
            mutation DeleteCompanyUser($user_id: uuid!, $company_id: uuid!) {
              company_user: delete_company_user(
                where: {company_id: {_eq: $company_id}, user_id: {_eq: $user_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"user_id": user_id, "company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteCompanyUser.parse_obj(data)

    def delete_dataset(self, id: Any) -> DeleteDataset:
        query = gql(
            """
            mutation DeleteDataset($id: uuid!) {
              delete_dataset_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteDataset.parse_obj(data)

    def delete_dataset_narrative(
        self,
        narrative_slug: Union[Optional[str], UnsetType] = UNSET,
        dataset_slug: Union[Optional[str], UnsetType] = UNSET,
        company_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> DeleteDatasetNarrative:
        query = gql(
            """
            mutation DeleteDatasetNarrative($narrative_slug: String, $dataset_slug: String, $company_id: uuid) {
              delete_dataset(
                where: {slug: {_eq: $dataset_slug}, company_id: {_eq: $company_id}}
              ) {
                returning {
                  id
                }
              }
              delete_narrative(
                where: {slug: {_eq: $narrative_slug}, company_id: {_eq: $company_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "narrative_slug": narrative_slug,
            "dataset_slug": dataset_slug,
            "company_id": company_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteDatasetNarrative.parse_obj(data)

    def delete_dim(self, id: Any) -> DeleteDim:
        query = gql(
            """
            mutation DeleteDim($id: uuid!) {
              delete_dim_table_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteDim.parse_obj(data)

    def delete_materialization(self, id: Any) -> DeleteMaterialization:
        query = gql(
            """
            mutation DeleteMaterialization($id: uuid!) {
              delete_dataset_materialization_by_pk(id: $id) {
                id
                dataset_id
                label
                type
                task_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteMaterialization.parse_obj(data)

    def delete_narrative(self, id: Any) -> DeleteNarrative:
        query = gql(
            """
            mutation DeleteNarrative($id: uuid!) {
              delete_narrative_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteNarrative.parse_obj(data)

    def delete_narrative_integration(self, id: Any) -> DeleteNarrativeIntegration:
        query = gql(
            """
            mutation DeleteNarrativeIntegration($id: uuid!) {
              delete_narrative_integrations_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteNarrativeIntegration.parse_obj(data)

    def delete_query_template(self, id: Any) -> DeleteQueryTemplate:
        query = gql(
            """
            mutation DeleteQueryTemplate($id: uuid!) {
              delete_query_template_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteQueryTemplate.parse_obj(data)

    def delete_slowly_changing_dim(self, id: Any) -> DeleteSlowlyChangingDim:
        query = gql(
            """
            mutation DeleteSlowlyChangingDim($id: uuid!) {
              delete_slowly_changing_customer_dims_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteSlowlyChangingDim.parse_obj(data)

    def delete_tag(self, id: Any) -> DeleteTag:
        query = gql(
            """
            mutation DeleteTag($id: uuid!) {
              delete_company_tags_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTag.parse_obj(data)

    def delete_tag_item(self, related_id: Any, related_to: tag_relations_enum, tag_id: Any) -> DeleteTagItem:
        query = gql(
            """
            mutation DeleteTagItem($related_id: uuid!, $related_to: tag_relations_enum!, $tag_id: uuid!) {
              delete_tag(
                where: {related_id: {_eq: $related_id}, related_to: {_eq: $related_to}, tag_id: {_eq: $tag_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_id": related_id,
            "related_to": related_to,
            "tag_id": tag_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTagItem.parse_obj(data)

    def delete_tag_items(self, tag_id: Any) -> DeleteTagItems:
        query = gql(
            """
            mutation DeleteTagItems($tag_id: uuid!) {
              delete_tag(where: {tag_id: {_eq: $tag_id}}) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"tag_id": tag_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTagItems.parse_obj(data)

    def delete_tagged_item(self, id: Any) -> DeleteTaggedItem:
        query = gql(
            """
            mutation DeleteTaggedItem($id: uuid!) {
              delete_tag_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTaggedItem.parse_obj(data)

    def delete_team(self, id: Any) -> DeleteTeam:
        query = gql(
            """
            mutation DeleteTeam($id: uuid!) {
              delete_team_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTeam.parse_obj(data)

    def delete_template(self, id: Any) -> DeleteTemplate:
        query = gql(
            """
            mutation DeleteTemplate($id: uuid!) {
              delete_narrative_template_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTemplate.parse_obj(data)

    def delete_template_by_name(
        self, name: str, max_customer_iteration: Union[Optional[int], UnsetType] = UNSET
    ) -> DeleteTemplateByName:
        query = gql(
            """
            mutation DeleteTemplateByName($name: String!, $max_customer_iteration: Int = 100000) {
              delete_narrative_template(
                where: {name: {_eq: $name}, customer_iteration: {_lte: $max_customer_iteration}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "name": name,
            "max_customer_iteration": max_customer_iteration,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTemplateByName.parse_obj(data)

    def delete_timeline(self, id: Any) -> DeleteTimeline:
        query = gql(
            """
            mutation DeleteTimeline($id: uuid!) {
              delete_company_timeline_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTimeline.parse_obj(data)

    def delete_transformation(self, id: Any) -> DeleteTransformation:
        query = gql(
            """
            mutation DeleteTransformation($id: uuid!) {
              delete_transformation_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTransformation.parse_obj(data)

    def delete_transformation_activity(self, activity_id: Any, transformation_id: Any) -> DeleteTransformationActivity:
        query = gql(
            """
            mutation DeleteTransformationActivity($activity_id: uuid!, $transformation_id: uuid!) {
              delete_transformation_activities(
                where: {transformation_id: {_eq: $transformation_id}, activity_id: {_eq: $activity_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "activity_id": activity_id,
            "transformation_id": transformation_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTransformationActivity.parse_obj(data)

    def delete_transformation_columns(self, transformation_id: Any) -> DeleteTransformationColumns:
        query = gql(
            """
            mutation DeleteTransformationColumns($transformation_id: uuid!) {
              delete_column_renames(
                where: {related_to: {_eq: transformation}, related_to_id: {_eq: $transformation_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"transformation_id": transformation_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteTransformationColumns.parse_obj(data)

    def delete_user(self, user_id: Any) -> DeleteUser:
        query = gql(
            """
            mutation DeleteUser($user_id: uuid!) {
              user: delete_user_by_pk(id: $user_id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteUser.parse_obj(data)

    def delete_user_question(self, id: Any) -> DeleteUserQuestion:
        query = gql(
            """
            mutation DeleteUserQuestion($id: uuid!) {
              delete_user_training_question_by_pk(id: $id) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteUserQuestion.parse_obj(data)

    def delete_user_role(
        self,
        company_user_id: Any,
        role: Union[Optional[access_role_enum], UnsetType] = UNSET,
    ) -> DeleteUserRole:
        query = gql(
            """
            mutation DeleteUserRole($company_user_id: uuid!, $role: access_role_enum) {
              delete_user_access_role(
                where: {company_user_id: {_eq: $company_user_id}, role: {_eq: $role}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_user_id": company_user_id,
            "role": role,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteUserRole.parse_obj(data)

    def delete_user_team(self, company_user_id: Any, team_id: Any) -> DeleteUserTeam:
        query = gql(
            """
            mutation DeleteUserTeam($company_user_id: uuid!, $team_id: uuid!) {
              delete_team_user(
                where: {company_user_id: {_eq: $company_user_id}, team_id: {_eq: $team_id}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_user_id": company_user_id,
            "team_id": team_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return DeleteUserTeam.parse_obj(data)

    def end_activity_maintenance(self, activity_id: Any) -> EndActivityMaintenance:
        query = gql(
            """
            mutation EndActivityMaintenance($activity_id: uuid!) {
              update_activity_maintenance(
                where: {ended_at: {_is_null: true}, activity_id: {_eq: $activity_id}}
                _set: {ended_at: "now()"}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"activity_id": activity_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return EndActivityMaintenance.parse_obj(data)

    def end_dim_maintenance(self, dim_table_id: Any) -> EndDimMaintenance:
        query = gql(
            """
            mutation EndDimMaintenance($dim_table_id: uuid!) {
              update_activity_maintenance(
                where: {ended_at: {_is_null: true}, dim_table_id: {_eq: $dim_table_id}}
                _set: {ended_at: "now()"}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"dim_table_id": dim_table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return EndDimMaintenance.parse_obj(data)

    def end_transformation_maintenance(self, transformation_id: Any) -> EndTransformationMaintenance:
        query = gql(
            """
            mutation EndTransformationMaintenance($transformation_id: uuid!) {
              update_transformation_maintenance(
                where: {ended_at: {_is_null: true}, transformation_id: {_eq: $transformation_id}}
                _set: {ended_at: "now()"}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"transformation_id": transformation_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return EndTransformationMaintenance.parse_obj(data)

    def get_active_maintenance(self, ids: List[Any], last_updated_at: Any) -> GetActiveMaintenance:
        query = gql(
            """
            query GetActiveMaintenance($ids: [uuid!]!, $last_updated_at: timestamptz!) {
              activity_maintenance(
                where: {activity_id: {_in: $ids}, _or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}
                order_by: {ended_at: desc_nulls_first}
              ) {
                id
                kind
                notes
                started_at
                ended_at
                activity_id
                maintenance_kind {
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids, "last_updated_at": last_updated_at}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActiveMaintenance.parse_obj(data)

    def get_active_task_executions(self) -> GetActiveTaskExecutions:
        query = gql(
            """
            query GetActiveTaskExecutions {
              task_executions: task_execution(where: {status: {_in: [pending, running]}}) {
                id
                task_id
                status
                started_at
                orchestration_id
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActiveTaskExecutions.parse_obj(data)

    def get_active_transformation_maintenance(
        self, id: Any, last_updated_at: Any
    ) -> GetActiveTransformationMaintenance:
        query = gql(
            """
            query GetActiveTransformationMaintenance($id: uuid!, $last_updated_at: timestamptz!) {
              transformation_maintenance(
                where: {transformation_id: {_eq: $id}, _or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}
                order_by: {ended_at: desc_nulls_first}
              ) {
                id
                kind
                notes
                started_at
                ended_at
                transformation_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "last_updated_at": last_updated_at}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActiveTransformationMaintenance.parse_obj(data)

    def get_activities_by_slugs(self, table_id: Any, slugs: List[str]) -> GetActivitiesBySlugs:
        query = gql(
            """
            query GetActivitiesBySlugs($table_id: uuid!, $slugs: [String!]!) {
              activities: activity(where: {table_id: {_eq: $table_id}, slug: {_in: $slugs}}) {
                id
                slug
                name
                description
                table_id
                row_count
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id, "slugs": slugs}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivitiesBySlugs.parse_obj(data)

    def get_activities_w_columns(self, ids: List[Any]) -> GetActivitiesWColumns:
        query = gql(
            """
            query GetActivitiesWColumns($ids: [uuid!]!) {
              activities: activity(where: {id: {_in: $ids}}) {
                id
                slug
                name
                description
                table_id
                category
                row_count
                company_table {
                  activity_stream
                  slowly_changing_customer_dims {
                    slowly_changing_ts_column
                    dim_table {
                      id
                      schema_: schema
                      table
                      join_key
                      columns {
                        id
                        name
                        type
                        label
                      }
                    }
                  }
                }
                column_renames(order_by: {created_at: asc}) {
                  id
                  label
                  type
                  name
                  has_data
                }
                activity_dims {
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      type
                      label
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivitiesWColumns.parse_obj(data)

    def get_activity(self, id: Any) -> GetActivity:
        query = gql(
            """
            query GetActivity($id: uuid!) {
              activity_by_pk(id: $id) {
                id
                name
                slug
                created_at
                updated_by
                updated_at
                table_id
                description
                row_count
                maintainer_id
                column_renames {
                  id
                  label
                  type
                  casting
                  name
                  has_data
                }
                activity_dims {
                  id
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      label
                      type
                    }
                  }
                }
                company_table {
                  slowly_changing_customer_dims {
                    slowly_changing_ts_column
                    dim_table {
                      id
                      schema_: schema
                      table
                      join_key
                      columns {
                        id
                        name
                        type
                        label
                      }
                    }
                  }
                }
                transformations {
                  transformation {
                    id
                    name
                    notes
                    production_queries(order_by: [{created_at: desc_nulls_last}], limit: 1) {
                      sql
                      updated_at
                      updated_by
                    }
                  }
                }
                company_category {
                  id
                  category
                }
                timeline(order_by: [{happened_at: asc}]) {
                  id
                  name
                  happened_at
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivity.parse_obj(data)

    def get_activity_count(self, table_id: Any) -> GetActivityCount:
        query = gql(
            """
            query GetActivityCount($table_id: uuid!) {
              activity_aggregate(where: {table_id: {_eq: $table_id}}) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityCount.parse_obj(data)

    def get_activity_dependencies(self, id: Any) -> GetActivityDependencies:
        query = gql(
            """
            query GetActivityDependencies($id: uuid!) {
              activity_by_pk(id: $id) {
                id
                slug
                name
                table_id
                datasets {
                  dataset {
                    id
                    slug
                    name
                    tags(
                      limit: 1
                      order_by: {updated_at: desc}
                      where: {company_tag: {tag: {_eq: "recently_viewed"}}}
                    ) {
                      updated_at
                      company_tag {
                        user {
                          email
                        }
                      }
                    }
                    materializations {
                      task_id
                      label
                      id
                      type
                      column_id
                    }
                    dependent_narratives(where: {narrative: {state: {_neq: archived}}}) {
                      narrative {
                        task_id
                        id
                        slug
                        name
                        state
                      }
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityDependencies.parse_obj(data)

    def get_activity_dependency(
        self,
        company_id: Any,
        activity_ids: Union[Optional[List[Any]], UnsetType] = UNSET,
        recent_tag_ids: Union[Optional[List[Any]], UnsetType] = UNSET,
        from_time: Union[Optional[Any], UnsetType] = UNSET,
    ) -> GetActivityDependency:
        query = gql(
            """
            query GetActivityDependency($company_id: uuid!, $activity_ids: [uuid!], $recent_tag_ids: [uuid!], $from_time: timestamptz) {
              all_activities: activity(
                where: {company_id: {_eq: $company_id}, id: {_in: $activity_ids}}
              ) {
                id
                name
                category
                description
                company_table {
                  activity_stream
                }
                datasets {
                  dataset {
                    id
                    slug
                    name
                    hide_from_index
                    tags(
                      limit: 1
                      order_by: {created_at: desc}
                      where: {tag_id: {_in: $recent_tag_ids}}
                    ) {
                      created_at
                    }
                    tags_aggregate(
                      where: {tag_id: {_in: $recent_tag_ids}, created_at: {_gt: $from_time}}
                    ) {
                      aggregate {
                        count
                      }
                    }
                    dependent_narratives {
                      narrative {
                        id
                        slug
                        last_viewed_at
                        name
                        tags(
                          limit: 1
                          order_by: {created_at: desc}
                          where: {tag_id: {_in: $recent_tag_ids}}
                        ) {
                          created_at
                        }
                        tags_aggregate(
                          where: {tag_id: {_in: $recent_tag_ids}, created_at: {_gt: $from_time}}
                        ) {
                          aggregate {
                            count
                          }
                        }
                      }
                    }
                    materializations {
                      task_id
                      id
                      type
                      label
                    }
                  }
                }
                transformations {
                  transformation {
                    id
                    name
                    production_queries(order_by: [{updated_at: desc_nulls_last}], limit: 1) {
                      sql
                      updated_at
                      updated_by
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "activity_ids": activity_ids,
            "recent_tag_ids": recent_tag_ids,
            "from_time": from_time,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityDependency.parse_obj(data)

    def get_activity_features(self, table_id: Any) -> GetActivityFeatures:
        query = gql(
            """
            query GetActivityFeatures($table_id: uuid!) {
              all_activities: activity(where: {table_id: {_eq: $table_id}}) {
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                }
                slug
                name
                description
                transformations {
                  transformation_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityFeatures.parse_obj(data)

    def get_activity_rows(self, id: Any) -> GetActivityRows:
        query = gql(
            """
            query GetActivityRows($id: uuid!) {
              activity_by_pk(id: $id) {
                row_count
                name
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityRows.parse_obj(data)

    def get_activity_simple(self, id: Any) -> GetActivitySimple:
        query = gql(
            """
            query GetActivitySimple($id: uuid!) {
              activity_by_pk(id: $id) {
                id
                name
                slug
                category
                created_at
                updated_by
                updated_at
                table_id
                description
                row_count
                maintainer_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivitySimple.parse_obj(data)

    def get_activity_transformations(self, id: Any) -> GetActivityTransformations:
        query = gql(
            """
            query GetActivityTransformations($id: uuid!) {
              activity_transform: activity_by_pk(id: $id) {
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                  casting
                }
                status
                transformations {
                  transformation {
                    id
                    column_renames {
                      type
                      label
                      name
                      casting
                      has_data
                    }
                  }
                }
                id
                slug
                name
                description
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityTransformations.parse_obj(data)

    def get_activity_w_columns(self, id: Any) -> GetActivityWColumns:
        query = gql(
            """
            query GetActivityWColumns($id: uuid!) {
              activity: activity_by_pk(id: $id) {
                id
                slug
                name
                description
                category
                table_id
                row_count
                company_table {
                  slowly_changing_customer_dims {
                    slowly_changing_ts_column
                    dim_table {
                      id
                      schema_: schema
                      table
                      join_key
                      columns {
                        id
                        name
                        type
                        label
                      }
                    }
                  }
                }
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                }
                activity_dims {
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      type
                      label
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetActivityWColumns.parse_obj(data)

    def get_alert(self, id: Any) -> GetAlert:
        query = gql(
            """
            query GetAlert($id: uuid!) {
              company_query_alert_by_pk(id: $id) {
                id
                alert_kind
                email
                sql_query {
                  sql
                  related_id
                  related_to
                  notes
                }
                company_task {
                  task_slug
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAlert.parse_obj(data)

    def get_all_active_activity_maintenance(self, company_id: Any) -> GetAllActiveActivityMaintenance:
        query = gql(
            """
            query GetAllActiveActivityMaintenance($company_id: uuid!) {
              activity_maintenance(
                where: {activity: {company_id: {_eq: $company_id}}, ended_at: {_is_null: true}}
                order_by: {ended_at: desc_nulls_first}
              ) {
                id
                activity_id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllActiveActivityMaintenance.parse_obj(data)

    def get_all_active_transformation_maintenance(self, company_id: Any) -> GetAllActiveTransformationMaintenance:
        query = gql(
            """
            query GetAllActiveTransformationMaintenance($company_id: uuid!) {
              transformation_maintenance(
                where: {transformation: {company_id: {_eq: $company_id}}, ended_at: {_is_null: true}}
                order_by: {ended_at: desc_nulls_first}
              ) {
                id
                transformation_id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllActiveTransformationMaintenance.parse_obj(data)

    def get_all_activities(
        self,
        graph_filter: activity_bool_exp,
        favorite_tag_id: Any,
        limit: Union[Optional[int], UnsetType] = UNSET,
        offset: Union[Optional[int], UnsetType] = UNSET,
    ) -> GetAllActivities:
        query = gql(
            """
            query GetAllActivities($graph_filter: activity_bool_exp!, $limit: Int, $offset: Int, $favorite_tag_id: uuid!) {
              activity_aggregate(where: $graph_filter) {
                aggregate {
                  totalCount: count
                }
              }
              activities: activity(
                where: $graph_filter
                order_by: {table_id: asc}
                limit: $limit
                offset: $offset
              ) {
                id
                slug
                name
                description
                row_count
                tags(where: {tag_id: {_eq: $favorite_tag_id}}) {
                  id
                }
                category: company_category {
                  id
                  name: category
                  color
                }
                alerts: activity_maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                  notes
                  started_at
                }
                table_id
                created_at
                updated_at
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                }
                activity_dims {
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      type
                      label
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "graph_filter": graph_filter,
            "limit": limit,
            "offset": offset,
            "favorite_tag_id": favorite_tag_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllActivities.parse_obj(data)

    def get_all_activities_full(self, company_id: Any) -> GetAllActivitiesFull:
        query = gql(
            """
            query GetAllActivitiesFull($company_id: uuid!) {
              all_activities: activity(where: {company_id: {_eq: $company_id}}) {
                category
                description
                id
                name
                slug
                status
                validated
                next_index_at
                updated_at
                company_table {
                  activity_stream
                }
                activity_maintenances(where: {ended_at: {_is_null: true}}) {
                  started_at
                  notes
                  kind
                  id
                }
                column_renames {
                  id
                  name
                  has_data
                }
                transformations {
                  transformation {
                    id
                    name
                    slug
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllActivitiesFull.parse_obj(data)

    def get_all_categories(self, company_id: Any) -> GetAllCategories:
        query = gql(
            """
            query GetAllCategories($company_id: uuid!) {
              company_categories(where: {company_id: {_eq: $company_id}}) {
                id
                category
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCategories.parse_obj(data)

    def get_all_chats(
        self,
        graph_filter: chat_bool_exp,
        favorite_tag_id: Any,
        limit: Union[Optional[int], UnsetType] = UNSET,
        offset: Union[Optional[int], UnsetType] = UNSET,
    ) -> GetAllChats:
        query = gql(
            """
            query GetAllChats($graph_filter: chat_bool_exp!, $limit: Int, $offset: Int, $favorite_tag_id: uuid!) {
              chat_aggregate(where: $graph_filter) {
                aggregate {
                  totalCount: count
                }
              }
              chats: chat(
                where: $graph_filter
                order_by: {created_at: desc}
                limit: $limit
                offset: $offset
              ) {
                id
                created_by
                created_at
                rating
                summary
                detailed_summary
                tags(where: {tag_id: {_eq: $favorite_tag_id}}) {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "graph_filter": graph_filter,
            "limit": limit,
            "offset": offset,
            "favorite_tag_id": favorite_tag_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllChats.parse_obj(data)

    def get_all_companies(self) -> GetAllCompanies:
        query = gql(
            """
            query GetAllCompanies {
              company(where: {status: {_eq: active}}) {
                id
                name
                slug
                datacenter_region
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompanies.parse_obj(data)

    def get_all_companies_for_admin_user(self, user_id: Any) -> GetAllCompaniesForAdminUser:
        query = gql(
            """
            query GetAllCompaniesForAdminUser($user_id: uuid!) {
              company_user(where: {user_id: {_eq: $user_id}, role: {_eq: admin}}) {
                id
                user_id
                company_id
                company {
                  name
                }
                phone
                user {
                  email
                }
                first_name
              }
            }
            """
        )
        variables: dict[str, object] = {"user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompaniesForAdminUser.parse_obj(data)

    def get_all_companies_for_user(self, user_id: Any) -> GetAllCompaniesForUser:
        query = gql(
            """
            query GetAllCompaniesForUser($user_id: uuid!) {
              company_user(where: {user_id: {_eq: $user_id}}) {
                id
                user_id
                company_id
                company {
                  name
                }
                phone
                user {
                  email
                }
                first_name
              }
            }
            """
        )
        variables: dict[str, object] = {"user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompaniesForUser.parse_obj(data)

    def get_all_companies_with_user_and_limit(self) -> GetAllCompaniesWithUserAndLimit:
        query = gql(
            """
            query GetAllCompaniesWithUserAndLimit {
              company(
                where: {status: {_neq: archived}, demo_company: {_eq: false}, slug: {_nin: ["narrator"]}}
              ) {
                id
                slug
                created_at
                status
                demo_company
                name
                created_for_user {
                  email
                }
                company_users(where: {user: {role: {_neq: internal_admin}}}) {
                  id
                  role
                }
                service_limits(where: {deleted_at: {_is_null: true}}) {
                  user_limit
                  admin_user_limit
                  start_on
                  end_on
                  monthly_price
                }
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompaniesWithUserAndLimit.parse_obj(data)

    def get_all_company_api_keys(self, company_id: Any) -> GetAllCompanyApiKeys:
        query = gql(
            """
            query GetAllCompanyApiKeys($company_id: uuid!) {
              api_keys: company_user_api_key(
                where: {company_user: {company_id: {_eq: $company_id}}, revoked_at: {_is_null: true}}
                order_by: {created_at: asc}
              ) {
                id
                label
                created_at
                last_used_at
                company_user {
                  user {
                    id
                    email
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompanyApiKeys.parse_obj(data)

    def get_all_company_tasks(
        self,
        datacenter_region: Union[Optional[datacenter_region_enum], UnsetType] = UNSET,
    ) -> GetAllCompanyTasks:
        query = gql(
            """
            query GetAllCompanyTasks($datacenter_region: datacenter_region_enum) {
              company(
                where: {status: {_eq: active}, datacenter_region: {_eq: $datacenter_region}}
              ) {
                id
                slug
                batch_halt
                datacenter_region
                timezone
                tasks {
                  id
                  created_at
                  task_slug
                  schedule
                  function_name
                  function_path
                  kwargs
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"datacenter_region": datacenter_region}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCompanyTasks.parse_obj(data)

    def get_all_custom_functions(self, company_id: Any) -> GetAllCustomFunctions:
        query = gql(
            """
            query GetAllCustomFunctions($company_id: uuid!) {
              custom_function(where: {company_id: {_eq: $company_id}}) {
                id
                input_count
                name
                text_to_replace
                description
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllCustomFunctions.parse_obj(data)

    def get_all_identity_transformations(self, company_id: Any) -> GetAllIdentityTransformations:
        query = gql(
            """
            query GetAllIdentityTransformations($company_id: uuid!) {
              all_transformations: transformation(
                where: {company_id: {_eq: $company_id}, has_source: {_eq: true}}
              ) {
                id
                kind
                name
                next_resync_at
                last_diff_data_and_insert_at
                has_source
                is_aliasing
                remove_customers
                mutable_day_window
                delete_window
                table
                slug
                update_type
                column_renames {
                  id
                  name
                  label
                  has_data
                  type
                  casting
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllIdentityTransformations.parse_obj(data)

    def get_all_internal_templates(self, company_id: Any) -> GetAllInternalTemplates:
        query = gql(
            """
            query GetAllInternalTemplates($company_id: uuid!) {
              narrative_template(
                order_by: {name: asc, global_version: desc, customer_iteration: desc, local_iteration: desc}
                where: {company_id: {_eq: $company_id}}
              ) {
                id
                name
                question
                description
                customer_iteration
                local_iteration
                global_version
                state
                type
                display_companies_using
                company_id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllInternalTemplates.parse_obj(data)

    def get_all_materializations(self, company_id: Any, kind: materialization_type_enum) -> GetAllMaterializations:
        query = gql(
            """
            query GetAllMaterializations($company_id: uuid!, $kind: materialization_type_enum!) {
              materializations: dataset_materialization(
                where: {type: {_eq: $kind}, dataset: {company_id: {_eq: $company_id}}}
              ) {
                id
                group_slug
                label
                type
                task_id
                dataset_id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "kind": kind}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllMaterializations.parse_obj(data)

    def get_all_narrative_integrations(self, id: Any) -> GetAllNarrativeIntegrations:
        query = gql(
            """
            query GetAllNarrativeIntegrations($id: uuid!) {
              narrative: narrative_by_pk(id: $id) {
                id
                slug
                name
                integrations {
                  id
                  task_id
                  kind
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllNarrativeIntegrations.parse_obj(data)

    def get_all_narratives(
        self,
        company_id: Any,
        user_id: Any,
        type: narrative_types_enum,
        limit: int,
        offset: int,
    ) -> GetAllNarratives:
        query = gql(
            """
            query GetAllNarratives($company_id: uuid!, $user_id: uuid!, $type: narrative_types_enum!, $limit: Int!, $offset: Int!) {
              narrative_aggregate(
                where: {company_id: {_eq: $company_id}, state: {_neq: archived}, type: {_eq: $type}}
              ) {
                aggregate {
                  totalCount: count
                }
              }
              narratives: narrative(
                where: {company_id: {_eq: $company_id}, state: {_neq: archived}, type: {_eq: $type}}
                order_by: [{updated_at: desc}]
                limit: $limit
                offset: $offset
              ) {
                id
                slug
                name
                description
                state
                snapshots: narrative_runs(order_by: [{created_at: desc}], limit: 10) {
                  id
                  created_at
                }
                tags(
                  where: {company_tag: {_or: [{user_id: {_eq: $user_id}}, {user_id: {_is_null: true}}]}}
                ) {
                  id
                  tag: company_tag {
                    id
                    name: tag
                  }
                  created_at
                }
                updated_by: updated_by_user {
                  id
                  email
                }
                created_at
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_id": user_id,
            "type": type,
            "limit": limit,
            "offset": offset,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllNarratives.parse_obj(data)

    def get_all_roles(self) -> GetAllRoles:
        query = gql(
            """
            query GetAllRoles {
              access_role {
                value
                description
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllRoles.parse_obj(data)

    def get_all_tags(self, company_id: Any) -> GetAllTags:
        query = gql(
            """
            query GetAllTags($company_id: uuid!) {
              company_tags(where: {company_id: {_eq: $company_id}, user_id: {_is_null: true}}) {
                id
                tag
                color
                description
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllTags.parse_obj(data)

    def get_all_tasks_processing_no_batch_halt(
        self,
        datacenter_region: Union[Optional[datacenter_region_enum], UnsetType] = UNSET,
    ) -> GetAllTasksProcessingNoBatchHalt:
        query = gql(
            """
            query GetAllTasksProcessingNoBatchHalt($datacenter_region: datacenter_region_enum) {
              tasks: company_task(
                where: {company: {batch_halt: {_eq: false}, status: {_eq: active}, datacenter_region: {_eq: $datacenter_region}}, category: {_eq: processing}}
              ) {
                id
                task_slug
                schedule
                executions {
                  status
                  started_at
                  created_at
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"datacenter_region": datacenter_region}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllTasksProcessingNoBatchHalt.parse_obj(data)

    def get_all_template_versions(self, name: Union[Optional[str], UnsetType] = UNSET) -> GetAllTemplateVersions:
        query = gql(
            """
            query GetAllTemplateVersions($name: String) {
              narrative_template(
                where: {name: {_eq: $name}}
                order_by: [{global_version: desc}, {customer_iteration: desc}, {local_iteration: desc}]
                limit: 100
              ) {
                id
                name
                question
                created_by
                description
                state
                global_version
                display_companies_using
                kind
                customer_iteration
                local_iteration
                narrative_template_kind {
                  value
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"name": name}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllTemplateVersions.parse_obj(data)

    def get_all_templates(self) -> GetAllTemplates:
        query = gql(
            """
            query GetAllTemplates {
              narrative_template(
                order_by: {name: asc, global_version: desc, customer_iteration: desc, local_iteration: desc}
                where: {company_id: {_is_null: true}}
              ) {
                id
                name
                question
                description
                customer_iteration
                local_iteration
                global_version
                state
                type
                display_companies_using
                category
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllTemplates.parse_obj(data)

    def get_all_transformations(self, company_id: Any, limit: int, offset: int) -> GetAllTransformations:
        query = gql(
            """
            query GetAllTransformations($company_id: uuid!, $limit: Int!, $offset: Int!) {
              transformation_aggregate(where: {company_id: {_eq: $company_id}}) {
                aggregate {
                  totalCount: count
                }
              }
              transformations: transformation(
                where: {company_id: {_eq: $company_id}}
                order_by: {production_queries_aggregate: {max: {created_at: desc_nulls_last}}}
                limit: $limit
                offset: $offset
              ) {
                id
                slug
                name
                kind
                update_type
                table
                max_days_to_insert
                start_data_after
                requires_identity_resolution: has_source
                is_aliasing
                transformations_activities: activities {
                  activity {
                    id
                    slug
                    name
                  }
                }
                current_query {
                  id
                  sql
                  notes
                  created_at
                  updated_at
                }
                production_queries(order_by: {created_at: desc}, limit: 15) {
                  id
                  sql
                  notes
                  created_at
                  updated_at
                }
                events: transformation_maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                  notes
                  started_at
                }
                created_at
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "limit": limit,
            "offset": offset,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllTransformations.parse_obj(data)

    def get_all_users(self, company_id: Any) -> GetAllUsers:
        query = gql(
            """
            query GetAllUsers($company_id: uuid!) {
              user(
                where: {_or: [{role: {_eq: internal_admin}}, {company_users: {company_id: {_eq: $company_id}}}]}
              ) {
                id
                email
                role
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllUsers.parse_obj(data)

    def get_allowed_prototypes(self, company_id: Union[Optional[Any], UnsetType] = UNSET) -> GetAllowedPrototypes:
        query = gql(
            """
            query GetAllowedPrototypes($company_id: uuid) {
              company_prototypes(where: {company_id: {_eq: $company_id}}) {
                block_slug
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAllowedPrototypes.parse_obj(data)

    def get_archived_companies(self, updated_befor: Any) -> GetArchivedCompanies:
        query = gql(
            """
            query GetArchivedCompanies($updated_befor: timestamptz!) {
              company(
                where: {status: {_eq: archived}, skip_automated_archive: {_eq: false}, updated_at: {_lt: $updated_befor}, resources: {s3_bucket: {_is_null: false}}}
              ) {
                id
                name
                slug
                status
                resources {
                  id
                  company_role
                  kms_key
                  s3_bucket
                  read_policy
                  write_policy
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"updated_befor": updated_befor}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetArchivedCompanies.parse_obj(data)

    def get_auth_org(self, company_id: Any) -> GetAuthOrg:
        query = gql(
            """
            query GetAuthOrg($company_id: uuid!) {
              auth: company_auth0(where: {company_id: {_eq: $company_id}}) {
                org_id
                connection_id
                enforce_sso
                disable_sso
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetAuthOrg.parse_obj(data)

    def get_basic_activities(self, ids: List[Any]) -> GetBasicActivities:
        query = gql(
            """
            query GetBasicActivities($ids: [uuid!]!) {
              activities: activity(where: {id: {_in: $ids}}) {
                id
                slug
                name
                description
                status
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetBasicActivities.parse_obj(data)

    def get_chat(self, id: Any) -> GetChat:
        query = gql(
            """
            query GetChat($id: uuid!) {
              chat_by_pk(id: $id) {
                id
                created_by
                table_id
                question
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetChat.parse_obj(data)

    def get_chat_context(self, user_id: Any, company_id: Any, table_id: Any, favorite_tag_id: Any) -> GetChatContext:
        query = gql(
            """
            query GetChatContext($user_id: uuid!, $company_id: uuid!, $table_id: uuid!, $favorite_tag_id: uuid!) {
              company_tags: company_tags_by_pk(id: $favorite_tag_id) {
                tagged_items(where: {related_to: {_eq: activity}}) {
                  activity {
                    id
                    slug
                    name
                    category
                    description
                  }
                }
              }
              company_user(where: {user_id: {_eq: $user_id}, company_id: {_eq: $company_id}}) {
                user_context
                company_context
                metrics_context
              }
              chat(
                where: {created_by: {_eq: $user_id}, table_id: {_eq: $table_id}}
                order_by: {created_at: desc_nulls_last}
                limit: 5
              ) {
                id
                created_at
                summary
                detailed_summary
              }
            }
            """
        )
        variables: dict[str, object] = {
            "user_id": user_id,
            "company_id": company_id,
            "table_id": table_id,
            "favorite_tag_id": favorite_tag_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetChatContext.parse_obj(data)

    def get_chats(self, ids: List[Any]) -> GetChats:
        query = gql(
            """
            query GetChats($ids: [uuid!]!) {
              chats: chat(where: {id: {_in: $ids}}) {
                id
                table_id
                summary
                detailed_summary
                created_by
                created_at
                tags {
                  tag_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetChats.parse_obj(data)

    def get_company(self, slug: str) -> GetCompany:
        query = gql(
            """
            query GetCompany($slug: String!) {
              companies: company(where: {slug: {_eq: $slug}}) {
                max_inserts
                currency_used
                id
                slug
                status
                name
                website
                production_schema
                materialize_schema
                warehouse_language
                timezone
                cache_minutes
                start_data_on
                validation_months
                batch_halt
                project_id
                logo_url
                select_wlm_count
                created_at
                updated_at
                plot_colors
                spend_table
                dataset_row_threshold
                dataset_default_filter_days
                warehouse_default_schemas
                use_time_boundary
                week_day_offset
                datacenter_region
                tables(order_by: {created_at: asc}) {
                  id
                  identifier
                  updated_at
                  schema_name
                  activity_stream
                  row_count
                  index_table
                  is_imported
                  maintainer_id
                  manually_partition_activity
                  default_time_between
                  customer_dim_table_id
                  customer_dim {
                    id
                    schema_name: schema
                    table
                  }
                  team_permissions {
                    team_id
                    can_edit
                  }
                }
                tags: company_tags(
                  order_by: {created_at: asc}
                  where: {user_id: {_is_null: true}}
                ) {
                  id
                  tag
                  color
                }
                teams(order_by: {created_at: asc}) {
                  id
                  name
                }
                company_users {
                  id
                  user_id
                  first_name
                  last_name
                  preferences {
                    profile_picture
                  }
                  user {
                    email
                  }
                }
                resources {
                  company_role
                  kms_key
                  s3_bucket
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"slug": slug}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompany.parse_obj(data)

    def get_company_dims(self, company_id: Any) -> GetCompanyDims:
        query = gql(
            """
            query GetCompanyDims($company_id: uuid!) {
              dim_tables: dim_table(where: {company_id: {_eq: $company_id}}) {
                id
                schema_: schema
                table
                join_key
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyDims.parse_obj(data)

    def get_company_events(self, company_id: Any) -> GetCompanyEvents:
        query = gql(
            """
            query GetCompanyEvents($company_id: uuid!) {
              company_timeline(
                where: {related_to: {_eq: company}, related_to_id: {_eq: $company_id}}
                order_by: [{description: desc}]
              ) {
                name
                id
                happened_at
                description
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyEvents.parse_obj(data)

    def get_company_slug(self, id: Any) -> GetCompanySlug:
        query = gql(
            """
            query GetCompanySlug($id: uuid!) {
              company_by_pk(id: $id) {
                name
                slug
                batch_halt
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanySlug.parse_obj(data)

    def get_company_table(self, id: Any) -> GetCompanyTable:
        query = gql(
            """
            query GetCompanyTable($id: uuid!) {
              company_table_by_pk(id: $id) {
                team_permissions {
                  team_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTable.parse_obj(data)

    def get_company_table_aggregation(self, table_id: Any) -> GetCompanyTableAggregation:
        query = gql(
            """
            query GetCompanyTableAggregation($table_id: uuid!) {
              company_table_aggregation_dim(where: {company_table_id: {_eq: $table_id}}) {
                dim_table_id
                company_table_id
                created_at
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTableAggregation.parse_obj(data)

    def get_company_table_aggregation_w_columns(self, table_id: Any) -> GetCompanyTableAggregationWColumns:
        query = gql(
            """
            query GetCompanyTableAggregationWColumns($table_id: uuid!) {
              company_table_aggregation_dim(where: {company_table_id: {_eq: $table_id}}) {
                dim_table_id
                company_table_id
                created_at
                dim_table {
                  id
                  schema_: schema
                  table
                  join_key
                  columns {
                    id
                    name
                    label
                    type
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTableAggregationWColumns.parse_obj(data)

    def get_company_tag(self, company_id: Any, tag: str) -> GetCompanyTag:
        query = gql(
            """
            query GetCompanyTag($company_id: uuid!, $tag: String!) {
              company_tags(where: {company_id: {_eq: $company_id}, tag: {_eq: $tag}}) {
                id
                tag
                color
                user_id
                description
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "tag": tag}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTag.parse_obj(data)

    def get_company_tasks(self, company_id: Any) -> GetCompanyTasks:
        query = gql(
            """
            query GetCompanyTasks($company_id: uuid!) {
              company_task(
                where: {company_id: {_eq: $company_id}, internal_only: {_eq: false}}
              ) {
                id
                task_slug
                schedule
                category
                executions(order_by: [{started_at: desc_nulls_last}], limit: 1) {
                  status
                  started_at
                  completed_at
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTasks.parse_obj(data)

    def get_company_tasks_by_path(self, company_id: Any, path: str) -> GetCompanyTasksByPath:
        query = gql(
            """
            query GetCompanyTasksByPath($company_id: uuid!, $path: String!) {
              company_task(
                where: {company_id: {_eq: $company_id}, internal_only: {_eq: false}, function_path: {_eq: $path}}
              ) {
                id
                task_slug
                label
                schedule
                category
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "path": path}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTasksByPath.parse_obj(data)

    def get_company_templates(self, company_id: Union[Optional[Any], UnsetType] = UNSET) -> GetCompanyTemplates:
        query = gql(
            """
            query GetCompanyTemplates($company_id: uuid) {
              company_narrative_templates(
                where: {company_id: {_eq: $company_id}, templates: {local_iteration: {_eq: 0}}}
                order_by: {created_at: desc}
              ) {
                templates(order_by: {global_version: desc, customer_iteration: desc}, limit: 1) {
                  id
                  name
                  question
                  description
                  customer_iteration
                  local_iteration
                  global_version
                  category
                  in_free_tier
                  state
                  type
                  display_companies_using
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyTemplates.parse_obj(data)

    def get_company_user(self, id: Any) -> GetCompanyUser:
        query = gql(
            """
            query GetCompanyUser($id: uuid!) {
              company_user_by_pk(id: $id) {
                id
                created_at
                first_name
                last_name
                job_title
                phone
                role
                user {
                  id
                  email
                }
                team_users {
                  team_id
                }
                user_access_roles {
                  role
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyUser.parse_obj(data)

    def get_company_user_api_key(self, id: Any) -> GetCompanyUserApiKey:
        query = gql(
            """
            query GetCompanyUserApiKey($id: uuid!) {
              api_key: company_user_api_key_by_pk(id: $id) {
                id
                revoked_at
                company_user {
                  user {
                    id
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyUserApiKey.parse_obj(data)

    def get_company_user_id(self, company_id: Any, user_id: Any) -> GetCompanyUserId:
        query = gql(
            """
            query GetCompanyUserId($company_id: uuid!, $user_id: uuid!) {
              company_user(where: {company_id: {_eq: $company_id}, user_id: {_eq: $user_id}}) {
                id
                user_id
                first_name
                last_name
                job_title
                created_at
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyUserId.parse_obj(data)

    def get_company_users(self, company_id: Any) -> GetCompanyUsers:
        query = gql(
            """
            query GetCompanyUsers($company_id: uuid!) {
              company_user(where: {company_id: {_eq: $company_id}}) {
                id
                user_id
                first_name
                last_name
                phone
                user {
                  email
                }
                team_users {
                  team_id
                }
                user_access_roles {
                  role
                }
                created_at
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetCompanyUsers.parse_obj(data)

    def get_dataset(self, id: Any) -> GetDataset:
        query = gql(
            """
            query GetDataset($id: uuid!) {
              dataset_by_pk(id: $id) {
                name
                description
                status
                slug
                locked
                company_category {
                  category
                }
                user {
                  id
                  role
                  email
                }
                materializations {
                  id
                  type
                  company_task {
                    id
                    task_slug
                    schedule
                    description
                  }
                  label
                  column_id
                  group_slug
                  sheet_key
                  days_to_resync
                }
                dependent_narratives(where: {narrative: {state: {_neq: archived}}}) {
                  narrative {
                    id
                    name
                    created_by
                    task_id
                    template_id
                    user {
                      email
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDataset.parse_obj(data)

    def get_dataset_basic(self, id: Any) -> GetDatasetBasic:
        query = gql(
            """
            query GetDatasetBasic($id: uuid!) {
              dataset_by_pk(id: $id) {
                name
                description
                status
                slug
                created_by
                locked
                company_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetBasic.parse_obj(data)

    def get_dataset_count(self, company_id: Any) -> GetDatasetCount:
        query = gql(
            """
            query GetDatasetCount($company_id: uuid!) {
              dataset_aggregate(where: {company_id: {_eq: $company_id}}) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetCount.parse_obj(data)

    def get_dataset_maintenance(
        self,
        activity_ids: List[Any],
        last_updated_at: Any,
        tables: List[str],
        company_id: Any,
    ) -> GetDatasetMaintenance:
        query = gql(
            """
            query GetDatasetMaintenance($activity_ids: [uuid!]!, $last_updated_at: timestamptz!, $tables: [String!]!, $company_id: uuid!) {
              activity_maintenance(
                where: {_and: [{_or: [{activity_id: {_in: $activity_ids}, dim_table_id: {_is_null: true}}, {dim_table: {table: {_in: $tables}, company_id: {_eq: $company_id}}}]}, {_or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}]}
              ) {
                id
                kind
                notes
                started_at
                ended_at
                activity_id
                dim_table {
                  schema_: schema
                  table
                }
                maintenance_kind {
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "activity_ids": activity_ids,
            "last_updated_at": last_updated_at,
            "tables": tables,
            "company_id": company_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetMaintenance.parse_obj(data)

    def get_dataset_materialization(self, id: Any) -> GetDatasetMaterialization:
        query = gql(
            """
            query GetDatasetMaterialization($id: uuid!) {
              materialization: dataset_materialization_by_pk(id: $id) {
                id
                created_at
                dataset_id
                group_slug
                label
                type
                task_id
                company_task {
                  schedule
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetMaterialization.parse_obj(data)

    def get_dataset_materializations(self, dataset_id: Any) -> GetDatasetMaterializations:
        query = gql(
            """
            query GetDatasetMaterializations($dataset_id: uuid!) {
              materializations: dataset_materialization(
                where: {dataset_id: {_eq: $dataset_id}}
              ) {
                id
                label
                sheet_key
                type
                group_slug
                external_link
                company_task {
                  id
                  schedule
                  task_slug
                  updated_at
                  description
                  category
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"dataset_id": dataset_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetMaterializations.parse_obj(data)

    def get_datasets_by_slug(self, company_id: Any, slugs: List[str]) -> GetDatasetsBySlug:
        query = gql(
            """
            query GetDatasetsBySlug($company_id: uuid!, $slugs: [String!]!) {
              dataset(where: {slug: {_in: $slugs}, company_id: {_eq: $company_id}}) {
                id
                name
                slug
                description
                status
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "slugs": slugs}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDatasetsBySlug.parse_obj(data)

    def get_dim(self, id: Any) -> GetDim:
        query = gql(
            """
            query GetDim($id: uuid!) {
              dim_table_by_pk(id: $id) {
                id
                schema_: schema
                table
                join_key
                description
                columns {
                  id
                  name
                  label
                  type
                }
                team_permissions {
                  team_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDim.parse_obj(data)

    def get_dim_maintenance(self, dim_table_id: Any, last_updated_at: Any) -> GetDimMaintenance:
        query = gql(
            """
            query GetDimMaintenance($dim_table_id: uuid!, $last_updated_at: timestamptz!) {
              activity_maintenance(
                where: {dim_table_id: {_eq: $dim_table_id}, _or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}
                order_by: {ended_at: desc_nulls_first}
              ) {
                id
                kind
                notes
                started_at
                ended_at
                activity_id
                maintenance_kind {
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "dim_table_id": dim_table_id,
            "last_updated_at": last_updated_at,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDimMaintenance.parse_obj(data)

    def get_dim_with_dependencies(self, id: Any) -> GetDimWithDependencies:
        query = gql(
            """
            query GetDimWithDependencies($id: uuid!) {
              dim_table_by_pk(id: $id) {
                id
                schema_: schema
                table
                join_key
                columns {
                  id
                  name
                  label
                  type
                }
                activities {
                  id
                  activity_id
                  activity_join_column
                  activity {
                    maintainer_id
                  }
                  slowly_changing_ts_column
                }
                customer_table {
                  maintainer_id
                  id
                  activity_stream
                }
                slowly_changing_customer_dims {
                  id
                  table_id
                  slowly_changing_ts_column
                }
                company_table_aggregations {
                  company_table_id
                  company_table {
                    id
                    activity_stream
                    maintainer_id
                  }
                }
                maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                  started_at
                  activity_id
                  notes
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDimWithDependencies.parse_obj(data)

    def get_dims_with_dependencies(self, company_id: Any) -> GetDimsWithDependencies:
        query = gql(
            """
            query GetDimsWithDependencies($company_id: uuid!) {
              dim_tables: dim_table(where: {company_id: {_eq: $company_id}}) {
                id
                schema_: schema
                table
                join_key
                activities {
                  activity_id
                  slowly_changing_ts_column
                  activity {
                    maintainer_id
                  }
                }
                customer_table {
                  maintainer_id
                  activity_stream
                }
                slowly_changing_customer_dims {
                  table_id
                  slowly_changing_ts_column
                }
                company_table_aggregations {
                  company_table_id
                  company_table {
                    id
                    maintainer_id
                  }
                }
                maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                  started_at
                  activity_id
                  notes
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetDimsWithDependencies.parse_obj(data)

    def get_enrichment_tables(self, company_id: Any) -> GetEnrichmentTables:
        query = gql(
            """
            query GetEnrichmentTables($company_id: uuid!) {
              all_transformations: transformation(
                where: {company_id: {_eq: $company_id}, kind: {_in: [spend, enrichment, customer_attribute]}}
              ) {
                id
                name
                kind
                slug
                update_type
                table
                task_id
                column_renames {
                  name
                  type
                  label
                  casting
                  id
                }
                production_queries(order_by: {created_at: desc_nulls_last}, limit: 1) {
                  sql
                  updated_by
                }
                production_queries_aggregate {
                  aggregate {
                    count
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetEnrichmentTables.parse_obj(data)

    def get_fivex_companies(self) -> GetFivexCompanies:
        query = gql(
            """
            query GetFivexCompanies {
              company(
                where: {created_for_user: {email: {_eq: "platformadmin@5x.co"}}, status: {_neq: archived}}
              ) {
                id
                name
                created_at
                created_for_user {
                  email
                }
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFivexCompanies.parse_obj(data)

    def get_free_templates(self, company_id: Any) -> GetFreeTemplates:
        query = gql(
            """
            query GetFreeTemplates($company_id: uuid!) {
              narrative_template(
                order_by: {global_version: desc, customer_iteration: desc}
                where: {_or: [{company_id: {_eq: $company_id}}, {in_free_tier: {_eq: true}}]}
              ) {
                id
                name
                company_id
                question
                category
                description
                customer_iteration
                local_iteration
                global_version
                state
                in_free_tier
                type
                display_companies_using
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFreeTemplates.parse_obj(data)

    def get_full_activity(self, id: Any) -> GetFullActivity:
        query = gql(
            """
            query GetFullActivity($id: uuid!) {
              activity_by_pk(id: $id) {
                id
                created_at
                updated_at
                slug
                name
                description
                table_id
                company_id
                category
                row_count
                team_permissions {
                  team_id
                  can_edit
                }
                tags {
                  tag_id
                  company_tag {
                    tag
                    user_id
                  }
                }
                alerts: activity_maintenances(where: {ended_at: {_is_null: true}}) {
                  id
                  kind
                  notes
                  started_at
                }
                column_renames {
                  id
                  label
                  type
                  name
                  has_data
                }
                activity_dims {
                  activity_join_column
                  slowly_changing_ts_column
                  dim_table {
                    id
                    schema_: schema
                    table
                    join_key
                    columns {
                      id
                      name
                      type
                      label
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFullActivity.parse_obj(data)

    def get_full_dataset(self, id: Any) -> GetFullDataset:
        query = gql(
            """
            query GetFullDataset($id: uuid!) {
              dataset_by_pk(id: $id) {
                id
                name
                description
                status
                slug
                locked
                created_by
                created_at
                company_id
                updated_at
                dataset_activities {
                  activity {
                    id
                    table_id
                  }
                }
                tags {
                  id
                  updated_at
                  tag_id
                  company_tag {
                    tag
                    user_id
                  }
                }
                materializations {
                  id
                  type
                  label
                }
                dependent_narratives(where: {narrative: {state: {_neq: archived}}}) {
                  narrative {
                    id
                    name
                  }
                }
                team_permissions {
                  team_id
                  can_edit
                }
                has_training
                hide_from_index
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFullDataset.parse_obj(data)

    def get_full_narrative(self, id: Any) -> GetFullNarrative:
        query = gql(
            """
            query GetFullNarrative($id: uuid!) {
              narrative_by_pk(id: $id) {
                id
                name
                created_by
                created_at
                updated_at
                description
                type
                company_id
                template_id
                tags {
                  id
                  updated_at
                  tag_id
                  company_tag {
                    tag
                    user_id
                    color
                  }
                }
                datasets: narrative_datasets {
                  dataset {
                    id
                    name
                  }
                }
                company_task {
                  id
                  label
                  schedule
                }
                team_permissions {
                  id: team_id
                  can_edit
                }
                compiled_versions(limit: 1, order_by: {created_at: desc}) {
                  id
                  created_at
                  s3_key
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFullNarrative.parse_obj(data)

    def get_full_task(self, id: Any) -> GetFullTask:
        query = gql(
            """
            query GetFullTask($id: uuid!) {
              company_task_by_pk(id: $id) {
                id
                task_slug
                label
                schedule
                category
                internal_only
                dataset_materializations {
                  type
                  label
                  column_id
                  external_link
                  dataset {
                    id
                    slug
                    name
                  }
                }
                narratives {
                  id
                  slug
                  name
                  type
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFullTask.parse_obj(data)

    def get_full_transformation(self, id: Any) -> GetFullTransformation:
        query = gql(
            """
            query GetFullTransformation($id: uuid!) {
              transformation: transformation_by_pk(id: $id) {
                id
                slug
                name
                updated_at
                updated_by
                delete_window
                has_source
                do_not_delete_on_resync
                is_aliasing
                kind
                max_days_to_insert
                mutable_day_window
                last_resynced_at
                next_resync_at
                task_id
                single_activity
                notify_row_count_percent_change
                do_not_update_on_percent_change
                remove_customers
                allow_future_data
                start_data_after
                table
                update_type
                validation_queries {
                  id
                }
                current_query {
                  sql
                }
                production_queries(order_by: {created_at: desc_nulls_last}, limit: 1) {
                  id
                  sql
                  updated_at
                  updated_by
                }
                run_after_transformations {
                  run_after_transformation_id
                }
                depends_on_transformations {
                  depends_on_transformation_id
                }
                activities {
                  activity_id
                  activity {
                    id
                    slug
                    name
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetFullTransformation.parse_obj(data)

    def get_internal_template_by_name(
        self, company_id: Any, name: Union[Optional[str], UnsetType] = UNSET
    ) -> GetInternalTemplateByName:
        query = gql(
            """
            query GetInternalTemplateByName($name: String, $company_id: uuid!) {
              narrative_template(
                where: {name: {_eq: $name}}
                order_by: [{global_version: desc}, {customer_iteration: desc}, {local_iteration: desc}]
                limit: 100
              ) {
                id
                name
                created_by
                description
                customer_iteration
                global_version
                state
                question
                narrative_template_kind {
                  value
                }
                display_companies_using
                in_free_tier
                kind
                local_iteration
                narratives(
                  order_by: [{updated_at: desc}]
                  limit: 500
                  where: {state: {_neq: archived}, company_id: {_eq: $company_id}}
                ) {
                  slug
                  name
                  type
                  updated_at
                  id
                  narrative_runs(order_by: {created_at: desc_nulls_last}, limit: 1) {
                    s3_key
                  }
                  company {
                    id
                    name
                    slug
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"name": name, "company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetInternalTemplateByName.parse_obj(data)

    def get_internal_users(self) -> GetInternalUsers:
        query = gql(
            """
            query GetInternalUsers {
              users: user(where: {role: {_eq: internal_admin}}) {
                email
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetInternalUsers.parse_obj(data)

    def get_items_for_tag(self, tag_id: Any) -> GetItemsForTag:
        query = gql(
            """
            query GetItemsForTag($tag_id: uuid!) {
              company_tags_by_pk(id: $tag_id) {
                tagged_items {
                  activity {
                    id
                    name
                    table_id
                  }
                  dataset {
                    id
                    name
                  }
                  narrative {
                    id
                    name
                    type
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"tag_id": tag_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetItemsForTag.parse_obj(data)

    def get_last_executed_tasks(
        self, company_id: Any, from_date: Any, category: company_task_category_enum
    ) -> GetLastExecutedTasks:
        query = gql(
            """
            query GetLastExecutedTasks($company_id: uuid!, $from_date: timestamptz!, $category: company_task_category_enum!) {
              task_execution(
                order_by: [{started_at: asc}]
                where: {task: {company_id: {_eq: $company_id}, internal_only: {_eq: false}, category: {_eq: $category}}, started_at: {_gt: $from_date}}
              ) {
                id
                started_at
                completed_at
                status
                details
                task {
                  schedule
                  task_slug
                  category
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "from_date": from_date,
            "category": category,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetLastExecutedTasks.parse_obj(data)

    def get_last_executions(self, task_id: Any) -> GetLastExecutions:
        query = gql(
            """
            query GetLastExecutions($task_id: uuid!) {
              task_execution(
                where: {task_id: {_eq: $task_id}}
                limit: 5
                order_by: {started_at: desc_nulls_last}
              ) {
                id
                status
                started_at
                completed_at
                details
              }
            }
            """
        )
        variables: dict[str, object] = {"task_id": task_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetLastExecutions.parse_obj(data)

    def get_materialization_count(self, company_id: Any) -> GetMaterializationCount:
        query = gql(
            """
            query GetMaterializationCount($company_id: uuid!) {
              dataset_materialization_aggregate(
                where: {dataset: {company_id: {_eq: $company_id}}}
              ) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetMaterializationCount.parse_obj(data)

    def get_narrative(self, id: Any) -> GetNarrative:
        query = gql(
            """
            query GetNarrative($id: uuid!) {
              narrative_by_pk(id: $id) {
                id
                name
                created_by
                created_at
                updated_at
                description
                type
                company_id
                state
                tags {
                  id
                  updated_at
                  tag_id
                  company_tag {
                    tag
                    user_id
                  }
                }
                team_permissions {
                  team_id
                  can_edit
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrative.parse_obj(data)

    def get_narrative_basic(self, id: Any) -> GetNarrativeBasic:
        query = gql(
            """
            query GetNarrativeBasic($id: uuid!) {
              narrative_by_pk(id: $id) {
                id
                slug
                name
                description
                type
                created_at
                updated_at
                created_by
                company_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeBasic.parse_obj(data)

    def get_narrative_by_slug(
        self, company_id: Any, slug: Union[Optional[str], UnsetType] = UNSET
    ) -> GetNarrativeBySlug:
        query = gql(
            """
            query GetNarrativeBySlug($company_id: uuid!, $slug: String) {
              narrative(where: {slug: {_eq: $slug}, company_id: {_eq: $company_id}}) {
                id
                created_at
                name
                type
                slug
                description
                state
                created_by
                narrative_runs(order_by: {created_at: desc_nulls_last}, limit: 10) {
                  is_actionable
                  created_at
                  s3_key
                }
                narrative_datasets {
                  dataset {
                    id
                    slug
                    name
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "slug": slug}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeBySlug.parse_obj(data)

    def get_narrative_count(self, company_id: Any) -> GetNarrativeCount:
        query = gql(
            """
            query GetNarrativeCount($company_id: uuid!) {
              narrative_aggregate(where: {company_id: {_eq: $company_id}, state: {_eq: live}}) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeCount.parse_obj(data)

    def get_narrative_integration(self, id: Any) -> GetNarrativeIntegration:
        query = gql(
            """
            query GetNarrativeIntegration($id: uuid!) {
              narrative_integration: narrative_integrations_by_pk(id: $id) {
                id
                kind
                narrative_id
                task_id
                narrative {
                  slug
                  name
                  narrative_runs(order_by: {created_at: desc_nulls_last}, limit: 1) {
                    s3_key
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeIntegration.parse_obj(data)

    def get_narrative_snapshots(self, id: Any, limit: Union[Optional[int], UnsetType] = UNSET) -> GetNarrativeSnapshots:
        query = gql(
            """
            query GetNarrativeSnapshots($id: uuid!, $limit: Int = 200) {
              narrative_by_pk(id: $id) {
                id
                narrative_runs(order_by: {created_at: desc}, limit: $limit) {
                  id
                  created_at
                  s3_key
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "limit": limit}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeSnapshots.parse_obj(data)

    def get_narrative_task(self, id: Any) -> GetNarrativeTask:
        query = gql(
            """
            query GetNarrativeTask($id: uuid!) {
              narrative_by_pk(id: $id) {
                id
                name
                slug
                company_task {
                  id
                  label
                  schedule
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarrativeTask.parse_obj(data)

    def get_narratives(self, ids: List[Any]) -> GetNarratives:
        query = gql(
            """
            query GetNarratives($ids: [uuid!]!) {
              narratives: narrative(where: {id: {_in: $ids}}) {
                id
                slug
                name
                description
                type
                created_at
                updated_at
                created_by
                runs: narrative_runs(limit: 1, order_by: {created_at: desc}) {
                  id
                  created_at
                  s3_key
                }
                tags {
                  id
                  updated_at
                  tag_id
                  company_tag {
                    tag
                    user_id
                  }
                }
                teams: team_permissions {
                  id: team_id
                  can_edit
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetNarratives.parse_obj(data)

    def get_opt_out_emails(self, company_id: Union[Optional[Any], UnsetType] = UNSET) -> GetOptOutEmails:
        query = gql(
            """
            query GetOptOutEmails($company_id: uuid) {
              user(
                where: {company_users: {company_id: {_eq: $company_id}, preferences: {email_opt_out: {_eq: true}}}}
              ) {
                email
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetOptOutEmails.parse_obj(data)

    def get_popular_tags(self, company_id: Any) -> GetPopularTags:
        query = gql(
            """
            query GetPopularTags($company_id: uuid!) {
              company_tags(
                where: {company_id: {_eq: $company_id}, tag: {_in: ["popular", "recently_viewed"]}}
              ) {
                id
                tag
                color
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetPopularTags.parse_obj(data)

    def get_query_template_sources(self) -> GetQueryTemplateSources:
        query = gql(
            """
            query GetQueryTemplateSources {
              query_templates: query_template(distinct_on: data_source) {
                data_source
                schema_names
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetQueryTemplateSources.parse_obj(data)

    def get_query_templates(self) -> GetQueryTemplates:
        query = gql(
            """
            query GetQueryTemplates {
              query_templates: query_template {
                id
                data_source
                transformation_name
                transformation_kind
                transformation_update_type
                query
                schema_names
              }
            }
            """
        )
        variables: dict[str, object] = {}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetQueryTemplates.parse_obj(data)

    def get_query_templates_for_source(self, data_source: str) -> GetQueryTemplatesForSource:
        query = gql(
            """
            query GetQueryTemplatesForSource($data_source: String!) {
              query_template(where: {data_source: {_eq: $data_source}}) {
                id
                warehouse_language
                data_source
                transformation_name
                transformation_kind
                transformation_update_type
                updated_at
                schema_names
                query
              }
            }
            """
        )
        variables: dict[str, object] = {"data_source": data_source}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetQueryTemplatesForSource.parse_obj(data)

    def get_recent_transformation_tests(
        self, transformation_id: Any, start_at: Union[Optional[Any], UnsetType] = UNSET
    ) -> GetRecentTransformationTests:
        query = gql(
            """
            query GetRecentTransformationTests($transformation_id: uuid!, $start_at: timestamptz) {
              tests: transformation_test(
                order_by: [{created_at: desc}]
                where: {transformation_id: {_eq: $transformation_id}, created_at: {_gt: $start_at}}
              ) {
                name
                id
                data
                created_at
                ran_data_from
                query
                content
                status
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "start_at": start_at,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetRecentTransformationTests.parse_obj(data)

    def get_reports(self, ids: List[Any]) -> GetReports:
        query = gql(
            """
            query GetReports($ids: [uuid!]!) {
              reports: narrative(where: {id: {_in: $ids}}) {
                id
                type
                updated_at
                compiled_versions(limit: 1, order_by: {created_at: desc}) {
                  id
                  created_at
                  s3_key
                }
                task_id
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetReports.parse_obj(data)

    def get_running_executions(self, task_id: Union[Optional[Any], UnsetType] = UNSET) -> GetRunningExecutions:
        query = gql(
            """
            query GetRunningExecutions($task_id: uuid) {
              task_executions: task_execution(
                where: {task_id: {_eq: $task_id}, status: {_eq: running}}
                order_by: {started_at: desc}
                limit: 1
              ) {
                id
                status
                task_id
              }
            }
            """
        )
        variables: dict[str, object] = {"task_id": task_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetRunningExecutions.parse_obj(data)

    def get_service_limit(self, company_id: Any) -> GetServiceLimit:
        query = gql(
            """
            query GetServiceLimit($company_id: uuid!) {
              service_limit(
                where: {company_id: {_eq: $company_id}, deleted_at: {_is_null: true}}
              ) {
                id
                transformation_limit
                row_limit
                narrative_limit
                materialization_limit
                dataset_limit
                activity_stream_limit
                activity_limit
                name
                monthly_price
                disable_on
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetServiceLimit.parse_obj(data)

    def get_single_activity_table_count(self, activity_id: Any) -> GetSingleActivityTableCount:
        query = gql(
            """
            query GetSingleActivityTableCount($activity_id: uuid!) {
              transformation_activities_aggregate(where: {activity_id: {_eq: $activity_id}}) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"activity_id": activity_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetSingleActivityTableCount.parse_obj(data)

    def get_single_task(self, id: Any) -> GetSingleTask:
        query = gql(
            """
            query GetSingleTask($id: uuid!) {
              company_task_by_pk(id: $id) {
                id
                task_slug
                schedule
                category
                function_name
                function_path
                kwargs
                company {
                  id
                  slug
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetSingleTask.parse_obj(data)

    def get_slowly_changing_customer_dim(self, table_id: Any) -> GetSlowlyChangingCustomerDim:
        query = gql(
            """
            query GetSlowlyChangingCustomerDim($table_id: uuid!) {
              slowly_changing_customer_dims(where: {table_id: {_eq: $table_id}}) {
                dim_table_id
                id
                slowly_changing_ts_column
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetSlowlyChangingCustomerDim.parse_obj(data)

    def get_table(self, company_id: Any, table: str) -> GetTable:
        query = gql(
            """
            query GetTable($company_id: uuid!, $table: String!) {
              transformation(where: {company_id: {_eq: $company_id}, table: {_eq: $table}}) {
                id
                kind
                name
                table
                last_resynced_at
                update_type
                column_renames {
                  label
                  name
                  type
                  casting
                  created_at
                }
                production_queries_aggregate {
                  aggregate {
                    count
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "table": table}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTable.parse_obj(data)

    def get_tagged_items(self, company_id: Any) -> GetTaggedItems:
        query = gql(
            """
            query GetTaggedItems($company_id: uuid!) {
              tag(where: {company_tag: {company_id: {_eq: $company_id}}}) {
                related_id
                related_to
                tag_id
                updated_at
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTaggedItems.parse_obj(data)

    def get_task_by_slug(self, company_id: Any, slug: str) -> GetTaskBySlug:
        query = gql(
            """
            query GetTaskBySlug($company_id: uuid!, $slug: String!) {
              company_task(where: {company_id: {_eq: $company_id}, task_slug: {_eq: $slug}}) {
                id
                created_at
                task_slug
                schedule
                category
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "slug": slug}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTaskBySlug.parse_obj(data)

    def get_task_execution(self, task_execution_id: Any) -> GetTaskExecution:
        query = gql(
            """
            query GetTaskExecution($task_execution_id: uuid!) {
              task_execution_by_pk(id: $task_execution_id) {
                id
                is_running
                status
                orchestration_id
                task_id
                details
                task {
                  id
                  function_name
                  function_path
                  kwargs
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"task_execution_id": task_execution_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTaskExecution.parse_obj(data)

    def get_task_watchers(self, task_id: Any) -> GetTaskWatchers:
        query = gql(
            """
            query GetTaskWatchers($task_id: uuid!) {
              watcher(where: {related_to: {_eq: company_task}, related_id: {_eq: $task_id}}) {
                user {
                  email
                  company_users {
                    first_name
                    last_name
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"task_id": task_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTaskWatchers.parse_obj(data)

    def get_tasks(self, ids: Union[Optional[List[Any]], UnsetType] = UNSET) -> GetTasks:
        query = gql(
            """
            query GetTasks($ids: [uuid!]) {
              company_task(where: {id: {_in: $ids}}) {
                id
                task_slug
                label
                schedule
                category
                internal_only
                dataset_materializations {
                  type
                  label
                  column_id
                  external_link
                  dataset {
                    id
                    slug
                    name
                  }
                }
                narratives {
                  id
                  slug
                  name
                  type
                }
                company_query_alerts {
                  sql_query {
                    related_transformation {
                      id
                      name
                    }
                  }
                }
                executions(order_by: [{started_at: desc_nulls_last}], limit: 5) {
                  id
                  orchestration_id
                  status
                  started_at
                  completed_at
                  details
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTasks.parse_obj(data)

    def get_team(self, id: Any) -> GetTeam:
        query = gql(
            """
            query GetTeam($id: uuid!) {
              team_by_pk(id: $id) {
                name
                id
                created_at
                users {
                  company_user {
                    id
                    user_id
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTeam.parse_obj(data)

    def get_team_permissions(self, related_to: str, related_id: Any) -> GetTeamPermissions:
        query = gql(
            """
            query GetTeamPermissions($related_to: String!, $related_id: uuid!) {
              team_permission(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $related_id}}
              ) {
                id
                team_id
                can_edit
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "related_id": related_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTeamPermissions.parse_obj(data)

    def get_template(self, id: Any) -> GetTemplate:
        query = gql(
            """
            query GetTemplate($id: uuid!) {
              narrative_template_by_pk(id: $id) {
                id
                name
                question
                type
                description
                template
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTemplate.parse_obj(data)

    def get_template_by_name(self, name: Union[Optional[str], UnsetType] = UNSET) -> GetTemplateByName:
        query = gql(
            """
            query GetTemplateByName($name: String) {
              narrative_template(
                where: {name: {_eq: $name}}
                order_by: [{global_version: desc}, {customer_iteration: desc}, {local_iteration: desc}]
                limit: 100
              ) {
                id
                name
                created_by
                description
                category
                customer_iteration
                global_version
                state
                question
                narrative_template_kind {
                  value
                }
                display_companies_using
                in_free_tier
                kind
                local_iteration
                narratives(
                  order_by: [{updated_at: desc}]
                  limit: 500
                  where: {state: {_neq: archived}}
                ) {
                  slug
                  name
                  type
                  updated_at
                  id
                  narrative_runs(order_by: {created_at: desc_nulls_last}, limit: 1) {
                    s3_key
                  }
                  company {
                    id
                    name
                    slug
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"name": name}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTemplateByName.parse_obj(data)

    def get_timeline(self, timeline_ids: List[Any]) -> GetTimeline:
        query = gql(
            """
            query GetTimeline($timeline_ids: [uuid!]!) {
              company_timeline(where: {related_to_id: {_in: $timeline_ids}}) {
                happened_at
                id
                name
                description
                related_to
                related_to_id
              }
            }
            """
        )
        variables: dict[str, object] = {"timeline_ids": timeline_ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTimeline.parse_obj(data)

    def get_training_request(self, id: Any) -> GetTrainingRequest:
        query = gql(
            """
            query GetTrainingRequest($id: uuid!) {
              training_request_by_pk(id: $id) {
                chat_id
                created_by
                context
                company_id
                dataset_id
                group_slug
                plot_slug
                email_requester
                email_sent_at
                status_updated_at
                email_context
                status
                type
                training_id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTrainingRequest.parse_obj(data)

    def get_transformation_context(self, id: Any) -> GetTransformationContext:
        query = gql(
            """
            query GetTransformationContext($id: uuid!) {
              transformation: transformation_by_pk(id: $id) {
                id
                created_at
                kind
                slug
                table
                update_type
                updated_at
                current_query {
                  id
                  sql
                  updated_by
                  updated_at
                  notes
                }
                column_renames {
                  id
                  name
                  label
                  has_data
                  type
                  casting
                }
                has_source
                is_aliasing
                start_data_after
                remove_customers
                notify_row_count_percent_change
                do_not_update_on_percent_change
                allow_future_data
                name
                mutable_day_window
                max_days_to_insert
                delete_window
                do_not_delete_on_resync
                depends_on_transformations {
                  depends_on_transformation_id
                }
                run_after_transformations {
                  run_after_transformation_id
                }
                next_resync_at
                activities {
                  activity {
                    id
                    slug
                  }
                }
                production_queries(order_by: {created_at: desc}, limit: 15) {
                  id
                  sql
                  created_at
                  updated_by
                  notes
                }
                task_id
                validation_queries(order_by: {updated_at: asc}) {
                  id
                  updated_by
                  updated_at
                  sql
                  notes
                  alert {
                    task_id
                    email
                    alert_kind
                    company_task {
                      task_slug
                      schedule
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationContext.parse_obj(data)

    def get_transformation_count(self, company_id: Any) -> GetTransformationCount:
        query = gql(
            """
            query GetTransformationCount($company_id: uuid!) {
              transformation_aggregate(where: {company_id: {_eq: $company_id}}) {
                aggregate {
                  count
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationCount.parse_obj(data)

    def get_transformation_for_processing(self, id: Any) -> GetTransformationForProcessing:
        query = gql(
            """
            query GetTransformationForProcessing($id: uuid!) {
              transformation: transformation_by_pk(id: $id) {
                id
                name
                delete_window
                has_source
                do_not_delete_on_resync
                is_aliasing
                kind
                max_days_to_insert
                mutable_day_window
                last_resynced_at
                next_resync_at
                single_activity
                notify_row_count_percent_change
                do_not_update_on_percent_change
                slug
                allow_future_data
                start_data_after
                table
                update_type
                production_queries(order_by: {created_at: desc_nulls_last}, limit: 1) {
                  id
                  sql
                  updated_at
                  updated_by
                }
                column_renames {
                  id
                  created_at
                  name
                  label
                  type
                  casting
                }
                depends_on_transformations {
                  depends_on_transformation_id
                }
                activities {
                  activity_id
                  activity {
                    id
                    slug
                    row_count
                  }
                }
                query_updates(
                  where: {rows_inserted: {_gt: 0}}
                  order_by: {processed_at: desc_nulls_last}
                  limit: 10
                ) {
                  created_at
                  rows_inserted
                  from_sync_time
                  to_sync_time
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationForProcessing.parse_obj(data)

    def get_transformation_for_production(self, id: Any) -> GetTransformationForProduction:
        query = gql(
            """
            query GetTransformationForProduction($id: uuid!) {
              transformation: transformation_by_pk(id: $id) {
                id
                name
                slug
                table
                update_type
                production_queries(order_by: {created_at: desc_nulls_last}, limit: 1) {
                  created_at
                  sql
                  updated_by
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationForProduction.parse_obj(data)

    def get_transformation_query_updates(self, company_id: Any, from_date: Any) -> GetTransformationQueryUpdates:
        query = gql(
            """
            query GetTransformationQueryUpdates($company_id: uuid!, $from_date: timestamptz!) {
              query_updates(
                where: {transformation: {company_id: {_eq: $company_id}}, processed_at: {_gt: $from_date}}
                order_by: [{processed_at: asc}]
              ) {
                processed_at
                rows_inserted
                update_duration
                from_sync_time
                to_sync_time
                transformation_id
                transformation {
                  name
                  table
                  update_type
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "from_date": from_date,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationQueryUpdates.parse_obj(data)

    def get_transformation_simple(self, id: Any) -> GetTransformationSimple:
        query = gql(
            """
            query GetTransformationSimple($id: uuid!) {
              transformation: transformation_by_pk(id: $id) {
                id
                kind
                update_type
                slug
                name
                updated_at
                start_data_after
                table
                current_query {
                  sql
                  updated_at
                }
                company {
                  slug
                }
                column_renames {
                  id
                  created_at
                  name
                  type
                  casting
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationSimple.parse_obj(data)

    def get_transformation_tests(self, transformation_id: Any, ids: List[Any]) -> GetTransformationTests:
        query = gql(
            """
            query GetTransformationTests($transformation_id: uuid!, $ids: [uuid!]!) {
              tests: transformation_test(
                order_by: [{created_at: desc}]
                where: {transformation_id: {_eq: $transformation_id}, id: {_in: $ids}}
              ) {
                name
                id
                data
                created_at
                ran_data_from
                query
                content
                status
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "ids": ids,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationTests.parse_obj(data)

    def get_transformation_updates(
        self, id: Any, started_at: Union[Optional[Any], UnsetType] = UNSET
    ) -> GetTransformationUpdates:
        query = gql(
            """
            query GetTransformationUpdates($id: uuid!, $started_at: timestamptz) {
              transformation: transformation_by_pk(id: $id) {
                last_diff_data_and_insert_at
                last_resynced_at
                next_resync_at
                start_data_after
                has_source
                query_updates(
                  order_by: [{processed_at: asc}]
                  where: {processed_at: {_gt: $started_at}}
                ) {
                  transformation_id
                  to_sync_time
                  rows_inserted
                  update_duration
                  processed_at
                  update_kind
                  from_sync_time
                }
                transformation_maintenances(where: {started_at: {_gt: $started_at}}) {
                  notes
                  started_at
                  ended_at
                  kind
                }
                activities {
                  activity {
                    name
                    activity_maintenances(where: {started_at: {_gt: $started_at}}) {
                      notes
                      started_at
                      ended_at
                      kind
                    }
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "started_at": started_at}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationUpdates.parse_obj(data)

    def get_transformations(self, ids: List[Any]) -> GetTransformations:
        query = gql(
            """
            query GetTransformations($ids: [uuid!]!) {
              transformation(where: {id: {_in: $ids}}) {
                id
                slug
                name
                created_at
                updated_at
                table
                kind
                next_resync_at
                update_type
                delete_window
                has_source
                is_aliasing
                remove_customers
                do_not_delete_on_resync
                notify_row_count_percent_change
                validation_queries {
                  id
                }
                run_after_transformations {
                  id
                }
                depends_on_transformations {
                  id
                }
                current_query {
                  sql
                }
                production_queries(limit: 1, order_by: {updated_at: desc}) {
                  id
                  updated_at
                  updated_by
                }
                company_task {
                  id
                  executions(limit: 1, order_by: {created_at: desc}) {
                    started_at
                    status
                  }
                }
                transformation_maintenances {
                  id
                  kind
                  started_at
                  notes
                }
                activities {
                  activity {
                    id
                    name
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"ids": ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformations.parse_obj(data)

    def get_transformations_for_activity(self, activity_id: Any) -> GetTransformationsForActivity:
        query = gql(
            """
            query GetTransformationsForActivity($activity_id: uuid!) {
              transformation_activities(where: {activity_id: {_eq: $activity_id}}) {
                activity_id
                transformation {
                  id
                  slug
                  name
                  kind
                  task_id
                  update_type
                  production_queries(order_by: {created_at: desc_nulls_last}, limit: 1) {
                    sql
                    updated_by
                  }
                  column_renames {
                    type
                    label
                    name
                    casting
                    has_data
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"activity_id": activity_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetTransformationsForActivity.parse_obj(data)

    def get_user(self, id: Any) -> GetUser:
        query = gql(
            """
            query GetUser($id: uuid!) {
              user_by_pk(id: $id) {
                id
                role
                email
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetUser.parse_obj(data)

    def get_user_by_email(self, email: str) -> GetUserByEmail:
        query = gql(
            """
            query GetUserByEmail($email: String!) {
              user(where: {email: {_eq: $email}}) {
                id
                role
              }
            }
            """
        )
        variables: dict[str, object] = {"email": email}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetUserByEmail.parse_obj(data)

    def get_user_companies(self, user_id: Any) -> GetUserCompanies:
        query = gql(
            """
            query GetUserCompanies($user_id: uuid!) {
              company_user(where: {user_id: {_eq: $user_id}}) {
                id
                company {
                  id
                  slug
                  name
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetUserCompanies.parse_obj(data)

    def get_user_special_tags(self, company_id: Any, user_id: Any) -> GetUserSpecialTags:
        query = gql(
            """
            query GetUserSpecialTags($company_id: uuid!, $user_id: uuid!) {
              company_tags(
                where: {company_id: {_eq: $company_id}, user_id: {_eq: $user_id}, tag: {_in: ["popular", "recently_viewed", "favorite"]}}
              ) {
                id
                user_id
                tag
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetUserSpecialTags.parse_obj(data)

    def get_version(self, version_id: Any) -> GetVersion:
        query = gql(
            """
            query GetVersion($version_id: uuid!) {
              versions_by_pk(id: $version_id) {
                id
                created_at
                s3_key
                user_id
              }
            }
            """
        )
        variables: dict[str, object] = {"version_id": version_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetVersion.parse_obj(data)

    def get_versions(
        self,
        id: Any,
        limit: Union[Optional[int], UnsetType] = UNSET,
        offset: Union[Optional[int], UnsetType] = UNSET,
        related_to: Union[Optional[tag_relations_enum], UnsetType] = UNSET,
    ) -> GetVersions:
        query = gql(
            """
            query GetVersions($limit: Int = 1, $offset: Int = 0, $related_to: tag_relations_enum = activity, $id: uuid!) {
              versions(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $id}}
                offset: $offset
                limit: $limit
                order_by: {created_at: desc}
              ) {
                id
                created_at
                s3_key
                user_id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "limit": limit,
            "offset": offset,
            "related_to": related_to,
            "id": id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetVersions.parse_obj(data)

    def get_view_tag(self, company_id: Any) -> GetViewTag:
        query = gql(
            """
            query GetViewTag($company_id: uuid!) {
              company_tags(
                where: {company_id: {_eq: $company_id}, tag: {_eq: "recently_viewed"}}
              ) {
                id
                tag
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return GetViewTag.parse_obj(data)

    def insert_activity_dim(
        self,
        activity_id: Any,
        dim_table_id: Any,
        activity_join_column: Union[Optional[str], UnsetType] = UNSET,
        slowly_changing_ts_column: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertActivityDim:
        query = gql(
            """
            mutation InsertActivityDim($activity_id: uuid!, $dim_table_id: uuid!, $activity_join_column: String, $slowly_changing_ts_column: String) {
              insert_activity_dim_one(
                object: {activity_id: $activity_id, dim_table_id: $dim_table_id, activity_join_column: $activity_join_column, slowly_changing_ts_column: $slowly_changing_ts_column}
                on_conflict: {constraint: activity_dim_activity_id_dim_table_id_key, update_columns: [activity_join_column, slowly_changing_ts_column]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "activity_id": activity_id,
            "dim_table_id": dim_table_id,
            "activity_join_column": activity_join_column,
            "slowly_changing_ts_column": slowly_changing_ts_column,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertActivityDim.parse_obj(data)

    def insert_activity_maintenance(
        self,
        activity_id: Union[Optional[Any], UnsetType] = UNSET,
        dim_table_id: Union[Optional[Any], UnsetType] = UNSET,
        kind: Union[Optional[maintenance_kinds_enum], UnsetType] = UNSET,
        notes: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertActivityMaintenance:
        query = gql(
            """
            mutation InsertActivityMaintenance($activity_id: uuid, $dim_table_id: uuid, $kind: maintenance_kinds_enum, $notes: String = "") {
              insert_activity_maintenance_one(
                object: {kind: $kind, notes: $notes, started_at: "now()", activity_id: $activity_id, dim_table_id: $dim_table_id}
              ) {
                activity_id
                id
                kind
                notes
                started_at
                ended_at
                activity {
                  name
                  table_id
                }
                maintenance_kind {
                  description
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "activity_id": activity_id,
            "dim_table_id": dim_table_id,
            "kind": kind,
            "notes": notes,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertActivityMaintenance.parse_obj(data)

    def insert_aggregation_dim(self, dim_table_id: Any, company_table_id: Any) -> InsertAggregationDim:
        query = gql(
            """
            mutation InsertAggregationDim($dim_table_id: uuid!, $company_table_id: uuid!) {
              inserted_aggregation_dim: insert_company_table_aggregation_dim_one(
                object: {dim_table_id: $dim_table_id, company_table_id: $company_table_id}
                on_conflict: {constraint: company_table_aggregation_dim_company_table_id_dim_table_id_key, update_columns: []}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "dim_table_id": dim_table_id,
            "company_table_id": company_table_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertAggregationDim.parse_obj(data)

    def insert_category(self, company_id: Any, category: str, color: str) -> InsertCategory:
        query = gql(
            """
            mutation InsertCategory($company_id: uuid!, $category: String!, $color: String!) {
              inserted_category: insert_company_categories_one(
                object: {category: $category, company_id: $company_id, color: $color}
                on_conflict: {constraint: company_categories_category_company_id_key, update_columns: [category, color]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "category": category,
            "color": color,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCategory.parse_obj(data)

    def insert_chat(self, question: str, table_id: Any, created_by: Any) -> InsertChat:
        query = gql(
            """
            mutation InsertChat($question: String!, $table_id: uuid!, $created_by: uuid!) {
              insert_chat_one(
                object: {question: $question, summary: $question, table_id: $table_id, created_by: $created_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "question": question,
            "table_id": table_id,
            "created_by": created_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertChat.parse_obj(data)

    def insert_company(
        self,
        name: str,
        created_for: Any,
        slug: str,
        is_demo: Union[Optional[bool], UnsetType] = UNSET,
        region: Union[Optional[datacenter_region_enum], UnsetType] = UNSET,
    ) -> InsertCompany:
        query = gql(
            """
            mutation InsertCompany($name: String!, $created_for: uuid!, $slug: String!, $is_demo: Boolean, $region: datacenter_region_enum) {
              insert_company_one(
                object: {name: $name, created_for: $created_for, slug: $slug, demo_company: $is_demo, allow_narrator_employee_access: true, datacenter_region: $region}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "name": name,
            "created_for": created_for,
            "slug": slug,
            "is_demo": is_demo,
            "region": region,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCompany.parse_obj(data)

    def insert_company_org(self, company_id: Any, org_id: str) -> InsertCompanyOrg:
        query = gql(
            """
            mutation InsertCompanyOrg($company_id: uuid!, $org_id: String!) {
              insert_company_auth0_one(object: {company_id: $company_id, org_id: $org_id}) {
                id
                org_id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "org_id": org_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCompanyOrg.parse_obj(data)

    def insert_company_resources(
        self,
        company_id: Any,
        s3_bucket: str,
        kms_key: str,
        company_role: str,
        read_policy: str,
        write_policy: str,
    ) -> InsertCompanyResources:
        query = gql(
            """
            mutation InsertCompanyResources($company_id: uuid!, $s3_bucket: String!, $kms_key: String!, $company_role: String!, $read_policy: String!, $write_policy: String!) {
              insert_company_resources_one(
                object: {company_id: $company_id, s3_bucket: $s3_bucket, kms_key: $kms_key, company_role: $company_role, read_policy: $read_policy, write_policy: $write_policy}
                on_conflict: {constraint: company_resources_company_id_key, update_columns: []}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "s3_bucket": s3_bucket,
            "kms_key": kms_key,
            "company_role": company_role,
            "read_policy": read_policy,
            "write_policy": write_policy,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCompanyResources.parse_obj(data)

    def insert_company_table(
        self,
        company_id: Any,
        activity_stream: str,
        identifier: Union[Optional[str], UnsetType] = UNSET,
        default_time_between: Union[Optional[str], UnsetType] = UNSET,
        is_imported: Union[Optional[bool], UnsetType] = UNSET,
        manually_partition_activity: Union[Optional[bool], UnsetType] = UNSET,
        maintainer_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> InsertCompanyTable:
        query = gql(
            """
            mutation InsertCompanyTable($company_id: uuid!, $activity_stream: String!, $identifier: String, $default_time_between: String, $is_imported: Boolean, $manually_partition_activity: Boolean, $maintainer_id: uuid) {
              insert_company_table_one(
                object: {activity_stream: $activity_stream, identifier: $identifier, company_id: $company_id, is_imported: $is_imported, default_time_between: $default_time_between, manually_partition_activity: $manually_partition_activity, maintainer_id: $maintainer_id}
                on_conflict: {constraint: company_table_activity_stream_company_id_key, update_columns: [identifier]}
              ) {
                id
                identifier
                activity_stream
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "activity_stream": activity_stream,
            "identifier": identifier,
            "default_time_between": default_time_between,
            "is_imported": is_imported,
            "manually_partition_activity": manually_partition_activity,
            "maintainer_id": maintainer_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCompanyTable.parse_obj(data)

    def insert_company_timeline(
        self,
        related_id: Any,
        related_to: company_timeline_relations_enum,
        happened_at: Any,
        name: str,
        description: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertCompanyTimeline:
        query = gql(
            """
            mutation InsertCompanyTimeline($related_id: uuid!, $related_to: company_timeline_relations_enum!, $happened_at: date!, $name: String!, $description: String) {
              insert_company_timeline: insert_company_timeline_one(
                object: {happened_at: $happened_at, description: $description, name: $name, related_to: $related_to, related_to_id: $related_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_id": related_id,
            "related_to": related_to,
            "happened_at": happened_at,
            "name": name,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCompanyTimeline.parse_obj(data)

    def insert_custom_function(
        self,
        company_id: Union[Optional[Any], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        input_count: Union[Optional[int], UnsetType] = UNSET,
        text_to_replace: Union[Optional[str], UnsetType] = UNSET,
        name: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertCustomFunction:
        query = gql(
            """
            mutation InsertCustomFunction($company_id: uuid, $description: String, $input_count: Int, $text_to_replace: String, $name: String) {
              insert_custom_function_one(
                object: {company_id: $company_id, description: $description, name: $name, text_to_replace: $text_to_replace, input_count: $input_count}
                on_conflict: {constraint: custom_functions_company_id_name_key, update_columns: [text_to_replace, input_count, description]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "description": description,
            "input_count": input_count,
            "text_to_replace": text_to_replace,
            "name": name,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertCustomFunction.parse_obj(data)

    def insert_dataset(
        self,
        company_id: Union[Optional[Any], UnsetType] = UNSET,
        slug: Union[Optional[str], UnsetType] = UNSET,
        name: Union[Optional[str], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        created_by: Union[Optional[Any], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
        hide_from_index: Union[Optional[bool], UnsetType] = UNSET,
        locked: Union[Optional[bool], UnsetType] = UNSET,
    ) -> InsertDataset:
        query = gql(
            """
            mutation InsertDataset($company_id: uuid, $slug: String, $name: String, $description: String, $created_by: uuid, $updated_by: uuid, $hide_from_index: Boolean, $locked: Boolean) {
              insert_dataset_one(
                object: {company_id: $company_id, created_by: $created_by, description: $description, updated_by: $updated_by, name: $name, slug: $slug, hide_from_index: $hide_from_index, locked: $locked}
              ) {
                id
                slug
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "name": name,
            "description": description,
            "created_by": created_by,
            "updated_by": updated_by,
            "hide_from_index": hide_from_index,
            "locked": locked,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertDataset.parse_obj(data)

    def insert_dataset_materialization(
        self,
        dataset_id: Any,
        type: materialization_type_enum,
        label: str,
        group_slug: Union[Optional[str], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
        external_link: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertDatasetMaterialization:
        query = gql(
            """
            mutation InsertDatasetMaterialization($dataset_id: uuid!, $type: materialization_type_enum!, $group_slug: String, $label: String!, $updated_by: uuid, $external_link: String) {
              inserted_dataset_materialization: insert_dataset_materialization_one(
                object: {updated_by: $updated_by, dataset_id: $dataset_id, group_slug: $group_slug, type: $type, label: $label, external_link: $external_link}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "dataset_id": dataset_id,
            "type": type,
            "group_slug": group_slug,
            "label": label,
            "updated_by": updated_by,
            "external_link": external_link,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertDatasetMaterialization.parse_obj(data)

    def insert_default_service_limit(
        self, company_id: Any, disable_on: Union[Optional[Any], UnsetType] = UNSET
    ) -> InsertDefaultServiceLimit:
        query = gql(
            """
            mutation InsertDefaultServiceLimit($company_id: uuid!, $disable_on: timestamptz) {
              insert_service_limit_one(
                object: {disable_on: $disable_on, monthly_price: 0, name: "Startup", company_id: $company_id}
              ) {
                id
                transformation_limit
                row_limit
                narrative_limit
                materialization_limit
                dataset_limit
                activity_stream_limit
                activity_limit
                name
                monthly_price
                disable_on
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "disable_on": disable_on,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertDefaultServiceLimit.parse_obj(data)

    def insert_dim_table(
        self,
        company_id: Any,
        schema: str,
        table: str,
        join_key: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertDimTable:
        query = gql(
            """
            mutation InsertDimTable($company_id: uuid!, $schema: String!, $table: String!, $join_key: String) {
              insert_dim_table_one(
                object: {company_id: $company_id, schema: $schema, table: $table, join_key: $join_key}
                on_conflict: {constraint: dim_table_table_schema_company_id_key, update_columns: [join_key]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "schema": schema,
            "table": table,
            "join_key": join_key,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertDimTable.parse_obj(data)

    def insert_narrative(
        self,
        company_id: Any,
        state: status_enum,
        slug: str,
        name: str,
        created_by: Any,
        updated_by: Any,
        task_id: Union[Optional[Any], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        template_id: Union[Optional[Any], UnsetType] = UNSET,
        category_id: Union[Optional[Any], UnsetType] = UNSET,
        requested_by: Union[Optional[Any], UnsetType] = UNSET,
        type: Union[Optional[narrative_types_enum], UnsetType] = UNSET,
        metric_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> InsertNarrative:
        query = gql(
            """
            mutation InsertNarrative($company_id: uuid!, $state: status_enum!, $task_id: uuid, $slug: String!, $name: String!, $description: String, $template_id: uuid, $category_id: uuid, $created_by: uuid!, $updated_by: uuid!, $requested_by: uuid, $type: narrative_types_enum, $metric_id: uuid) {
              insert_narrative_one(
                object: {company_id: $company_id, category_id: $category_id, created_by: $created_by, updated_by: $updated_by, requested_by: $requested_by, description: $description, template_id: $template_id, name: $name, slug: $slug, state: $state, task_id: $task_id, type: $type, metric_id: $metric_id}
                on_conflict: {constraint: narrative_company_id_slug_key, update_columns: [created_by, description, name, category_id, state, task_id, updated_by, requested_by, type]}
              ) {
                id
                narrative_datasets {
                  dataset_id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "state": state,
            "task_id": task_id,
            "slug": slug,
            "name": name,
            "description": description,
            "template_id": template_id,
            "category_id": category_id,
            "created_by": created_by,
            "updated_by": updated_by,
            "requested_by": requested_by,
            "type": type,
            "metric_id": metric_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertNarrative.parse_obj(data)

    def insert_narrative_integration(
        self,
        narrative_id: Union[Optional[Any], UnsetType] = UNSET,
        kind: Union[Optional[narrative_integration_kind_enum], UnsetType] = UNSET,
    ) -> InsertNarrativeIntegration:
        query = gql(
            """
            mutation InsertNarrativeIntegration($narrative_id: uuid, $kind: narrative_integration_kind_enum) {
              insert_narrative_integrations_one(
                object: {narrative_id: $narrative_id, kind: $kind}
              ) {
                kind
                narrative_id
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"narrative_id": narrative_id, "kind": kind}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertNarrativeIntegration.parse_obj(data)

    def insert_narrative_run(
        self,
        company_id: Any,
        narrative_slug: str,
        s3_key: str,
        is_actionable: Union[Optional[bool], UnsetType] = UNSET,
    ) -> InsertNarrativeRun:
        query = gql(
            """
            mutation InsertNarrativeRun($company_id: uuid!, $narrative_slug: String!, $s3_key: String!, $is_actionable: Boolean = false) {
              insert_narrative_runs_one(
                object: {company_id: $company_id, is_actionable: $is_actionable, narrative_slug: $narrative_slug, s3_key: $s3_key}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "narrative_slug": narrative_slug,
            "s3_key": s3_key,
            "is_actionable": is_actionable,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertNarrativeRun.parse_obj(data)

    def insert_narrative_template(
        self,
        name: str,
        template: str,
        global_version: Union[Optional[int], UnsetType] = UNSET,
        local_iteration: Union[Optional[int], UnsetType] = UNSET,
        customer_iteration: Union[Optional[int], UnsetType] = UNSET,
        kind: Union[Optional[narrative_template_kinds_enum], UnsetType] = UNSET,
        created_by: Union[Optional[Any], UnsetType] = UNSET,
        question: Union[Optional[str], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        category: Union[Optional[str], UnsetType] = UNSET,
        state: Union[Optional[narrative_template_states_enum], UnsetType] = UNSET,
        display_company_using: Union[Optional[int], UnsetType] = UNSET,
        in_free_tier: Union[Optional[bool], UnsetType] = UNSET,
        company_id: Union[Optional[Any], UnsetType] = UNSET,
        type: Union[Optional[narrative_types_enum], UnsetType] = UNSET,
    ) -> InsertNarrativeTemplate:
        query = gql(
            """
            mutation InsertNarrativeTemplate($name: String!, $template: String!, $global_version: Int, $local_iteration: Int, $customer_iteration: Int, $kind: narrative_template_kinds_enum, $created_by: uuid, $question: String, $description: String, $category: String, $state: narrative_template_states_enum, $display_company_using: Int, $in_free_tier: Boolean, $company_id: uuid, $type: narrative_types_enum) {
              insert_narrative_template_one(
                object: {name: $name, template: $template, global_version: $global_version, local_iteration: $local_iteration, customer_iteration: $customer_iteration, kind: $kind, question: $question, created_by: $created_by, description: $description, state: $state, display_companies_using: $display_company_using, in_free_tier: $in_free_tier, company_id: $company_id, category: $category, type: $type}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "name": name,
            "template": template,
            "global_version": global_version,
            "local_iteration": local_iteration,
            "customer_iteration": customer_iteration,
            "kind": kind,
            "created_by": created_by,
            "question": question,
            "description": description,
            "category": category,
            "state": state,
            "display_company_using": display_company_using,
            "in_free_tier": in_free_tier,
            "company_id": company_id,
            "type": type,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertNarrativeTemplate.parse_obj(data)

    def insert_query_alert(
        self,
        alert_kind: Union[Optional[company_query_alert_kinds_enum], UnsetType] = UNSET,
        email: Union[Optional[str], UnsetType] = UNSET,
        query_id: Union[Optional[Any], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
    ) -> InsertQueryAlert:
        query = gql(
            """
            mutation InsertQueryAlert($alert_kind: company_query_alert_kinds_enum = returns_no_rows, $email: String, $query_id: uuid, $updated_by: uuid) {
              insert_company_query_alert_one(
                object: {alert_kind: $alert_kind, email: $email, query_id: $query_id, updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "alert_kind": alert_kind,
            "email": email,
            "query_id": query_id,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertQueryAlert.parse_obj(data)

    def insert_query_template(
        self,
        sql_query: str,
        transformation_name: str,
        transformation_kind: transformation_kinds_enum,
        transformation_update_type: transformation_update_types_enum,
        data_source: str,
        warehouse_language: str,
        updated_by: Any,
        schema_names: str,
    ) -> InsertQueryTemplate:
        query = gql(
            """
            mutation InsertQueryTemplate($sql_query: String!, $transformation_name: String!, $transformation_kind: transformation_kinds_enum!, $transformation_update_type: transformation_update_types_enum!, $data_source: String!, $warehouse_language: String!, $updated_by: uuid!, $schema_names: String!) {
              inserted_template: insert_query_template_one(
                object: {warehouse_language: $warehouse_language, data_source: $data_source, query: $sql_query, transformation_name: $transformation_name, transformation_kind: $transformation_kind, transformation_update_type: $transformation_update_type, updated_by: $updated_by, schema_names: $schema_names, el_source: "fivetran"}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "sql_query": sql_query,
            "transformation_name": transformation_name,
            "transformation_kind": transformation_kind,
            "transformation_update_type": transformation_update_type,
            "data_source": data_source,
            "warehouse_language": warehouse_language,
            "updated_by": updated_by,
            "schema_names": schema_names,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertQueryTemplate.parse_obj(data)

    def insert_query_update(
        self,
        transformation_id: Any,
        from_sync_time: Any,
        to_sync_time: Union[Optional[Any], UnsetType] = UNSET,
        rows_inserted: Union[Optional[int], UnsetType] = UNSET,
        update_duration: Union[Optional[int], UnsetType] = UNSET,
        update_kind: Union[Optional[transformation_update_types_enum], UnsetType] = UNSET,
    ) -> InsertQueryUpdate:
        query = gql(
            """
            mutation InsertQueryUpdate($transformation_id: uuid!, $from_sync_time: timestamptz!, $to_sync_time: timestamptz, $rows_inserted: Int, $update_duration: Int, $update_kind: transformation_update_types_enum) {
              insert_query_updates(
                objects: {rows_inserted: $rows_inserted, from_sync_time: $from_sync_time, to_sync_time: $to_sync_time, transformation_id: $transformation_id, update_duration: $update_duration, update_kind: $update_kind}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "from_sync_time": from_sync_time,
            "to_sync_time": to_sync_time,
            "rows_inserted": rows_inserted,
            "update_duration": update_duration,
            "update_kind": update_kind,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertQueryUpdate.parse_obj(data)

    def insert_service_limit(
        self,
        company_id: Any,
        user_limit: Union[Optional[int], UnsetType] = UNSET,
        monthly_price: Union[Optional[Any], UnsetType] = UNSET,
        name: Union[Optional[str], UnsetType] = UNSET,
        start_on: Union[Optional[Any], UnsetType] = UNSET,
    ) -> InsertServiceLimit:
        query = gql(
            """
            mutation InsertServiceLimit($company_id: uuid!, $user_limit: Int, $monthly_price: float8, $name: String, $start_on: date) {
              update_service_limit(
                where: {company_id: {_eq: $company_id}, end_on: {_is_null: true}}
                _set: {end_on: "now()"}
              ) {
                returning {
                  company_id
                }
              }
              insert_service_limit_one(
                object: {user_limit: $user_limit, monthly_price: $monthly_price, name: $name, company_id: $company_id, start_on: $start_on}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_limit": user_limit,
            "monthly_price": monthly_price,
            "name": name,
            "start_on": start_on,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertServiceLimit.parse_obj(data)

    def insert_slowly_changing_dim(
        self,
        table_id: Any,
        dim_table_id: Any,
        slowly_changing_ts_column: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertSlowlyChangingDim:
        query = gql(
            """
            mutation InsertSlowlyChangingDim($table_id: uuid!, $dim_table_id: uuid!, $slowly_changing_ts_column: String) {
              insert_slowly_changing_customer_dims_one(
                object: {table_id: $table_id, dim_table_id: $dim_table_id, slowly_changing_ts_column: $slowly_changing_ts_column}
                on_conflict: {constraint: slowly_changing_customer_dims_table_id_dim_table_id_key, update_columns: [slowly_changing_ts_column]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "table_id": table_id,
            "dim_table_id": dim_table_id,
            "slowly_changing_ts_column": slowly_changing_ts_column,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertSlowlyChangingDim.parse_obj(data)

    def insert_sql_query(
        self,
        related_to: sql_query_relations_enum,
        related_id: Any,
        related_kind: sql_query_kinds_enum,
        sql: str,
        notes: Union[Optional[str], UnsetType] = UNSET,
        updated_by: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertSqlQuery:
        query = gql(
            """
            mutation InsertSqlQuery($related_to: sql_query_relations_enum!, $related_id: uuid!, $related_kind: sql_query_kinds_enum!, $sql: String!, $notes: String, $updated_by: String) {
              inserted_query: insert_sql_queries_one(
                object: {related_to: $related_to, related_id: $related_id, related_kind: $related_kind, sql: $sql, notes: $notes, updated_by: $updated_by}
              ) {
                id
                updated_by
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "related_id": related_id,
            "related_kind": related_kind,
            "sql": sql,
            "notes": notes,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertSqlQuery.parse_obj(data)

    def insert_tag(
        self,
        color: str,
        company_id: Any,
        tag: str,
        user_id: Union[Optional[Any], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertTag:
        query = gql(
            """
            mutation InsertTag($color: String!, $company_id: uuid!, $tag: String!, $user_id: uuid, $description: String) {
              inserted_tag: insert_company_tags_one(
                object: {color: $color, company_id: $company_id, tag: $tag, user_id: $user_id, description: $description}
                on_conflict: {constraint: company_tags_tag_company_id_user_id_key, update_columns: [description]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "color": color,
            "company_id": company_id,
            "tag": tag,
            "user_id": user_id,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTag.parse_obj(data)

    def insert_tag_item_one(self, related_id: Any, related_to: tag_relations_enum, tag_id: Any) -> InsertTagItemOne:
        query = gql(
            """
            mutation InsertTagItemOne($related_id: uuid!, $related_to: tag_relations_enum!, $tag_id: uuid!) {
              insert_tag_one(
                object: {related_id: $related_id, related_to: $related_to, tag_id: $tag_id}
                on_conflict: {constraint: tag_tag_id_related_to_related_id_key, update_columns: [updated_at]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_id": related_id,
            "related_to": related_to,
            "tag_id": tag_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTagItemOne.parse_obj(data)

    def insert_task(
        self,
        company_id: Any,
        slug: str,
        schedule: str,
        category: Union[Optional[company_task_category_enum], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        function_name: Union[Optional[str], UnsetType] = UNSET,
        function_path: Union[Optional[str], UnsetType] = UNSET,
        kwargs: Union[Optional[str], UnsetType] = UNSET,
        internal_only: Union[Optional[bool], UnsetType] = UNSET,
        label: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertTask:
        query = gql(
            """
            mutation InsertTask($company_id: uuid!, $slug: String!, $schedule: String!, $category: company_task_category_enum, $description: String, $function_name: String, $function_path: String, $kwargs: String, $internal_only: Boolean = false, $label: String) {
              inserted_task: insert_company_task_one(
                object: {company_id: $company_id, schedule: $schedule, task_slug: $slug, label: $label, category: $category, description: $description, internal_only: $internal_only, function_name: $function_name, function_path: $function_path, kwargs: $kwargs}
                on_conflict: {constraint: company_task_company_id_task_slug_key, update_columns: [schedule, description, label]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "schedule": schedule,
            "category": category,
            "description": description,
            "function_name": function_name,
            "function_path": function_path,
            "kwargs": kwargs,
            "internal_only": internal_only,
            "label": label,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTask.parse_obj(data)

    def insert_task_execution(self, task_id: Any, task_orchestration_id: str) -> InsertTaskExecution:
        query = gql(
            """
            mutation InsertTaskExecution($task_id: uuid!, $task_orchestration_id: String!) {
              inserted_task_execution: insert_task_execution_one(
                object: {task_id: $task_id, status: running, started_at: "now()", orchestration_id: $task_orchestration_id}
                on_conflict: {constraint: task_execution_is_running_task_id_key, update_columns: []}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "task_id": task_id,
            "task_orchestration_id": task_orchestration_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTaskExecution.parse_obj(data)

    def insert_team(self, company_id: Any, name: str) -> InsertTeam:
        query = gql(
            """
            mutation InsertTeam($company_id: uuid!, $name: String!) {
              insert_team_one(
                object: {name: $name, company_id: $company_id}
                on_conflict: {constraint: team_company_id_name_key, update_columns: [name]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "name": name}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTeam.parse_obj(data)

    def insert_test(
        self,
        name: str,
        transformation_id: Any,
        validate_data_from: Union[Optional[Any], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
    ) -> InsertTest:
        query = gql(
            """
            mutation InsertTest($name: String!, $transformation_id: uuid!, $validate_data_from: timestamptz, $updated_by: uuid) {
              insert_transformation_test(
                objects: {name: $name, transformation_id: $transformation_id, ran_data_from: $validate_data_from, updated_by: $updated_by}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "name": name,
            "transformation_id": transformation_id,
            "validate_data_from": validate_data_from,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTest.parse_obj(data)

    def insert_training_request(
        self, chat_id: Any, context: str, type: str, created_by: Any, company_id: Any
    ) -> InsertTrainingRequest:
        query = gql(
            """
            mutation InsertTrainingRequest($chat_id: uuid!, $context: String!, $type: String!, $created_by: uuid!, $company_id: uuid!) {
              insert_training_request_one(
                object: {chat_id: $chat_id, context: $context, type: $type, created_by: $created_by, status_updated_at: "now()", company_id: $company_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "chat_id": chat_id,
            "context": context,
            "type": type,
            "created_by": created_by,
            "company_id": company_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTrainingRequest.parse_obj(data)

    def insert_transformation_activity(self, activity_id: Any, transformation_id: Any) -> InsertTransformationActivity:
        query = gql(
            """
            mutation InsertTransformationActivity($activity_id: uuid!, $transformation_id: uuid!) {
              insert_transformation_activities(
                objects: {activity_id: $activity_id, transformation_id: $transformation_id}
                on_conflict: {constraint: transformation_activities_transformation_id_activity_id_key, update_columns: []}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "activity_id": activity_id,
            "transformation_id": transformation_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTransformationActivity.parse_obj(data)

    def insert_transformation_maintenance(
        self,
        transformation_id: Any,
        kind: maintenance_kinds_enum,
        notes: Union[Optional[str], UnsetType] = UNSET,
    ) -> InsertTransformationMaintenance:
        query = gql(
            """
            mutation InsertTransformationMaintenance($transformation_id: uuid!, $kind: maintenance_kinds_enum!, $notes: String = "") {
              insert_transformation_maintenance_one(
                object: {kind: $kind, notes: $notes, started_at: "now()", transformation_id: $transformation_id}
              ) {
                transformation_id
                id
                kind
                notes
                started_at
                ended_at
                transformation {
                  table
                  name
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "kind": kind,
            "notes": notes,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertTransformationMaintenance.parse_obj(data)

    def insert_user_role(self, company_user_id: Any, role: access_role_enum) -> InsertUserRole:
        query = gql(
            """
            mutation InsertUserRole($company_user_id: uuid!, $role: access_role_enum!) {
              insert_user_access_role_one(
                object: {company_user_id: $company_user_id, role: $role}
                on_conflict: {update_columns: [], constraint: user_access_role_company_user_id_role_key}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_user_id": company_user_id,
            "role": role,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertUserRole.parse_obj(data)

    def insert_user_team(self, company_user_id: Any, team_id: Any) -> InsertUserTeam:
        query = gql(
            """
            mutation InsertUserTeam($company_user_id: uuid!, $team_id: uuid!) {
              insert_team_user_one(
                object: {company_user_id: $company_user_id, team_id: $team_id}
                on_conflict: {constraint: team_user_company_user_id_team_id_key, update_columns: []}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_user_id": company_user_id,
            "team_id": team_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertUserTeam.parse_obj(data)

    def insert_version(
        self,
        id: Any,
        user_id: Any,
        s3_key: str,
        related_to: Union[Optional[tag_relations_enum], UnsetType] = UNSET,
    ) -> InsertVersion:
        query = gql(
            """
            mutation InsertVersion($related_to: tag_relations_enum = activity, $id: uuid!, $user_id: uuid!, $s3_key: String!) {
              insert_versions_one(
                object: {related_to: $related_to, related_id: $id, user_id: $user_id, s3_key: $s3_key}
              ) {
                id
                created_at
                user_id
                s3_key
              }
            }
            """
        )
        variables: dict[str, object] = {
            "related_to": related_to,
            "id": id,
            "user_id": user_id,
            "s3_key": s3_key,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return InsertVersion.parse_obj(data)

    def missing_activity_permission(
        self, table_id: Any, team_ids: Union[Optional[List[Any]], UnsetType] = UNSET
    ) -> MissingActivityPermission:
        query = gql(
            """
            query MissingActivityPermission($table_id: uuid!, $team_ids: [uuid!]) {
              activity(
                where: {table_id: {_eq: $table_id}, team_permissions: {team_id: {_nin: $team_ids}}}
              ) {
                id
                name
              }
            }
            """
        )
        variables: dict[str, object] = {"table_id": table_id, "team_ids": team_ids}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return MissingActivityPermission.parse_obj(data)

    def narrative_index(self, company_id: Any) -> NarrativeIndex:
        query = gql(
            """
            query NarrativeIndex($company_id: uuid!) {
              narrative(
                where: {company_id: {_eq: $company_id}, state: {_neq: archived}}
                order_by: [{updated_at: desc}]
              ) {
                created_by
                description
                name
                id
                slug
                state
                type
                updated_at
                narrative_runs(order_by: [{created_at: desc}], limit: 10) {
                  s3_key
                }
                tags {
                  tag_id
                  updated_at
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return NarrativeIndex.parse_obj(data)

    def ordered_dataset_index(
        self, company_id: Any, user_id: Union[Optional[Any], UnsetType] = UNSET
    ) -> OrderedDatasetIndex:
        query = gql(
            """
            query OrderedDatasetIndex($company_id: uuid!, $user_id: uuid) {
              dataset(where: {company_id: {_eq: $company_id}, status: {_neq: archived}}) {
                created_by
                description
                name
                slug
                status
                category
                updated_at
                metric_id
                id
                tags(
                  where: {company_tag: {tag: {_eq: "recently_viewed"}, user_id: {_eq: $user_id}}}
                ) {
                  tag_id
                  updated_at
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "user_id": user_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return OrderedDatasetIndex.parse_obj(data)

    def ordered_narrative_index(self, company_id: Any) -> OrderedNarrativeIndex:
        query = gql(
            """
            query OrderedNarrativeIndex($company_id: uuid!) {
              narrative(where: {company_id: {_eq: $company_id}, state: {_neq: archived}}) {
                id
                created_by
                updated_at
                name
                slug
                description
                state
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return OrderedNarrativeIndex.parse_obj(data)

    def record_task_cancelled(
        self, task_execution_id: Any, details: Union[Optional[Any], UnsetType] = UNSET
    ) -> RecordTaskCancelled:
        query = gql(
            """
            mutation RecordTaskCancelled($task_execution_id: uuid!, $details: jsonb) {
              update_task_execution_by_pk(
                pk_columns: {id: $task_execution_id}
                _set: {status: cancelled, completed_at: "now()"}
                _append: {details: $details}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "task_execution_id": task_execution_id,
            "details": details,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RecordTaskCancelled.parse_obj(data)

    def record_task_complete(
        self, task_execution_id: Any, details: Union[Optional[Any], UnsetType] = UNSET
    ) -> RecordTaskComplete:
        query = gql(
            """
            mutation RecordTaskComplete($task_execution_id: uuid!, $details: jsonb) {
              update_task_execution_by_pk(
                pk_columns: {id: $task_execution_id}
                _set: {status: complete, completed_at: "now()"}
                _append: {details: $details}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "task_execution_id": task_execution_id,
            "details": details,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RecordTaskComplete.parse_obj(data)

    def record_task_failed(
        self, task_execution_id: Any, details: Union[Optional[Any], UnsetType] = UNSET
    ) -> RecordTaskFailed:
        query = gql(
            """
            mutation RecordTaskFailed($task_execution_id: uuid!, $details: jsonb) {
              update_task_execution_by_pk(
                pk_columns: {id: $task_execution_id}
                _set: {status: failed, completed_at: "now()"}
                _append: {details: $details}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "task_execution_id": task_execution_id,
            "details": details,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RecordTaskFailed.parse_obj(data)

    def record_task_query(self, message_id: str, details: Union[Optional[Any], UnsetType] = UNSET) -> RecordTaskQuery:
        query = gql(
            """
            mutation RecordTaskQuery($message_id: String!, $details: jsonb) {
              update_task_execution(
                _append: {details: $details}
                where: {orchestration_id: {_eq: $message_id}}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"message_id": message_id, "details": details}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RecordTaskQuery.parse_obj(data)

    def record_tasks_stuck(self, before: Any) -> RecordTasksStuck:
        query = gql(
            """
            mutation RecordTasksStuck($before: timestamptz!) {
              update: update_task_execution(
                where: {status: {_nin: [complete, failed, cancelled]}, created_at: {_lt: $before}}
                _set: {status: cancelled, completed_at: "now()"}
                _append: {details: {stuck: true}}
              ) {
                affected_rows
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"before": before}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RecordTasksStuck.parse_obj(data)

    def rename_company_table(self, company_id: Any, activity_stream: str, new_name: str) -> RenameCompanyTable:
        query = gql(
            """
            mutation RenameCompanyTable($company_id: uuid!, $activity_stream: String!, $new_name: String!) {
              update_company_table(
                where: {activity_stream: {_eq: $activity_stream}, company_id: {_eq: $company_id}}
                _set: {activity_stream: $new_name}
              ) {
                returning {
                  id
                }
              }
              update_company_by_pk(pk_columns: {id: $company_id}, _set: {updated_at: "now()"}) {
                slug
              }
              update_transformation(
                where: {table: {_eq: $activity_stream}, company_id: {_eq: $company_id}}
                _set: {table: $new_name}
              ) {
                returning {
                  name
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "activity_stream": activity_stream,
            "new_name": new_name,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RenameCompanyTable.parse_obj(data)

    def revoke_company_user_api_key(self, id: Any) -> RevokeCompanyUserApiKey:
        query = gql(
            """
            mutation RevokeCompanyUserApiKey($id: uuid!) {
              update_company_user_api_key_by_pk(
                pk_columns: {id: $id}
                _set: {revoked_at: "now()"}
              ) {
                id
                revoked_at
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return RevokeCompanyUserApiKey.parse_obj(data)

    def task_index(self, company_id: Any) -> TaskIndex:
        query = gql(
            """
            query TaskIndex($company_id: uuid!) {
              company_task(
                where: {company_id: {_eq: $company_id}, internal_only: {_eq: false}}
              ) {
                category
                created_at
                id
                task_slug
                schedule
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TaskIndex.parse_obj(data)

    def training_request_index(self, company_id: Union[Optional[Any], UnsetType] = UNSET) -> TrainingRequestIndex:
        query = gql(
            """
            query TrainingRequestIndex($company_id: uuid) {
              training_request(where: {company_id: {_eq: $company_id}}) {
                context
                created_by
                created_at
                updated_at
                type
                status
                training_id
                email_requester
                email_sent_at
                status_updated_at
                chat {
                  question
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TrainingRequestIndex.parse_obj(data)

    def transfer_api_keys(self, company_id: Any, user_id: Any, new_company_user_id: Any) -> TransferApiKeys:
        query = gql(
            """
            mutation TransferApiKeys($company_id: uuid!, $user_id: uuid!, $new_company_user_id: uuid!) {
              update_company_user_api_key(
                where: {company_user: {company_id: {_eq: $company_id}, user_id: {_eq: $user_id}}}
                _set: {company_user_id: $new_company_user_id}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_id": user_id,
            "new_company_user_id": new_company_user_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TransferApiKeys.parse_obj(data)

    def transfer_user_items(self, company_id: Any, user_id: Any, new_user_id: Any) -> TransferUserItems:
        query = gql(
            """
            mutation TransferUserItems($company_id: uuid!, $user_id: uuid!, $new_user_id: uuid!) {
              update_dataset(
                where: {company_id: {_eq: $company_id}, created_by: {_eq: $user_id}}
                _set: {created_by: $new_user_id}
              ) {
                returning {
                  id
                }
              }
              update_narrative(
                where: {company_id: {_eq: $company_id}, created_by: {_eq: $user_id}}
                _set: {created_by: $new_user_id}
              ) {
                returning {
                  id
                }
              }
              update_chat(
                where: {company_table: {company_id: {_eq: $company_id}}, created_by: {_eq: $user_id}}
                _set: {created_by: $new_user_id}
              ) {
                returning {
                  id
                }
              }
              update_transformation(
                where: {company_id: {_eq: $company_id}, updated_by: {_eq: $user_id}}
                _set: {updated_by: $new_user_id}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_id": user_id,
            "new_user_id": new_user_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TransferUserItems.parse_obj(data)

    def transformation_index(self, company_id: Any) -> TransformationIndex:
        query = gql(
            """
            query TransformationIndex($company_id: uuid!) {
              all_transformations: transformation(
                where: {company_id: {_eq: $company_id}}
                order_by: {updated_at: desc}
              ) {
                id
                slug
                name
                kind
                created_at
                update_type
                table
                task_id
                activities {
                  activity_id
                }
                production_queries_aggregate {
                  aggregate {
                    count
                  }
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TransformationIndex.parse_obj(data)

    def transformation_index_w_dependency(self, company_id: Any) -> TransformationIndexWDependency:
        query = gql(
            """
            query TransformationIndexWDependency($company_id: uuid!) {
              all_transformations: transformation(
                where: {company_id: {_eq: $company_id}}
                order_by: [{next_resync_at: asc_nulls_last}]
              ) {
                id
                kind
                updated_at
                name
                next_resync_at
                last_diff_data_and_insert_at
                has_source
                is_aliasing
                remove_customers
                mutable_day_window
                delete_window
                table
                task_id
                slug
                update_type
                column_renames {
                  name
                }
                depends_on_transformations {
                  depends_on_transformation_id
                }
                activities {
                  activity {
                    id
                    slug
                    row_count
                    name
                    activity_maintenances(where: {ended_at: {_is_null: true}}) {
                      started_at
                      notes
                      kind
                      id
                    }
                  }
                }
                run_after_transformations {
                  run_after_transformation_id
                }
                production_queries_aggregate {
                  aggregate {
                    count
                  }
                }
                transformation_maintenances(where: {ended_at: {_is_null: true}}) {
                  started_at
                  notes
                  kind
                  id
                }
                query_updates(
                  where: {rows_inserted: {_gt: 0}}
                  order_by: {processed_at: desc_nulls_last}
                  limit: 1
                ) {
                  rows_inserted
                  from_sync_time
                  to_sync_time
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return TransformationIndexWDependency.parse_obj(data)

    def update_activity(
        self,
        id: Any,
        name: str,
        description: Union[Optional[str], UnsetType] = UNSET,
        updated_by: Union[Optional[str], UnsetType] = UNSET,
        maintainer_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateActivity:
        query = gql(
            """
            mutation UpdateActivity($id: uuid!, $name: String!, $description: String, $updated_by: String, $maintainer_id: uuid) {
              update_activity(
                where: {id: {_eq: $id}}
                _set: {name: $name, description: $description, updated_by: $updated_by, maintainer_id: $maintainer_id}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "name": name,
            "description": description,
            "updated_by": updated_by,
            "maintainer_id": maintainer_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateActivity.parse_obj(data)

    def update_activity_category(self, id: Any, category_id: Any) -> UpdateActivityCategory:
        query = gql(
            """
            mutation UpdateActivityCategory($id: uuid!, $category_id: uuid!) {
              update_activity_by_pk(_set: {category_id: $category_id}, pk_columns: {id: $id}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "category_id": category_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateActivityCategory.parse_obj(data)

    def update_activity_rows(self, id: Any, row_count: int) -> UpdateActivityRows:
        query = gql(
            """
            mutation UpdateActivityRows($id: uuid!, $row_count: Int!) {
              update_activity_by_pk(pk_columns: {id: $id}, _set: {row_count: $row_count}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "row_count": row_count}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateActivityRows.parse_obj(data)

    def update_chat_summary(self, chat_id: Any, summary: str, detailed_summary: str) -> UpdateChatSummary:
        query = gql(
            """
            mutation UpdateChatSummary($chat_id: uuid!, $summary: String!, $detailed_summary: String!) {
              update_chat_by_pk(
                pk_columns: {id: $chat_id}
                _set: {summary: $summary, detailed_summary: $detailed_summary}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "chat_id": chat_id,
            "summary": summary,
            "detailed_summary": detailed_summary,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateChatSummary.parse_obj(data)

    def update_chat_vote(self, id: Any, rating: int) -> UpdateChatVote:
        query = gql(
            """
            mutation UpdateChatVote($id: uuid!, $rating: Int!) {
              update_chat_by_pk(pk_columns: {id: $id}, _set: {rating: $rating}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "rating": rating}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateChatVote.parse_obj(data)

    def update_column(self, id: Any, label: str, has_data: bool) -> UpdateColumn:
        query = gql(
            """
            mutation UpdateColumn($id: uuid!, $label: String!, $has_data: Boolean!) {
              update_column_renames(
                where: {id: {_eq: $id}}
                _set: {label: $label, has_data: $has_data}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "label": label, "has_data": has_data}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateColumn.parse_obj(data)

    def update_company(
        self,
        id: Any,
        name: Union[Optional[str], UnsetType] = UNSET,
        cache_minutes: Union[Optional[int], UnsetType] = UNSET,
        materialize_schema: Union[Optional[str], UnsetType] = UNSET,
        warehouse_schema: Union[Optional[str], UnsetType] = UNSET,
        timezone: Union[Optional[str], UnsetType] = UNSET,
        website: Union[Optional[str], UnsetType] = UNSET,
        start_data_on: Union[Optional[Any], UnsetType] = UNSET,
        warehouse_default_schemas: Union[Optional[str], UnsetType] = UNSET,
        currency_used: Union[Optional[str], UnsetType] = UNSET,
        dataset_row_threshold: Union[Optional[int], UnsetType] = UNSET,
        dataset_default_filter_days: Union[Optional[int], UnsetType] = UNSET,
        use_time_boundary: Union[Optional[bool], UnsetType] = UNSET,
        week_day_offset: Union[Optional[int], UnsetType] = UNSET,
    ) -> UpdateCompany:
        query = gql(
            """
            mutation UpdateCompany($id: uuid!, $name: String, $cache_minutes: Int, $materialize_schema: String, $warehouse_schema: String, $timezone: String, $website: String, $start_data_on: date, $warehouse_default_schemas: String, $currency_used: String, $dataset_row_threshold: Int, $dataset_default_filter_days: Int, $use_time_boundary: Boolean, $week_day_offset: Int) {
              update_company_by_pk(
                pk_columns: {id: $id}
                _set: {name: $name, cache_minutes: $cache_minutes, materialize_schema: $materialize_schema, production_schema: $warehouse_schema, timezone: $timezone, website: $website, start_data_on: $start_data_on, warehouse_default_schemas: $warehouse_default_schemas, use_time_boundary: $use_time_boundary, currency_used: $currency_used, dataset_row_threshold: $dataset_row_threshold, dataset_default_filter_days: $dataset_default_filter_days, week_day_offset: $week_day_offset, updated_at: "now()"}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "name": name,
            "cache_minutes": cache_minutes,
            "materialize_schema": materialize_schema,
            "warehouse_schema": warehouse_schema,
            "timezone": timezone,
            "website": website,
            "start_data_on": start_data_on,
            "warehouse_default_schemas": warehouse_default_schemas,
            "currency_used": currency_used,
            "dataset_row_threshold": dataset_row_threshold,
            "dataset_default_filter_days": dataset_default_filter_days,
            "use_time_boundary": use_time_boundary,
            "week_day_offset": week_day_offset,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompany.parse_obj(data)

    def update_company_batch_halt(self, id: Any, batch_halt: bool, user_id: Any) -> UpdateCompanyBatchHalt:
        query = gql(
            """
            mutation UpdateCompanyBatchHalt($id: uuid!, $batch_halt: Boolean!, $user_id: uuid!) {
              update_company_by_pk(
                pk_columns: {id: $id}
                _set: {batch_halt: $batch_halt, batch_halted_at: "now()", batch_halted_by: $user_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "batch_halt": batch_halt,
            "user_id": user_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyBatchHalt.parse_obj(data)

    def update_company_status(self, company_id: Any, status: company_status_enum) -> UpdateCompanyStatus:
        query = gql(
            """
            mutation UpdateCompanyStatus($company_id: uuid!, $status: company_status_enum!) {
              update_company(where: {id: {_eq: $company_id}}, _set: {status: $status}) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "status": status}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyStatus.parse_obj(data)

    def update_company_table(
        self,
        id: Any,
        identifier: Union[Optional[str], UnsetType] = UNSET,
        default_time_between: Union[Optional[str], UnsetType] = UNSET,
        is_imported: Union[Optional[bool], UnsetType] = UNSET,
        customer_dim_table_id: Union[Optional[Any], UnsetType] = UNSET,
        maintainer_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateCompanyTable:
        query = gql(
            """
            mutation UpdateCompanyTable($id: uuid!, $identifier: String, $default_time_between: String, $is_imported: Boolean, $customer_dim_table_id: uuid, $maintainer_id: uuid) {
              update_company_table_by_pk(
                pk_columns: {id: $id}
                _set: {identifier: $identifier, default_time_between: $default_time_between, is_imported: $is_imported, customer_dim_table_id: $customer_dim_table_id, maintainer_id: $maintainer_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "identifier": identifier,
            "default_time_between": default_time_between,
            "is_imported": is_imported,
            "customer_dim_table_id": customer_dim_table_id,
            "maintainer_id": maintainer_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyTable.parse_obj(data)

    def update_company_table_partition(
        self,
        id: Any,
        manually_partition_activity: Union[Optional[bool], UnsetType] = UNSET,
    ) -> UpdateCompanyTablePartition:
        query = gql(
            """
            mutation UpdateCompanyTablePartition($id: uuid!, $manually_partition_activity: Boolean) {
              update_company_table_by_pk(
                pk_columns: {id: $id}
                _set: {manually_partition_activity: $manually_partition_activity}
              ) {
                id
              }
              update_company_by_pk(pk_columns: {id: $id}, _set: {updated_at: "now()"}) {
                slug
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "manually_partition_activity": manually_partition_activity,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyTablePartition.parse_obj(data)

    def update_company_table_rows(
        self, id: Any, row_count: Union[Optional[Any], UnsetType] = UNSET
    ) -> UpdateCompanyTableRows:
        query = gql(
            """
            mutation UpdateCompanyTableRows($id: uuid!, $row_count: bigint) {
              update_company_table_by_pk(pk_columns: {id: $id}, _set: {row_count: $row_count}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "row_count": row_count}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyTableRows.parse_obj(data)

    def update_company_templates(
        self,
        company_id: Any,
        templates_input: List[company_narrative_templates_insert_input],
    ) -> UpdateCompanyTemplates:
        query = gql(
            """
            mutation UpdateCompanyTemplates($company_id: uuid!, $templates_input: [company_narrative_templates_insert_input!]!) {
              delete_company_narrative_templates(where: {company_id: {_eq: $company_id}}) {
                returning {
                  id
                }
              }
              insert_company_narrative_templates(objects: $templates_input) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "templates_input": templates_input,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyTemplates.parse_obj(data)

    def update_company_timeline(
        self,
        id: Any,
        happened_at: Any,
        name: str,
        description: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateCompanyTimeline:
        query = gql(
            """
            mutation UpdateCompanyTimeline($id: uuid!, $happened_at: date!, $name: String!, $description: String) {
              update_company_timeline_by_pk(
                pk_columns: {id: $id}
                _set: {happened_at: $happened_at, description: $description, name: $name}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "happened_at": happened_at,
            "name": name,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyTimeline.parse_obj(data)

    def update_company_with_auth0_org(self, company_id: Any, org_id: str) -> UpdateCompanyWithAuth0Org:
        query = gql(
            """
            mutation UpdateCompanyWithAuth0Org($company_id: uuid!, $org_id: String!) {
              update_company_auth0(
                where: {company_id: {_eq: $company_id}}
                _set: {org_id: $org_id}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {"company_id": company_id, "org_id": org_id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateCompanyWithAuth0Org.parse_obj(data)

    def update_dataset(
        self,
        id: Any,
        name: Union[Optional[str], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
        hide_from_index: Union[Optional[bool], UnsetType] = UNSET,
        locked: Union[Optional[bool], UnsetType] = UNSET,
    ) -> UpdateDataset:
        query = gql(
            """
            mutation UpdateDataset($id: uuid!, $name: String, $description: String, $hide_from_index: Boolean, $locked: Boolean) {
              update_dataset_by_pk(
                pk_columns: {id: $id}
                _set: {name: $name, description: $description, hide_from_index: $hide_from_index, locked: $locked}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "name": name,
            "description": description,
            "hide_from_index": hide_from_index,
            "locked": locked,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDataset.parse_obj(data)

    def update_dataset_created_by(
        self, id: Any, created_by: Union[Optional[Any], UnsetType] = UNSET
    ) -> UpdateDatasetCreatedBy:
        query = gql(
            """
            mutation UpdateDatasetCreatedBy($id: uuid!, $created_by: uuid) {
              update_dataset_by_pk(pk_columns: {id: $id}, _set: {created_by: $created_by}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "created_by": created_by}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDatasetCreatedBy.parse_obj(data)

    def update_dataset_materialization(
        self,
        id: Any,
        type: materialization_type_enum,
        label: str,
        group_slug: Union[Optional[str], UnsetType] = UNSET,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
        external_link: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateDatasetMaterialization:
        query = gql(
            """
            mutation UpdateDatasetMaterialization($id: uuid!, $type: materialization_type_enum!, $group_slug: String, $label: String!, $updated_by: uuid, $external_link: String) {
              update_dataset_materialization_by_pk(
                pk_columns: {id: $id}
                _set: {updated_by: $updated_by, group_slug: $group_slug, type: $type, label: $label, external_link: $external_link}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "type": type,
            "group_slug": group_slug,
            "label": label,
            "updated_by": updated_by,
            "external_link": external_link,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDatasetMaterialization.parse_obj(data)

    def update_dataset_relations(
        self,
        dataset_id: Any,
        updated_by: Any,
        activity_ids: List[Any],
        activity_inputs: List[dataset_activities_insert_input],
    ) -> UpdateDatasetRelations:
        query = gql(
            """
            mutation UpdateDatasetRelations($dataset_id: uuid!, $updated_by: uuid!, $activity_ids: [uuid!]!, $activity_inputs: [dataset_activities_insert_input!]!) {
              delete_dataset_activities(
                where: {dataset_id: {_eq: $dataset_id}, activity_id: {_nin: $activity_ids}}
              ) {
                affected_rows
              }
              insert_dataset_activities(
                objects: $activity_inputs
                on_conflict: {constraint: dataset_activities_dataset_id_activity_id_key, update_columns: []}
              ) {
                affected_rows
              }
              update_dataset_by_pk(
                pk_columns: {id: $dataset_id}
                _set: {last_config_updated_at: "now()", updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "dataset_id": dataset_id,
            "updated_by": updated_by,
            "activity_ids": activity_ids,
            "activity_inputs": activity_inputs,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDatasetRelations.parse_obj(data)

    def update_datasetstatus(
        self, id: Any, status: Union[Optional[status_enum], UnsetType] = UNSET
    ) -> UpdateDatasetstatus:
        query = gql(
            """
            mutation UpdateDatasetstatus($id: uuid!, $status: status_enum) {
              update_dataset_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "status": status}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDatasetstatus.parse_obj(data)

    def update_datasource(
        self,
        company_id: Any,
        warehouse: company_config_warehouse_language_enum,
        status: company_status_enum,
        project_id: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateDatasource:
        query = gql(
            """
            mutation UpdateDatasource($company_id: uuid!, $warehouse: company_config_warehouse_language_enum!, $status: company_status_enum!, $project_id: String) {
              update_company_by_pk(
                pk_columns: {id: $company_id}
                _set: {status: $status, project_id: $project_id, warehouse_language: $warehouse}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "warehouse": warehouse,
            "status": status,
            "project_id": project_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateDatasource.parse_obj(data)

    def update_execution_status(self, id: Any, status: task_execution_status_enum) -> UpdateExecutionStatus:
        query = gql(
            """
            mutation UpdateExecutionStatus($id: uuid!, $status: task_execution_status_enum!) {
              update_task_execution_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "status": status}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateExecutionStatus.parse_obj(data)

    def update_item_tags(
        self,
        tag_ids: List[Any],
        related_to: tag_relations_enum,
        related_id: Any,
        tag_inputs: List[tag_insert_input],
    ) -> UpdateItemTags:
        query = gql(
            """
            mutation UpdateItemTags($tag_ids: [uuid!]!, $related_to: tag_relations_enum!, $related_id: uuid!, $tag_inputs: [tag_insert_input!]!) {
              delete_tag(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $related_id}, company_tag: {user_id: {_is_null: true}}, tag_id: {_nin: $tag_ids}}
              ) {
                affected_rows
              }
              insert_tag(
                objects: $tag_inputs
                on_conflict: {constraint: tag_tag_id_related_to_related_id_key, update_columns: []}
              ) {
                affected_rows
              }
            }
            """
        )
        variables: dict[str, object] = {
            "tag_ids": tag_ids,
            "related_to": related_to,
            "related_id": related_id,
            "tag_inputs": tag_inputs,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateItemTags.parse_obj(data)

    def update_narrative(
        self, id: Any, name: str, description: Union[Optional[str], UnsetType] = UNSET
    ) -> UpdateNarrative:
        query = gql(
            """
            mutation UpdateNarrative($id: uuid!, $name: String!, $description: String) {
              narrative: update_narrative_by_pk(
                pk_columns: {id: $id}
                _set: {name: $name, description: $description}
              ) {
                id
                slug
                name
                description
                type
                created_at
                updated_at
                created_by
                company_task {
                  id
                  schedule
                }
                tags {
                  id
                  updated_at
                  tag_id
                  company_tag {
                    tag
                    user_id
                  }
                }
                teams: team_permissions {
                  id: team_id
                  can_edit
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "name": name,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrative.parse_obj(data)

    def update_narrative_config(self, narrative_id: Any, updated_by: Any) -> UpdateNarrativeConfig:
        query = gql(
            """
            mutation UpdateNarrativeConfig($narrative_id: uuid!, $updated_by: uuid!) {
              update_narrative_by_pk(
                pk_columns: {id: $narrative_id}
                _set: {last_config_updated_at: "now()", updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "narrative_id": narrative_id,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeConfig.parse_obj(data)

    def update_narrative_depends(
        self,
        narrative_id: Any,
        update_narratives: List[narrative_narratives_insert_input],
    ) -> UpdateNarrativeDepends:
        query = gql(
            """
            mutation UpdateNarrativeDepends($narrative_id: uuid!, $update_narratives: [narrative_narratives_insert_input!]!) {
              delete_narrative_narratives(where: {narrative_id: {_eq: $narrative_id}}) {
                returning {
                  id
                }
              }
              insert_narrative_narratives(objects: $update_narratives) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "narrative_id": narrative_id,
            "update_narratives": update_narratives,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeDepends.parse_obj(data)

    def update_narrative_meta(
        self,
        company_id: Any,
        slug: str,
        name: Union[Optional[str], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateNarrativeMeta:
        query = gql(
            """
            mutation UpdateNarrativeMeta($company_id: uuid!, $slug: String!, $name: String, $description: String) {
              update_narrative(
                where: {company_id: {_eq: $company_id}, slug: {_eq: $slug}}
                _set: {name: $name, description: $description}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "name": name,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeMeta.parse_obj(data)

    def update_narrative_relations(
        self,
        narrative_id: Any,
        narrative_datasets: List[narrative_datasets_insert_input],
    ) -> UpdateNarrativeRelations:
        query = gql(
            """
            mutation UpdateNarrativeRelations($narrative_id: uuid!, $narrative_datasets: [narrative_datasets_insert_input!]!) {
              delete_narrative_datasets(where: {narrative_id: {_eq: $narrative_id}}) {
                returning {
                  id
                }
              }
              insert_narrative_datasets(objects: $narrative_datasets) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "narrative_id": narrative_id,
            "narrative_datasets": narrative_datasets,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeRelations.parse_obj(data)

    def update_narrative_snapshot(self, id: Any) -> UpdateNarrativeSnapshot:
        query = gql(
            """
            mutation UpdateNarrativeSnapshot($id: uuid!) {
              update_narrative_by_pk(
                pk_columns: {id: $id}
                _set: {snapshot_updated_at: "now()"}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeSnapshot.parse_obj(data)

    def update_narrative_template(self, id: Any, template: str) -> UpdateNarrativeTemplate:
        query = gql(
            """
            mutation UpdateNarrativeTemplate($id: uuid!, $template: String!) {
              update_narrative_template_by_pk(
                pk_columns: {id: $id}
                _set: {template: $template}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "template": template}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeTemplate.parse_obj(data)

    def update_narrative_with_template(
        self, company_id: Any, slug: str, template_id: Any
    ) -> UpdateNarrativeWithTemplate:
        query = gql(
            """
            mutation UpdateNarrativeWithTemplate($company_id: uuid!, $slug: String!, $template_id: uuid!) {
              update_narrative(
                _set: {template_id: $template_id}
                where: {company_id: {_eq: $company_id}, slug: {_eq: $slug}}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "slug": slug,
            "template_id": template_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNarrativeWithTemplate.parse_obj(data)

    def update_next_resync(
        self,
        transformation_id: Any,
        next_resync_at: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateNextResync:
        query = gql(
            """
            mutation UpdateNextResync($transformation_id: uuid!, $next_resync_at: timestamptz) {
              update_transformation_by_pk(
                _set: {next_resync_at: $next_resync_at}
                pk_columns: {id: $transformation_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "next_resync_at": next_resync_at,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateNextResync.parse_obj(data)

    def update_query_template(
        self,
        id: Any,
        sql_query: str,
        data_source: str,
        updated_by: Any,
        schema_names: str,
        transformation_kind: transformation_kinds_enum,
        transformation_update_type: transformation_update_types_enum,
    ) -> UpdateQueryTemplate:
        query = gql(
            """
            mutation UpdateQueryTemplate($id: uuid!, $sql_query: String!, $data_source: String!, $updated_by: uuid!, $schema_names: String!, $transformation_kind: transformation_kinds_enum!, $transformation_update_type: transformation_update_types_enum!) {
              update_query_template_by_pk(
                pk_columns: {id: $id}
                _set: {data_source: $data_source, query: $sql_query, schema_names: $schema_names, transformation_kind: $transformation_kind, transformation_update_type: $transformation_update_type, updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "sql_query": sql_query,
            "data_source": data_source,
            "updated_by": updated_by,
            "schema_names": schema_names,
            "transformation_kind": transformation_kind,
            "transformation_update_type": transformation_update_type,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateQueryTemplate.parse_obj(data)

    def update_role(self, id: Any, role: company_user_role_enum) -> UpdateRole:
        query = gql(
            """
            mutation UpdateRole($id: uuid!, $role: company_user_role_enum!) {
              update_company_user_by_pk(pk_columns: {id: $id}, _set: {role: $role}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "role": role}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateRole.parse_obj(data)

    def update_sql_query(
        self,
        id: Any,
        sql: str,
        notes: Union[Optional[str], UnsetType] = UNSET,
        updated_by: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateSqlQuery:
        query = gql(
            """
            mutation UpdateSqlQuery($id: uuid!, $sql: String!, $notes: String, $updated_by: String) {
              updated_query: update_sql_queries_by_pk(
                pk_columns: {id: $id}
                _set: {sql: $sql, notes: $notes, updated_by: $updated_by}
              ) {
                id
                updated_by
                updated_at
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "sql": sql,
            "notes": notes,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateSqlQuery.parse_obj(data)

    def update_tag(
        self,
        id: Any,
        color: str,
        tag: Union[Optional[str], UnsetType] = UNSET,
        description: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateTag:
        query = gql(
            """
            mutation UpdateTag($id: uuid!, $color: String!, $tag: String, $description: String) {
              update_company_tags_by_pk(
                pk_columns: {id: $id}
                _set: {color: $color, tag: $tag, description: $description}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "color": color,
            "tag": tag,
            "description": description,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTag.parse_obj(data)

    def update_task(self, id: Any, schedule: str, label: str) -> UpdateTask:
        query = gql(
            """
            mutation UpdateTask($id: uuid!, $schedule: String!, $label: String!) {
              update_company_task_by_pk(
                pk_columns: {id: $id}
                _set: {schedule: $schedule, label: $label}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "schedule": schedule, "label": label}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTask.parse_obj(data)

    def update_task_orchestration_id(self, id: Any, task_orchestration_id: str) -> UpdateTaskOrchestrationId:
        query = gql(
            """
            mutation UpdateTaskOrchestrationId($id: uuid!, $task_orchestration_id: String!) {
              update_task_execution_by_pk(
                pk_columns: {id: $id}
                _set: {orchestration_id: $task_orchestration_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "task_orchestration_id": task_orchestration_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTaskOrchestrationId.parse_obj(data)

    def update_task_schedule(self, id: Any, schedule: str) -> UpdateTaskSchedule:
        query = gql(
            """
            mutation UpdateTaskSchedule($id: uuid!, $schedule: String!) {
              update_company_task_by_pk(pk_columns: {id: $id}, _set: {schedule: $schedule}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "schedule": schedule}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTaskSchedule.parse_obj(data)

    def update_team(self, id: Any, name: str) -> UpdateTeam:
        query = gql(
            """
            mutation UpdateTeam($id: uuid!, $name: String!) {
              update_team_by_pk(pk_columns: {id: $id}, _set: {name: $name}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "name": name}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTeam.parse_obj(data)

    def update_team_permissions(
        self,
        permissions: List[team_permission_insert_input],
        related_to: str,
        related_id: Any,
    ) -> UpdateTeamPermissions:
        query = gql(
            """
            mutation UpdateTeamPermissions($permissions: [team_permission_insert_input!]!, $related_to: String!, $related_id: uuid!) {
              delete_team_permission(
                where: {related_to: {_eq: $related_to}, related_id: {_eq: $related_id}}
              ) {
                affected_rows
              }
              insert_team_permission(objects: $permissions) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "permissions": permissions,
            "related_to": related_to,
            "related_id": related_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTeamPermissions.parse_obj(data)

    def update_test(
        self,
        id: Any,
        status: transformation_test_status_enum,
        content: Union[Optional[str], UnsetType] = UNSET,
        sql_query: Union[Optional[str], UnsetType] = UNSET,
        validate_data_from: Union[Optional[Any], UnsetType] = UNSET,
        data: Union[Optional[str], UnsetType] = UNSET,
    ) -> UpdateTest:
        query = gql(
            """
            mutation UpdateTest($id: uuid!, $status: transformation_test_status_enum!, $content: String, $sql_query: String, $validate_data_from: timestamptz, $data: String) {
              update_transformation_test(
                where: {id: {_eq: $id}}
                _set: {status: $status, query: $sql_query, content: $content, ran_data_from: $validate_data_from, data: $data}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "status": status,
            "content": content,
            "sql_query": sql_query,
            "validate_data_from": validate_data_from,
            "data": data,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTest.parse_obj(data)

    def update_training_request(
        self,
        id: Any,
        email_requester: bool,
        group_slug: str,
        plot_slug: str,
        status: trainining_request_status_enum,
        email_context: str,
        email_sent_at: Any,
        status_updated_at: Any,
        assigned_to: Any,
        dataset_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateTrainingRequest:
        query = gql(
            """
            mutation UpdateTrainingRequest($id: uuid!, $dataset_id: uuid, $email_requester: Boolean!, $group_slug: String!, $plot_slug: String!, $status: trainining_request_status_enum!, $email_context: String!, $email_sent_at: timestamptz!, $status_updated_at: timestamptz!, $assigned_to: uuid!) {
              update_training_request_by_pk(
                pk_columns: {id: $id}
                _set: {dataset_id: $dataset_id, email_requester: $email_requester, group_slug: $group_slug, plot_slug: $plot_slug, status: $status, email_context: $email_context, email_sent_at: $email_sent_at, status_updated_at: $status_updated_at, assigned_to: $assigned_to}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "dataset_id": dataset_id,
            "email_requester": email_requester,
            "group_slug": group_slug,
            "plot_slug": plot_slug,
            "status": status,
            "email_context": email_context,
            "email_sent_at": email_sent_at,
            "status_updated_at": status_updated_at,
            "assigned_to": assigned_to,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTrainingRequest.parse_obj(data)

    def update_transformation_column_casting(self, id: Any, casting: str) -> UpdateTransformationColumnCasting:
        query = gql(
            """
            mutation UpdateTransformationColumnCasting($id: uuid!, $casting: String!) {
              update_column_renames_by_pk(pk_columns: {id: $id}, _set: {casting: $casting}) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "casting": casting}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationColumnCasting.parse_obj(data)

    def update_transformation_config(
        self,
        transformation_id: Any,
        update_type: transformation_update_types_enum,
        has_source: Union[Optional[bool], UnsetType] = UNSET,
        is_aliasing: Union[Optional[bool], UnsetType] = UNSET,
        delete_window: Union[Optional[int], UnsetType] = UNSET,
        do_not_delete_on_resync: Union[Optional[bool], UnsetType] = UNSET,
        allow_future_data: Union[Optional[bool], UnsetType] = UNSET,
        start_data_after: Union[Optional[Any], UnsetType] = UNSET,
        max_days_to_insert: Union[Optional[int], UnsetType] = UNSET,
        mutable_day_window: Union[Optional[int], UnsetType] = UNSET,
        remove_customers: Union[Optional[bool], UnsetType] = UNSET,
        notify_row_count_percent_change: Union[Optional[Any], UnsetType] = UNSET,
        do_not_update_on_percent_change: Union[Optional[bool], UnsetType] = UNSET,
        task_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateTransformationConfig:
        query = gql(
            """
            mutation UpdateTransformationConfig($transformation_id: uuid!, $update_type: transformation_update_types_enum!, $has_source: Boolean, $is_aliasing: Boolean, $delete_window: Int, $do_not_delete_on_resync: Boolean, $allow_future_data: Boolean, $start_data_after: date, $max_days_to_insert: Int, $mutable_day_window: Int, $remove_customers: Boolean, $notify_row_count_percent_change: numeric, $do_not_update_on_percent_change: Boolean, $task_id: uuid) {
              update_transformation_by_pk(
                pk_columns: {id: $transformation_id}
                _set: {update_type: $update_type, has_source: $has_source, is_aliasing: $is_aliasing, remove_customers: $remove_customers, delete_window: $delete_window, mutable_day_window: $mutable_day_window, do_not_delete_on_resync: $do_not_delete_on_resync, allow_future_data: $allow_future_data, start_data_after: $start_data_after, max_days_to_insert: $max_days_to_insert, notify_row_count_percent_change: $notify_row_count_percent_change, do_not_update_on_percent_change: $do_not_update_on_percent_change, task_id: $task_id}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "update_type": update_type,
            "has_source": has_source,
            "is_aliasing": is_aliasing,
            "delete_window": delete_window,
            "do_not_delete_on_resync": do_not_delete_on_resync,
            "allow_future_data": allow_future_data,
            "start_data_after": start_data_after,
            "max_days_to_insert": max_days_to_insert,
            "mutable_day_window": mutable_day_window,
            "remove_customers": remove_customers,
            "notify_row_count_percent_change": notify_row_count_percent_change,
            "do_not_update_on_percent_change": do_not_update_on_percent_change,
            "task_id": task_id,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationConfig.parse_obj(data)

    def update_transformation_maintenance_note(self, id: Any, notes: str) -> UpdateTransformationMaintenanceNote:
        query = gql(
            """
            mutation UpdateTransformationMaintenanceNote($id: uuid!, $notes: String!) {
              update_transformation_maintenance_by_pk(
                pk_columns: {id: $id}
                _set: {notes: $notes}
              ) {
                id
                started_at
                ended_at
                notes
                kind
              }
            }
            """
        )
        variables: dict[str, object] = {"id": id, "notes": notes}
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationMaintenanceNote.parse_obj(data)

    def update_transformation_name(
        self,
        id: Any,
        name: str,
        table: str,
        updated_by: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateTransformationName:
        query = gql(
            """
            mutation UpdateTransformationName($id: uuid!, $name: String!, $table: String!, $updated_by: uuid) {
              update_transformation_by_pk(
                pk_columns: {id: $id}
                _set: {name: $name, table: $table, updated_by: $updated_by}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "id": id,
            "name": name,
            "table": table,
            "updated_by": updated_by,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationName.parse_obj(data)

    def update_transformation_resync(
        self,
        transformation_id: Any,
        last_resynced_at: Union[Optional[Any], UnsetType] = UNSET,
        next_resync_at: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateTransformationResync:
        query = gql(
            """
            mutation UpdateTransformationResync($transformation_id: uuid!, $last_resynced_at: timestamptz, $next_resync_at: timestamptz) {
              update_transformation(
                where: {id: {_eq: $transformation_id}}
                _set: {last_resynced_at: $last_resynced_at, next_resync_at: $next_resync_at}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "last_resynced_at": last_resynced_at,
            "next_resync_at": next_resync_at,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationResync.parse_obj(data)

    def update_transformation_run_depends(
        self,
        transformation_id: Any,
        run_afters: List[transformation_run_after_insert_input],
        depends_on: List[transformation_depends_on_insert_input],
    ) -> UpdateTransformationRunDepends:
        query = gql(
            """
            mutation UpdateTransformationRunDepends($transformation_id: uuid!, $run_afters: [transformation_run_after_insert_input!]!, $depends_on: [transformation_depends_on_insert_input!]!) {
              delete_transformation_run_after(
                where: {transformation_id: {_eq: $transformation_id}}
              ) {
                returning {
                  id
                }
              }
              delete_transformation_depends_on(
                where: {transformation_id: {_eq: $transformation_id}}
              ) {
                returning {
                  id
                }
              }
              insert_transformation_run_after(objects: $run_afters) {
                returning {
                  id
                }
              }
              insert_transformation_depends_on(objects: $depends_on) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "run_afters": run_afters,
            "depends_on": depends_on,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationRunDepends.parse_obj(data)

    def update_transformation_single_activity(
        self, transformation_id: Any, single_activity: bool
    ) -> UpdateTransformationSingleActivity:
        query = gql(
            """
            mutation UpdateTransformationSingleActivity($transformation_id: uuid!, $single_activity: Boolean!) {
              update_transformation(
                where: {id: {_eq: $transformation_id}}
                _set: {single_activity: $single_activity}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "single_activity": single_activity,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationSingleActivity.parse_obj(data)

    def update_transformation_update_type(
        self, transformation_id: Any, update_type: transformation_update_types_enum
    ) -> UpdateTransformationUpdateType:
        query = gql(
            """
            mutation UpdateTransformationUpdateType($transformation_id: uuid!, $update_type: transformation_update_types_enum!) {
              update_transformation(
                where: {id: {_eq: $transformation_id}}
                _set: {update_type: $update_type}
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "transformation_id": transformation_id,
            "update_type": update_type,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateTransformationUpdateType.parse_obj(data)

    def update_user_avatar(self, company_user_id: Any, profile_picture: str) -> UpdateUserAvatar:
        query = gql(
            """
            mutation UpdateUserAvatar($company_user_id: uuid!, $profile_picture: String!) {
              insert_company_user_preferences_one(
                object: {company_user_id: $company_user_id, profile_picture: $profile_picture}
                on_conflict: {constraint: company_user_preferences_pkey, update_columns: [profile_picture]}
              ) {
                id
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_user_id": company_user_id,
            "profile_picture": profile_picture,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateUserAvatar.parse_obj(data)

    def update_user_context(
        self,
        user_id: Any,
        context_update: company_user_set_input,
        company_id: Union[Optional[Any], UnsetType] = UNSET,
    ) -> UpdateUserContext:
        query = gql(
            """
            mutation UpdateUserContext($company_id: uuid, $user_id: uuid!, $context_update: company_user_set_input!) {
              update_company_user(
                where: {company_id: {_eq: $company_id}, user_id: {_eq: $user_id}}
                _set: $context_update
              ) {
                returning {
                  id
                }
              }
            }
            """
        )
        variables: dict[str, object] = {
            "company_id": company_id,
            "user_id": user_id,
            "context_update": context_update,
        }
        response = self.execute(query=query, variables=variables)
        data = self.get_data(response)
        return UpdateUserContext.parse_obj(data)
