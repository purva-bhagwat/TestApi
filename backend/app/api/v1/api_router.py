from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    load_balancer,
    load_runner,
    test_runner,
)

api_router = APIRouter()

# Include endpoint sub-routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(test_runner.router, prefix="/test", tags=["Test Runner"])
api_router.include_router(load_runner.router, prefix="/load-test", tags=["Load Test Runner"])
api_router.include_router(
    load_balancer.router, prefix="/load-balancer", tags=["Load Balancer Simulator"]
)
