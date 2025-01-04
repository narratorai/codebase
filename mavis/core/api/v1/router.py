from fastapi import APIRouter

from .activities.endpoints import router as activities_router
from .api_keys.endpoints import router as api_keys_router
from .create_dataset.endpoints import router as create_dataset_router
from .customer_journey.endpoints import router as customer_journey_router
from .dataset.endpoints import router as dataset_router
from .dataset_explore.endpoints import router as dataset_explore_router
from .dataset_plot.endpoints import router as dataset_plot_router
from .documentation.endpoints import router as documentation_router
from .endpoints import block, narrative_content, narrative_template, test
from .endpoints.admin import admin_blocks, billing, company, github, user
from .endpoints.admin import query as admin_query
from .endpoints.admin import task as admin_task
from .endpoints.admin import transformation as admin_transformation
from .endpoints.admin.onboarding.endpoints import router as onboarding_router
from .flags.endpoints import router as flags_router
from .narrative.endpoints import router as narrative_router
from .query.endpoints import router as query_router
from .task_tracker.endpoints import router as task_tracker_router

router = APIRouter()

router.include_router(test.router)
router.include_router(create_dataset_router)
router.include_router(customer_journey_router)
router.include_router(dataset_explore_router)
router.include_router(dataset_plot_router)
router.include_router(dataset_router)
router.include_router(query_router)
router.include_router(block.router)
router.include_router(task_tracker_router)
router.include_router(activities_router)
router.include_router(narrative_router)
router.include_router(narrative_template.router)
router.include_router(narrative_content.router)
router.include_router(flags_router)
router.include_router(documentation_router)
router.include_router(api_keys_router)

# admin routes
admin_router = APIRouter()

admin_router.include_router(admin_query.router)
admin_router.include_router(company.router)
admin_router.include_router(user.router)
admin_router.include_router(admin_task.router)
admin_router.include_router(admin_blocks.router)
admin_router.include_router(admin_transformation.router)
admin_router.include_router(github.router)
admin_router.include_router(billing.router)
admin_router.include_router(onboarding_router)
