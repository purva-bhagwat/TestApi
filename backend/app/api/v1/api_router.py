from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    health,
    load_balancer,
    load_runner,
    projects,
    sample_target,
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
api_router.include_router(
    sample_target.router, prefix="/mock-target", tags=["Self-Hosted Mock Target"]
)
api_router.include_router(
    projects.router, prefix="/projects", tags=["Projects & Collections"]
)
api_router.include_router(
    analytics.router, prefix="/analytics", tags=["Analytics & History"]
)
api_router.include_router(
    analytics.router, prefix="/history", tags=["Analytics & History"]
)
