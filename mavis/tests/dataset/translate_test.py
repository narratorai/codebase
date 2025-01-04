import json
from copy import deepcopy
import os

import pytest

from batch_jobs.data_management.run_transformations import (
    Plan,
    ProcessUpdate,
    _add_removed_customers,
    _compute_cache_columns_v2,
    _get_the_removed_customers,
    _run_customer_aliasing_v2,
    _run_identity_resolution_v2,
    _run_regular_insert,
    _should_full_identity_run,
    delete_duplicate_identities,
    get_query,
    run_mutable_insert,
    undo_identity_resolution,
)
from core import utils
from core.graph.sync_client.enums import transformation_kinds_enum
from core.graph.sync_client.get_transformation_for_processing import (
    GetTransformationForProcessingTransformation,
)
from core.graph.sync_client.transformation_index_w_dependency import (
    TransformationIndexWDependencyAllTransformations,
)
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import get_uuid4
from core.models.mavis_config import MavisConfig

from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

logger = get_logger().new()

# bring your own warehouse_language
partial_company_args = {
    "slug": "test",
    "id": get_uuid4(),
    "updated_at": "2020-01-01T00:00:00",
    "status": "active",
    "production_schema": "test_schema",
    "materialize_schema": "test_mv_schema",
    "warehouse_language": "redshift",
    "timezone": "UTC",
    "cache_minutes": 5,
    "index_warehouse_count": 1,
    "logger": logger,
    "resources": {
        "company_role": "AIDAJQABLZS4A3QDU576Q",
        "s3_bucket": "test_company_s3_bucket",
        "kms_key": "test_company_kms_key",
    },
    "tables": [
        {
            "id": get_uuid4(),
            "updated_at": utils.utcnow(),
            "activity_stream": "activity_stream",
            "manually_partition_activity": False,
            "identifier": "customer",
        },
        {
            "id": get_uuid4(),
            "updated_at": utils.utcnow(),
            "activity_stream": "company_stream",
            "manually_partition_activity": False,
            "identifier": "Company",
        },
    ],
    "current_user": {
        "id": get_uuid4(),
        "email": "test@test.com",
        "tags": {"favorite": None, "recently_viewed": None},
        "is_internal_admin": True,
        "is_admin": True,
        "company": {
            "id": get_uuid4(),
            "slug": "test",
            "name": "TEST COMPANY",
            "everyone_team_id": "fe",
            "auth0_org_id": "",
        },
    },
}

# query comes from: https://portal.narrator.ai/narrator-demo/datasets/edit/mavis_unit_test_do_not_deleted2a87fa3
# with open("./tests/dataset/fixtures/complicated_dataset.json") as f:
#     complicated_dataset = json.load(f)


@pytest.mark.parametrize(
    "dataset_file",
    [
        "complicated_dataset",
        "demo_dataset",
        "demo_dataset_narrative",
        "parent_boolean_dataset",
        "dataset_with_features",
        "dataset_with_features_with_prefilters",
        "multi_with_feature_or",
        "demo_dataset_with_int_filter",
        "features_array_dataset",
        "multi_activity_enrichment",
        "dataset_with_filtered_dims",
        "dataset_multi_number",
        "dataset_with_features_with_prefilters",
    ],
)
def test_dataset_translate(
    s3,
    dataset_file,
):
    with open(f"./tests/dataset/fixtures/{dataset_file}.json") as f:
        complicated_dataset = json.load(f)

    for warehouse_language in ["redshift", "bigquery", "snowflake", "pg", "mssql_odbc", "databricks"]:
        for manually_partition in [True, False]:
            for remove_unessary_columns in [True, False]:
                mavis = create_mavis(warehouse_language, manually_partition)
                d_obj = Dataset(mavis, obj=complicated_dataset, limit=None)

                # get the dataset
                d_obj.version = 2

                for group_slug in [None] + [t.slug for t in d_obj.model.all_tabs]:
                    sql_path = [
                        ".",
                        "tests",
                        "dataset",
                        "fixtures",
                        warehouse_language,
                        "partitioned" if manually_partition else "not_part",
                        "full" if not remove_unessary_columns else "cleaned",
                        "parent" if group_slug is None else group_slug,
                        f"{dataset_file}.sql",
                    ]
                    expected_sql_file = "/".join(sql_path)
                    logger.info("expected_sql_file", expected_sql_file=expected_sql_file)

                    # if expected_sql_file != "./tests/dataset/fixtures/redshift/not_part/cleaned/month_of_timestamp3e748466/features_array_dataset.sql":
                    #     continue
                    expected_sql = get_sql(expected_sql_file)

                    # get the query
                    query = d_obj.qm_query(group_slug, remove_unessary_columns=remove_unessary_columns)

                    # utils.cprint(query.dict())
                    # translate the query
                    if warehouse_language == "pg":
                        result_sql = query.to_query(comment=False, nest_ctes=True)
                    else:
                        result_sql = query.to_query()

                    # # ONLY FOR AHMED DURING BUILDING
                    # # DO THIS ONLY in the beginning to make sure we save a copy
                    # reset_sql(expected_sql_file, result_sql)
                    deal_with_desired_sql(expected_sql, expected_sql_file, result_sql)

                    compare_sql(result_sql, expected_sql)


