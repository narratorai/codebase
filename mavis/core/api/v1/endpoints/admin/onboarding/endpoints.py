from fastapi import APIRouter, Depends

from batch_jobs.data_bridging.run_onboarding import run_onboarding, update_onboarding
from core.api.auth import get_current_company, get_mavis
from core.api.v1.endpoints.admin.onboarding.models import (
    OnboardingStarted,
    QueryMapping,
    QueryTemplateSources,
)
from core.graph import graph_client
from core.models.company import Company
from core.v4.mavis import Mavis

router = APIRouter(prefix="/onboarding", tags=["admin", "onboarding"])


@router.get("/sources", response_model=QueryTemplateSources)
async def get_sources(mavis: Mavis = Depends(get_mavis)):
    """Get the sources."""

    query_templates = graph_client.get_query_template_sources().query_templates

    schemas = mavis.get_warehouse_schema()
    mappings = []

    for q in query_templates:
        for s in (q.schema_names or "").split(","):
            if s in schemas.schemas:
                mappings.append(dict(schema_name=s, data_source=q.data_source))

    return dict(
        data_sources=[qt.data_source for qt in query_templates],
        schemas=schemas,
        mappings=mappings,
    )


@router.post("/run", response_model=OnboardingStarted)
async def run_onboarding_mapping(input: QueryMapping, company: Company = Depends(get_current_company)):
    """Start the onboarding process"""
    update_onboarding(company, input)

    # trigger the onboarding process
    run_onboarding.send()

    trans = []
    used_names = set()

    for m in input.mappings:
        query_template = graph_client.get_query_templates_for_source(data_source=m.data_source).query_template

        for qt in query_template:
            name = qt.transformation_name.split("||")[0]
            if name not in used_names:
                used_names.add(name)
                trans.append(dict(name=name, kind=qt.transformation_kind))

    return dict(transformations=trans, show_narrative=True)
