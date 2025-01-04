from fastapi import APIRouter

from .customer_journey.endpoints import router as customer_journey_router

router = APIRouter()


router.include_router(customer_journey_router)