# @pytest.mark.parametrize(
#     "warehouse_language, dataset_file, expected_sql_file",
#     [
#         (
#             "redshift",
#             COMPLEX_DATASET,
#             "./tests/dataset/fixtures/redshift/translated_parent.sql",
#         ),
#         (
#             "redshift",
#             DEMO_DATASET,
#             "./tests/dataset/fixtures/redshift/demo_dataset_parent.sql",
#         ),
#         (
#             "redshift",
#             DEMO_NARRATIVE_DATASET,
#             "./tests/dataset/fixtures/redshift/demo_dataset_narrative_parent.sql",
#         ),
#         # FROM CANIX Co
#         (
#             "redshift",
#             "./tests/dataset/fixtures/parent_boolean_dataset.json",
#             "./tests/dataset/fixtures/redshift/parent_boolean_dataset.sql",
#         ),
#         (
#             "redshift",
#             "./tests/dataset/fixtures/multi_with_feature_or.json",
#             "./tests/dataset/fixtures/redshift/multi_with_feature_or.sql",
#         ),
#         (
#             "redshift",
#             "./tests/dataset/fixtures/demo_dataset_with_int_filter.json",
#             "./tests/dataset/fixtures/redshift/demo_dataset_with_int_filter.sql",
#         ),
#         (
#             "redshift",
#             "./tests/dataset/fixtures/multi_activity_enrichment.json",
#             "./tests/dataset/fixtures/redshift/multi_activity_enrichment.sql",
#         ),
#         (
#             "redshift",
#             "./tests/dataset/fixtures/dataset_feature_types.json",
#             "./tests/dataset/fixtures/redshift/feature_type_query.sql",
#         ),
#     ],
# )
# def test_create_dataset_setup(
#     s3,
#     warehouse_language,
#     dataset_file,
#     expected_sql_file,
# ):

#     # query comes from: https://portal.narrator.ai/narrator-demo/datasets/edit/mavis_unit_test_do_not_deleted2a87fa3
#     with open(dataset_file, "r") as f:
#         complicated_dataset = json.load(f)

#     expected_sql = get_sql(expected_sql_file)

#     mavis = create_mavis(warehouse_language, False)

#     # get the dataset
#     dataset_input = deepcopy(complicated_dataset)

#     # convert definition
#     dataset_config = createDataset.make_definition(mavis, dataset_input)

#     # convert to dataset
#     res = createDataset.generate_dataset_obj(mavis, dataset_config)

#     dataset_obj = DatasetUpdator(mavis=mavis).get_config_query(res["staged_dataset"])

#     # get the query
#     query = dataset.ds.generate_query(dataset_obj, limit=None)

#     # utils.cprint(query.dict())
#     # translate the query
#     if warehouse_language == "pg":
#         result_sql = query.to_query(comment=False, nest_ctes=True)
#     else:
#         result_sql = query.to_query()

#     # # ONLY FOR AHMED DURING BUILDING
#     # # DO THIS ONLY in the beginning to make sure we save a copy
#     # reset_sql(expected_sql_file, result_sql)
#     deal_with_desired_sql(expected_sql, expected_sql_file, result_sql)

#     compare_sql(result_sql, expected_sql)
#     return None


