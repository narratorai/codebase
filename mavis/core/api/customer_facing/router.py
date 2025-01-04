from fastapi import APIRouter

from .accesses.endpoints import router as access_router
from .activities.endpoints import router as activities_router
from .analyses import router as analyses_router
from .attachments.endpoints import router as attachments_router
from .chats.endpoints import router as chats_router
from .companies.endpoints import router as companies_router
from .dashboards import router as dashboards_router
from .datasets.endpoints import router as dataset_router
from .journeys.endpoints import router as customer_journey_router
from .reports.endpoints import router as reports_router
from .sql.endpoints import router as sql_router
from .tables.endpoints import router as table_router
from .tags.endpoints import router as tag_router
from .tasks.endpoints import router as tasks_router
from .teams.endpoints import router as team_router
from .tracking.endpoints import router as tracking_router
from .transformations.endpoints import router as transformations_router
from .users.endpoints import router as users_router
from .warehouses.endpoints import router as warehouse_router

router = APIRouter()
router.include_router(attachments_router)
router.include_router(chats_router)
router.include_router(activities_router)
router.include_router(dataset_router)
router.include_router(team_router)
router.include_router(companies_router)
router.include_router(users_router)
router.include_router(access_router)
router.include_router(tag_router)
router.include_router(table_router)
router.include_router(customer_journey_router)
router.include_router(warehouse_router)
router.include_router(transformations_router)
router.include_router(reports_router)
router.include_router(tasks_router)
router.include_router(sql_router)
router.include_router(tracking_router)

# TODO: Deprecate
router.include_router(analyses_router)
router.include_router(dashboards_router)
