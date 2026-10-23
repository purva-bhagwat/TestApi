from fastapi import APIRouter
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def health_check() -> HealthResponse:
    """
    Health check endpoint to verify backend service status.
    """
    return HealthResponse(
        status="ok",
        app="API Performance Platform"
    )