@pytest.mark.parametrize(
    "warehouse_language, include_metadata, include_casting, include_stream_cache_columns, desired_sql_path",
    [
        (
            "redshift",
            False,
            False,
            False,
            "./tests/dataset/fixtures/redshift/get_query_none.sql",
        ),
        (
            "redshift",
            True,
            True,
            True,
            "./tests/dataset/fixtures/redshift/get_query_with_all_additions.sql",
        ),
        (
            "bigquery",
            False,
            False,
            False,
            "./tests/dataset/fixtures/bigquery/get_query_none.sql",
        ),
        (
            "bigquery",
            True,
            True,
            True,
            "./tests/dataset/fixtures/bigquery/get_query_with_all_additions.sql",
        ),
        (
            "snowflake",
            False,
            False,
            False,
            "./tests/dataset/fixtures/snowflake/get_query_none.sql",
        ),
        (
            "snowflake",
            True,
            True,
            True,
            "./tests/dataset/fixtures/snowflake/get_query_with_all_additions.sql",
        ),
        (
            "pg",
            False,
            False,
            False,
            "./tests/dataset/fixtures/pg/get_query_none.sql",
        ),
        (
            "pg",
            True,
            True,
            True,
            "./tests/dataset/fixtures/pg/get_query_with_all_additions.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     False,
        #     False,
        #     "./tests/dataset/fixtures/mysql/get_query_none.sql",
        # ),
        # (
        #     "mysql",
        #     True,
        #     True,
        #     True,
        #     "./tests/dataset/fixtures/mysql/get_query_with_all_additions.sql",
        # ),
        (
            "mssql_odbc",
            False,
            False,
            False,
            "./tests/dataset/fixtures/mssql_odbc/get_query_none.sql",
        ),
        (
            "mssql_odbc",
            True,
            True,
            True,
            "./tests/dataset/fixtures/mssql_odbc/get_query_with_all_additions.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     False,
        #     False,
        #     "./tests/dataset/fixtures/mysql/get_query_none.sql",
        # ),
        # (
        #     "mysql",
        #     True,
        #     True,
        #     True,
        #     "./tests/dataset/fixtures/mysql/get_query_with_all_additions.sql",
        # ),
        (
            "databricks",
            False,
            False,
            False,
            "./tests/dataset/fixtures/databricks/get_query_none.sql",
        ),
        (
            "databricks",
            True,
            True,
            True,
            "./tests/dataset/fixtures/databricks/get_query_with_all_additions.sql",
        ),
    ],
)
def test_get_query(
    warehouse_language,
    include_metadata,
    include_casting,
    include_stream_cache_columns,
    desired_sql_path,
):
    desired_sql = get_sql(desired_sql_path)
    mavis = create_mavis(warehouse_language)

    transform = get_test_transform(mavis)
    basic_query = get_query(
        mavis,
        transform,
        include_metadata=include_metadata,
        include_casting=include_casting,
        include_stream_cache_columns=include_stream_cache_columns,
    )

    # # ONLY FOR AHMED DURING BUILDING
    # # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(desired_sql_path, basic_query.to_query())
    deal_with_desired_sql(desired_sql, desired_sql_path, basic_query.to_query())

    compare_sql(basic_query.to_query(), desired_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, ignore_slugs, manually_partition, expected_sql_file",
    [
        (
            "redshift",
            None,
            False,
            "./tests/dataset/fixtures/redshift/identity_resolution_v2.sql",
        ),
        (
            "bigquery",
            None,
            False,
            "./tests/dataset/fixtures/bigquery/identity_resolution_v2.sql",
        ),
        (
            "snowflake",
            None,
            False,
            "./tests/dataset/fixtures/snowflake/identity_resolution_v2.sql",
        ),
        (
            "pg",
            None,
            False,
            "./tests/dataset/fixtures/pg/identity_resolution_v2.sql",
        ),
        # (
        #     "mysql",
        #     None,
        #     False,
        #     "./tests/dataset/fixtures/mysql/identity_resolution_v2.sql",
        # ),
        (
            "mssql_odbc",
            None,
            False,
            "./tests/dataset/fixtures/mssql_odbc/identity_resolution_v2.sql",
        ),
        (
            "databricks",
            None,
            False,
            "./tests/dataset/fixtures/databricks/identity_resolution_v2.sql",
        ),
        (
            "redshift",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/redshift/identity_resolution_v2_with_remove.sql",
        ),
        (
            "bigquery",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/bigquery/identity_resolution_v2_with_remove.sql",
        ),
        (
            "snowflake",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/snowflake/identity_resolution_v2_with_remove.sql",
        ),
        (
            "pg",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/pg/identity_resolution_v2_with_remove.sql",
        ),
        # (
        #     "mysql",
        #     ["remove_activity"],
        #     False,
        #     "./tests/dataset/fixtures/mysql/identity_resolution_v2_with_remove.sql",
        # ),
        (
            "mssql_odbc",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/mssql_odbc/identity_resolution_v2_with_remove.sql",
        ),
        (
            "databricks",
            ["remove_activity"],
            False,
            "./tests/dataset/fixtures/databricks/identity_resolution_v2_with_remove.sql",
        ),
        (
            "redshift",
            None,
            True,
            "./tests/dataset/fixtures/redshift/identity_resolution_v2_partitioned.sql",
        ),
        (
            "bigquery",
            None,
            True,
            "./tests/dataset/fixtures/bigquery/identity_resolution_v2_partitioned.sql",
        ),
        (
            "snowflake",
            None,
            True,
            "./tests/dataset/fixtures/snowflake/identity_resolution_v2_partitioned.sql",
        ),
        (
            "pg",
            None,
            True,
            "./tests/dataset/fixtures/pg/identity_resolution_v2_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     None,
        #     True,
        #     "./tests/dataset/fixtures/mysql/identity_resolution_v2_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            None,
            True,
            "./tests/dataset/fixtures/mssql_odbc/identity_resolution_v2_partitioned.sql",
        ),
        (
            "databricks",
            None,
            True,
            "./tests/dataset/fixtures/databricks/identity_resolution_v2_partitioned.sql",
        ),
    ],
)
def test_identity_resolution_v2(warehouse_language, ignore_slugs, manually_partition, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    plan = get_test_plan(mavis, manually_partition=manually_partition)
    expected_sql = get_sql(expected_sql_file)

    current_sql = _run_identity_resolution_v2(plan, ignore_slugs, skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, manually_partition, expected_sql_file",
    [
        (
            "redshift",
            False,
            "./tests/dataset/fixtures/redshift/customer_aliasing_v2.sql",
        ),
        (
            "bigquery",
            False,
            "./tests/dataset/fixtures/bigquery/customer_aliasing_v2.sql",
        ),
        (
            "snowflake",
            False,
            "./tests/dataset/fixtures/snowflake/customer_aliasing_v2.sql",
        ),
        (
            "pg",
            False,
            "./tests/dataset/fixtures/pg/customer_aliasing_v2.sql",
        ),
        (
            "mssql_odbc",
            False,
            "./tests/dataset/fixtures/mssql_odbc/customer_aliasing_v2.sql",
        ),
        (
            "databricks",
            False,
            "./tests/dataset/fixtures/databricks/customer_aliasing_v2.sql",
        ),
        (
            "redshift",
            True,
            "./tests/dataset/fixtures/redshift/customer_aliasing_v2_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            "./tests/dataset/fixtures/bigquery/customer_aliasing_v2_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            "./tests/dataset/fixtures/snowflake/customer_aliasing_v2_partitioned.sql",
        ),
        (
            "pg",
            True,
            "./tests/dataset/fixtures/pg/customer_aliasing_v2_partitioned.sql",
        ),
        (
            "mssql_odbc",
            True,
            "./tests/dataset/fixtures/mssql_odbc/customer_aliasing_v2_partitioned.sql",
        ),
        (
            "databricks",
            True,
            "./tests/dataset/fixtures/databricks/customer_aliasing_v2_partitioned.sql",
        ),
    ],
)
def test_run_customer_aliasing(warehouse_language, manually_partition, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    plan = get_test_plan(mavis, manually_partition=manually_partition)
    expected_sql = get_sql(expected_sql_file)

    current_sql = _run_customer_aliasing_v2(plan, ["alias_slug"], skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)

    return None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, manually_partition, use_annon, expected_sql_file",
    [
        (
            "redshift",
            False,
            False,
            "./tests/dataset/fixtures/redshift/get_remove_list_customer.sql",
        ),
        (
            "bigquery",
            False,
            False,
            "./tests/dataset/fixtures/bigquery/get_remove_list_customer.sql",
        ),
        (
            "snowflake",
            False,
            False,
            "./tests/dataset/fixtures/snowflake/get_remove_list_customer.sql",
        ),
        (
            "pg",
            False,
            False,
            "./tests/dataset/fixtures/pg/get_remove_list_customer.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     False,
        #     "./tests/dataset/fixtures/mysql/get_remove_list_customer.sql",
        # ),
        (
            "mssql_odbc",
            False,
            False,
            "./tests/dataset/fixtures/mssql_odbc/get_remove_list_customer.sql",
        ),
        (
            "databricks",
            False,
            False,
            "./tests/dataset/fixtures/databricks/get_remove_list_customer.sql",
        ),
        (
            "redshift",
            True,
            False,
            "./tests/dataset/fixtures/redshift/get_remove_list_customer_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            False,
            "./tests/dataset/fixtures/bigquery/get_remove_list_customer_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            False,
            "./tests/dataset/fixtures/snowflake/get_remove_list_customer_partitioned.sql",
        ),
        (
            "pg",
            True,
            False,
            "./tests/dataset/fixtures/pg/get_remove_list_customer_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     False,
        #     "./tests/dataset/fixtures/mysql/get_remove_list_customer_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            True,
            False,
            "./tests/dataset/fixtures/mssql_odbc/get_remove_list_customer_partitioned.sql",
        ),
        (
            "databricks",
            True,
            False,
            "./tests/dataset/fixtures/databricks/get_remove_list_customer_partitioned.sql",
        ),
        # all with anon
        (
            "redshift",
            False,
            True,
            "./tests/dataset/fixtures/redshift/get_remove_list_customer_anonn.sql",
        ),
        (
            "bigquery",
            False,
            True,
            "./tests/dataset/fixtures/bigquery/get_remove_list_customer_anonn.sql",
        ),
        (
            "snowflake",
            False,
            True,
            "./tests/dataset/fixtures/snowflake/get_remove_list_customer_anonn.sql",
        ),
        (
            "pg",
            False,
            True,
            "./tests/dataset/fixtures/pg/get_remove_list_customer_anonn.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     True,
        #     "./tests/dataset/fixtures/mysql/get_remove_list_customer_anonn.sql",
        # ),
        (
            "mssql_odbc",
            False,
            True,
            "./tests/dataset/fixtures/mssql_odbc/get_remove_list_customer_anonn.sql",
        ),
        (
            "databricks",
            False,
            True,
            "./tests/dataset/fixtures/databricks/get_remove_list_customer_anonn.sql",
        ),
        (
            "redshift",
            True,
            True,
            "./tests/dataset/fixtures/redshift/get_remove_list_customer_partitioned_anonn.sql",
        ),
        (
            "bigquery",
            True,
            True,
            "./tests/dataset/fixtures/bigquery/get_remove_list_customer_partitioned_anonn.sql",
        ),
        (
            "snowflake",
            True,
            True,
            "./tests/dataset/fixtures/snowflake/get_remove_list_customer_partitioned_anonn.sql",
        ),
        (
            "pg",
            True,
            True,
            "./tests/dataset/fixtures/pg/get_remove_list_customer_partitioned_anonn.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     True,
        #     "./tests/dataset/fixtures/mysql/get_remove_list_customer_partitioned_anonn.sql",
        # ),
        (
            "mssql_odbc",
            True,
            True,
            "./tests/dataset/fixtures/mssql_odbc/get_remove_list_customer_partitioned_anonn.sql",
        ),
        (
            "databricks",
            True,
            True,
            "./tests/dataset/fixtures/databricks/get_remove_list_customer_partitioned_anonn.sql",
        ),
    ],
)
def test_undo_remove_list_query(warehouse_language, manually_partition, use_annon, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    plan = get_test_plan(mavis, manually_partition=manually_partition)
    transform = get_test_transform(mavis)

    (_, remove_process) = get_test_remove_transform(mavis)

    expected_sql = get_sql(expected_sql_file)

    removed_customer_query = _get_the_removed_customers(plan, remove_process, use_annon)

    current_sql = _add_removed_customers(
        mavis,
        transform,
        "2022-01-01",
        removed_customer_query,
        use_annon,
        skip_running=True,
    )

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, manually_partition, days, expected_sql_file",
    [
        (
            "redshift",
            False,
            None,
            "./tests/dataset/fixtures/redshift/get_undo_identitity_resolution.sql",
        ),
        (
            "bigquery",
            False,
            None,
            "./tests/dataset/fixtures/bigquery/get_undo_identitity_resolution.sql",
        ),
        (
            "snowflake",
            False,
            None,
            "./tests/dataset/fixtures/snowflake/get_undo_identitity_resolution.sql",
        ),
        (
            "pg",
            False,
            None,
            "./tests/dataset/fixtures/pg/get_undo_identitity_resolution.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     None,
        #     "./tests/dataset/fixtures/mysql/get_undo_identitity_resolution.sql",
        # ),
        (
            "mssql_odbc",
            False,
            None,
            "./tests/dataset/fixtures/mssql_odbc/get_undo_identitity_resolution.sql",
        ),
        (
            "databricks",
            False,
            None,
            "./tests/dataset/fixtures/databricks/get_undo_identitity_resolution.sql",
        ),
        (
            "redshift",
            True,
            None,
            "./tests/dataset/fixtures/redshift/get_undo_identitity_resolution_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            None,
            "./tests/dataset/fixtures/bigquery/get_undo_identitity_resolution_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            None,
            "./tests/dataset/fixtures/snowflake/get_undo_identitity_resolution_partitioned.sql",
        ),
        (
            "pg",
            True,
            None,
            "./tests/dataset/fixtures/pg/get_undo_identitity_resolution_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     None,
        #     "./tests/dataset/fixtures/mysql/get_undo_identitity_resolution_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            True,
            None,
            "./tests/dataset/fixtures/mssql_odbc/get_undo_identitity_resolution_partitioned.sql",
        ),
        (
            "databricks",
            True,
            None,
            "./tests/dataset/fixtures/databricks/get_undo_identitity_resolution_partitioned.sql",
        ),
        # for days
        (
            "redshift",
            False,
            10,
            "./tests/dataset/fixtures/redshift/get_undo_identitity_resolution_days.sql",
        ),
        (
            "bigquery",
            False,
            10,
            "./tests/dataset/fixtures/bigquery/get_undo_identitity_resolution_days.sql",
        ),
        (
            "snowflake",
            False,
            10,
            "./tests/dataset/fixtures/snowflake/get_undo_identitity_resolution_days.sql",
        ),
        (
            "pg",
            False,
            10,
            "./tests/dataset/fixtures/pg/get_undo_identitity_resolution_days.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     10,
        #     "./tests/dataset/fixtures/mysql/get_undo_identitity_resolution_days.sql",
        # ),
        (
            "mssql_odbc",
            False,
            10,
            "./tests/dataset/fixtures/mssql_odbc/get_undo_identitity_resolution_days.sql",
        ),
        (
            "databricks",
            False,
            10,
            "./tests/dataset/fixtures/databricks/get_undo_identitity_resolution_days.sql",
        ),
        (
            "redshift",
            True,
            10,
            "./tests/dataset/fixtures/redshift/get_undo_identitity_resolution_days_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            10,
            "./tests/dataset/fixtures/bigquery/get_undo_identitity_resolution_days_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            10,
            "./tests/dataset/fixtures/snowflake/get_undo_identitity_resolution_days_partitioned.sql",
        ),
        (
            "pg",
            True,
            10,
            "./tests/dataset/fixtures/pg/get_undo_identitity_resolution_days_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     10,
        #     "./tests/dataset/fixtures/mysql/get_undo_identitity_resolution_days_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            True,
            10,
            "./tests/dataset/fixtures/mssql_odbc/get_undo_identitity_resolution_days_partitioned.sql",
        ),
        (
            "databricks",
            True,
            10,
            "./tests/dataset/fixtures/databricks/get_undo_identitity_resolution_days_partitioned.sql",
        ),
    ],
)
def test_undo_identity_query(warehouse_language, manually_partition, days, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    plan = get_test_plan(mavis, manually_partition=manually_partition)
    (_, remove_process) = get_test_remove_transform(mavis)

    expected_sql = get_sql(expected_sql_file)
    if days:
        from_time = utils.date_add("2022-11-23", "days", -1 * abs(days))
    else:
        from_time = None

    # the undo
    current_sql = undo_identity_resolution(plan, remove_process, from_time, skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, expected_sql_file",
    [
        (
            "redshift",
            "./tests/dataset/fixtures/redshift/insert_regular_insert.sql",
        ),
        (
            "bigquery",
            "./tests/dataset/fixtures/bigquery/insert_regular_insert.sql",
        ),
        (
            "snowflake",
            "./tests/dataset/fixtures/snowflake/insert_regular_insert.sql",
        ),
        (
            "pg",
            "./tests/dataset/fixtures/pg/insert_regular_insert.sql",
        ),
        # (
        #     "mysql",
        #     "./tests/dataset/fixtures/mysql/insert_regular_insert.sql",
        # ),
        (
            "mssql_odbc",
            "./tests/dataset/fixtures/mssql_odbc/insert_regular_insert.sql",
        ),
        (
            "databricks",
            "./tests/dataset/fixtures/databricks/insert_regular_insert.sql",
        ),
    ],
)
def test_regular_inserts(warehouse_language, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    expected_sql = get_sql(expected_sql_file)
    plan = get_test_plan(mavis)

    current_sql = _run_regular_insert(plan, get_test_transform(mavis), skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy

    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, expected_sql_file",
    [
        (
            "redshift",
            "./tests/dataset/fixtures/redshift/delete_extra_identity_resolution.sql",
        ),
        (
            "bigquery",
            "./tests/dataset/fixtures/bigquery/delete_extra_identity_resolution.sql",
        ),
        (
            "snowflake",
            "./tests/dataset/fixtures/snowflake/delete_extra_identity_resolution.sql",
        ),
        (
            "pg",
            "./tests/dataset/fixtures/pg/delete_extra_identity_resolution.sql",
        ),
        # (
        #     "mysql",
        #     "./tests/dataset/fixtures/mysql/delete_extra_identity_resolution.sql",
        # ),
        (
            "mssql_odbc",
            "./tests/dataset/fixtures/mssql_odbc/delete_extra_identity_resolution.sql",
        ),
        (
            "databricks",
            "./tests/dataset/fixtures/databricks/delete_extra_identity_resolution.sql",
        ),
    ],
)
def test_delete_identity(warehouse_language, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    expected_sql = get_sql(expected_sql_file)
    plan = get_test_plan(mavis)

    current_sql = delete_duplicate_identities(plan, skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy

    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, expected_sql_file",
    [
        (
            "redshift",
            "./tests/dataset/fixtures/redshift/insert_mutable_insert.sql",
        ),
        (
            "bigquery",
            "./tests/dataset/fixtures/bigquery/insert_mutable_insert.sql",
        ),
        (
            "snowflake",
            "./tests/dataset/fixtures/snowflake/insert_mutable_insert.sql",
        ),
        (
            "pg",
            "./tests/dataset/fixtures/pg/insert_mutable_insert.sql",
        ),
        # (
        #     "mysql",
        #     "./tests/dataset/fixtures/mysql/insert_mutable_insert.sql",
        # ),
        (
            "mssql_odbc",
            "./tests/dataset/fixtures/mssql_odbc/insert_mutable_insert.sql",
        ),
        (
            "databricks",
            "./tests/dataset/fixtures/databricks/insert_mutable_insert.sql",
        ),
    ],
)
def test_mutable_inserts(warehouse_language, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    expected_sql = get_sql(expected_sql_file)
    plan = get_test_plan(mavis)

    current_sql = run_mutable_insert(plan, get_test_transform(mavis), skip_running=True)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, expected_sql_file",
    [
        (
            "redshift",
            "./tests/dataset/fixtures/redshift/insert_mutable_nightly_diff_insert.sql",
        ),
        (
            "bigquery",
            "./tests/dataset/fixtures/bigquery/insert_mutable_nightly_diff_insert.sql",
        ),
        (
            "snowflake",
            "./tests/dataset/fixtures/snowflake/insert_mutable_nightly_diff_insert.sql",
        ),
        (
            "pg",
            "./tests/dataset/fixtures/pg/insert_mutable_nightly_diff_insert.sql",
        ),
        # (
        #     "mysql",
        #     "./tests/dataset/fixtures/mysql/insert_mutable_nightly_diff_insert.sql",
        # ),
        (
            "mssql_odbc",
            "./tests/dataset/fixtures/mssql_odbc/insert_mutable_nightly_diff_insert.sql",
        ),
        (
            "databricks",
            "./tests/dataset/fixtures/databricks/insert_mutable_nightly_diff_insert.sql",
        ),
    ],
)
def test_mutable_nightly_diff_inserts(warehouse_language, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    expected_sql = get_sql(expected_sql_file)
    plan = get_test_plan(mavis, is_nightly_diff=True)

    current_sql = run_mutable_insert(
        plan,
        get_test_transform(mavis),
        skip_running=True,
    )

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, manually_partition, is_nightly_diff, expected_sql_file",
    [
        (
            "redshift",
            False,
            False,
            "./tests/dataset/fixtures/redshift/cache_column_computation_v2.sql",
        ),
        (
            "bigquery",
            False,
            False,
            "./tests/dataset/fixtures/bigquery/cache_column_computation_v2.sql",
        ),
        (
            "snowflake",
            False,
            False,
            "./tests/dataset/fixtures/snowflake/cache_column_computation_v2.sql",
        ),
        (
            "pg",
            False,
            False,
            "./tests/dataset/fixtures/pg/cache_column_computation_v2.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     False,
        #     "./tests/dataset/fixtures/mysql/cache_column_computation_v2.sql",
        # ),
        (
            "mssql_odbc",
            False,
            False,
            "./tests/dataset/fixtures/mssql_odbc/cache_column_computation_v2.sql",
        ),
        (
            "databricks",
            False,
            False,
            "./tests/dataset/fixtures/databricks/cache_column_computation_v2.sql",
        ),
        (
            "redshift",
            True,
            False,
            "./tests/dataset/fixtures/redshift/cache_column_computation_v2_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            False,
            "./tests/dataset/fixtures/bigquery/cache_column_computation_v2_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            False,
            "./tests/dataset/fixtures/snowflake/cache_column_computation_v2_partitioned.sql",
        ),
        (
            "pg",
            True,
            False,
            "./tests/dataset/fixtures/pg/cache_column_computation_v2_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     False,
        #     "./tests/dataset/fixtures/mysql/cache_column_computation_v2_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            True,
            False,
            "./tests/dataset/fixtures/mssql_odbc/cache_column_computation_v2_partitioned.sql",
        ),
        (
            "databricks",
            True,
            False,
            "./tests/dataset/fixtures/databricks/cache_column_computation_v2_partitioned.sql",
        ),
        (
            "redshift",
            False,
            True,
            "./tests/dataset/fixtures/redshift/cache_column_computation_v2_reconcile.sql",
        ),
        (
            "bigquery",
            False,
            True,
            "./tests/dataset/fixtures/bigquery/cache_column_computation_v2_reconcile.sql",
        ),
        (
            "snowflake",
            False,
            True,
            "./tests/dataset/fixtures/snowflake/cache_column_computation_v2_reconcile.sql",
        ),
        (
            "pg",
            False,
            True,
            "./tests/dataset/fixtures/pg/cache_column_computation_v2_reconcile.sql",
        ),
        # (
        #     "mysql",
        #     False,
        #     True,
        #     "./tests/dataset/fixtures/mysql/cache_column_computation_v2_reconcile.sql",
        # ),
        (
            "mssql_odbc",
            False,
            True,
            "./tests/dataset/fixtures/mssql_odbc/cache_column_computation_v2_reconcile.sql",
        ),
        (
            "databricks",
            False,
            True,
            "./tests/dataset/fixtures/databricks/cache_column_computation_v2_reconcile.sql",
        ),
        (
            "redshift",
            True,
            True,
            "./tests/dataset/fixtures/redshift/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
        (
            "bigquery",
            True,
            True,
            "./tests/dataset/fixtures/bigquery/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
        (
            "snowflake",
            True,
            True,
            "./tests/dataset/fixtures/snowflake/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
        (
            "pg",
            True,
            True,
            "./tests/dataset/fixtures/pg/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
        # (
        #     "mysql",
        #     True,
        #     True,
        #     "./tests/dataset/fixtures/mysql/cache_column_computation_v2_reconcile_partitioned.sql",
        # ),
        (
            "mssql_odbc",
            True,
            True,
            "./tests/dataset/fixtures/mssql_odbc/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
        (
            "databricks",
            True,
            True,
            "./tests/dataset/fixtures/databricks/cache_column_computation_v2_reconcile_partitioned.sql",
        ),
    ],
)
def test_compute_cache_columns_v2(warehouse_language, manually_partition, is_nightly_diff, expected_sql_file):
    mavis = create_mavis(warehouse_language)
    plan = get_test_plan(mavis, is_nightly_diff=is_nightly_diff, manually_partition=manually_partition)
    expected_sql = get_sql(expected_sql_file)

    current_sql = _compute_cache_columns_v2(plan, skip_running=True, is_reconcile=is_nightly_diff)

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.parametrize(
    "warehouse_language, expected_sql_file",
    [
        (
            "redshift",
            "./tests/dataset/fixtures/redshift/test_union_query.sql",
        ),
        (
            "bigquery",
            "./tests/dataset/fixtures/bigquery/test_union_query.sql",
        ),
        (
            "snowflake",
            "./tests/dataset/fixtures/snowflake/test_union_query.sql",
        ),
        (
            "pg",
            "./tests/dataset/fixtures/pg/test_union_query.sql",
        ),
        # (
        #     "mysql",
        #     "./tests/dataset/fixtures/mysql/test_union_query.sql",
        # ),
        (
            "mssql_odbc",
            "./tests/dataset/fixtures/mssql_odbc/test_union_query.sql",
        ),
        (
            "databricks",
            "./tests/dataset/fixtures/databricks/test_union_query.sql",
        ),
    ],
)
def test_activity_query(warehouse_language, expected_sql_file):
    table = "activity_stream"

    mavis = create_mavis(warehouse_language)
    expected_sql = get_sql(expected_sql_file)

    current_sql = mavis.qm.get_activity_table(table, ["test", "slug_pt"], combine_at=1).to_query()

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "warehouse_language, kind, expected_sql_file",
    [
        (
            "redshift",
            None,
            "./tests/dataset/fixtures/redshift/identity_full_check.sql",
        ),
        (
            "bigquery",
            None,
            "./tests/dataset/fixtures/bigquery/identity_full_check.sql",
        ),
        (
            "snowflake",
            None,
            "./tests/dataset/fixtures/snowflake/identity_full_check.sql",
        ),
        (
            "pg",
            None,
            "./tests/dataset/fixtures/pg/identity_full_check.sql",
        ),
        # (
        #     "mysql",
        #     None,
        #     "./tests/dataset/fixtures/mysql/identity_full_check.sql",
        # ),
        (
            "mssql_odbc",
            None,
            "./tests/dataset/fixtures/mssql_odbc/identity_full_check.sql",
        ),
        (
            "databricks",
            None,
            "./tests/dataset/fixtures/databricks/identity_full_check.sql",
        ),
        (
            "redshift",
            "undo_slug",
            "./tests/dataset/fixtures/redshift/identity_full_check_undo_slug.sql",
        ),
        (
            "bigquery",
            "undo_slug",
            "./tests/dataset/fixtures/bigquery/identity_full_check_undo_slug.sql",
        ),
        (
            "snowflake",
            "undo_slug",
            "./tests/dataset/fixtures/snowflake/identity_full_check_undo_slug.sql",
        ),
        (
            "pg",
            "undo_slug",
            "./tests/dataset/fixtures/pg/identity_full_check_undo_slug.sql",
        ),
        # (
        #     "mysql",
        #     "undo_slug",
        #     "./tests/dataset/fixtures/mysql/identity_full_check_undo_slug.sql",
        # ),
        (
            "mssql_odbc",
            "undo_slug",
            "./tests/dataset/fixtures/mssql_odbc/identity_full_check_undo_slug.sql",
        ),
        (
            "databricks",
            "undo_slug",
            "./tests/dataset/fixtures/databricks/identity_full_check_undo_slug.sql",
        ),
        (
            "redshift",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/redshift/identity_full_check_undo_slug_with_days.sql",
        ),
        (
            "bigquery",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/bigquery/identity_full_check_undo_slug_with_days.sql",
        ),
        (
            "snowflake",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/snowflake/identity_full_check_undo_slug_with_days.sql",
        ),
        (
            "pg",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/pg/identity_full_check_undo_slug_with_days.sql",
        ),
        # (
        #     "mysql",
        #     "undo_slug_with_days",
        #     "./tests/dataset/fixtures/mysql/identity_full_check_undo_slug_with_days.sql",
        # ),
        (
            "mssql_odbc",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/mssql_odbc/identity_full_check_undo_slug_with_days.sql",
        ),
        (
            "databricks",
            "undo_slug_with_days",
            "./tests/dataset/fixtures/databricks/identity_full_check_undo_slug_with_days.sql",
        ),
    ],
)
def test_should_full_identity_run(warehouse_language, kind, expected_sql_file):
    table = "activity_stream"

    mavis = create_mavis(warehouse_language)
    qm = mavis.qm
    expected_sql = get_sql(expected_sql_file)

    filt = None
    if kind in ("undo_slug", "undo_slug_with_days"):
        filt = qm.Filter(
            filters=[
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_column="_activity_source"),
                    right=qm.Column(value="undo_slug"),
                )
            ]
        )

        # add handle of days
        if kind == "undo_slug_with_days":
            filt.add_filter(
                mavis.qm.Condition(
                    operator="greater_than",
                    left=mavis.qm.Column(table_column="ts"),
                    right=mavis.qm.Column(value="2022-01-01", casting="timestamp"),
                ),
                "AND",
            )

    current_sql = _should_full_identity_run(
        mavis,
        table,
        add_filt=filt,
        skip_running=True,
    )

    # ONLY FOR AHMED DURING BUILDING
    # DO THIS ONLY in the beginning to make sure we save a copy
    # reset_sql(expected_sql_file, current_sql)
    deal_with_desired_sql(expected_sql, expected_sql_file, current_sql)

    compare_sql(current_sql, expected_sql)


# SOME HELPER FUNCTIONS
def compare_sql(result_sql, expected_sql):
    result_sql_lines = result_sql.strip().split("\n")
    expected_sql_lines = expected_sql.strip().split("\n")

    # go through each line and check them
    for ii, line in enumerate(result_sql_lines):
        if remove_space(line) != remove_space(expected_sql_lines[ii]):
            print(result_sql)
            print(expected_sql_lines[:ii])
        assert remove_space(line) == remove_space(expected_sql_lines[ii]), f"result line: {ii}"


def remove_space(string):
    return " ".join(string.split())


def get_test_transform(mavis):
    example_tranform = get_json("./tests/dataset/fixtures/example_transform.json")
    return GetTransformationForProcessingTransformation(**example_tranform)


def get_test_remove_transform(mavis):
    example_tranform = get_json("./tests/dataset/fixtures/example_remove_transform.json")

    remove_transform = GetTransformationForProcessingTransformation(**example_tranform)

    remove_process = ProcessUpdate(
        transformation_id=remove_transform.id,
        name=remove_transform.name,
        slug=remove_transform.slug,
        activity_slugs=[a.activity.slug for a in remove_transform.activities],
        activity_ids=[a.activity_id for a in remove_transform.activities],
    )

    return remove_transform, remove_process


def get_test_plan(mavis, is_nightly_diff=False, manually_partition=False):
    example_tranform = get_json("./tests/dataset/fixtures/example_graph_transformation.json")
    transform = TransformationIndexWDependencyAllTransformations(**example_tranform)
    plan = Plan(
        mavis,
        [transform],
        "activity_stream",
        kind=transformation_kinds_enum.stream,
        manually_partition=manually_partition,
    )

    process = plan.get(transform.id)
    process.apply_mutable_time = is_nightly_diff
    process.from_sync_time = "2021-11-03"
    process.to_sync_time = "2022-05-18T23:19:49.117237"
    process.rows_inserted = 19
    return plan


def create_mavis(warehouse_language, manually_partition=False):
    # set up the company
    company_args = deepcopy(partial_company_args)
    company_args["warehouse_language"] = warehouse_language

    for t in company_args["tables"]:
        t["manually_partition_activity"] = manually_partition

    company = Company(**company_args)

    # create mavis
    mavis: Mavis = company.mavis()

    # mock processing config for test
    mavis._config = MavisConfig()
    return mavis


def get_sql(expected_sql_file):
    try:
        with open(expected_sql_file) as f:
            expected_sql = f.read()
    except Exception:
        expected_sql = None

    return expected_sql


def get_json(json_file):
    with open(json_file) as f:
        json_output = json.load(f)
    return json_output


def deal_with_desired_sql(desired_sql, desired_sql_path, basic_query):
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(desired_sql_path), exist_ok=True)

    if desired_sql is None:
        with open(desired_sql_path, "w") as f:
            f.write(basic_query)


def reset_sql(desired_sql_path, basic_query):
    # save the file if it doesn't exists
    with open(desired_sql_path, "w") as f:
        f.write(basic_query)
