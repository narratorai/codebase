# from contextlib import nullcontext as does_not_raise

import pytest

from core.logger import get_logger
from core.models.company import Company

logger = get_logger().new()

base_valid_company_args = {
    "slug": "test",
    "id": "1",
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
}


@pytest.mark.parametrize(
    "args, expectation",
    [
        ({}, pytest.raises(KeyError)),
        # (
        #     {
        #         "slug": "test",
        #         "production_schema": "test_schema",
        #         "updated_at": "2022-01-01T00:00:00",
        #         "resources": {
        #             "company_role": "AIDAJQABLZS4A3QDU576Q",
        #             "s3_bucket": "test_company_s3_bucket",
        #             "kms_key": "test_company_kms_key",
        #         },
        #         "current_user": {
        #             "id": "1",
        #             "email": "test@test.com",
        #             "tags": {"favorite": None, "recently_viewed": None},
        #             "is_internal_admin": True,
        #             "is_admin": True,
        #             "company": {
        #                 "id": "1",
        #                 "slug": "test",
        #                 "name": "TEST COMPANY",
        #                 "admin_team_id": "aa",
        #                 "everyone_team_id": "fe",
        #                 "auth0_org_id": "",
        #             },
        #         },
        #     }
        # ),
        # (base_valid_company_args, does_not_raise()),
    ],
)
def test_company_init(args, expectation):
    with expectation:
        Company(**args)


# def test_company_mavis():
#     company = Company(**base_valid_company_args)

#     mavis = company.mavis()

#     assert mavis is not None
#     assert mavis.company == company
