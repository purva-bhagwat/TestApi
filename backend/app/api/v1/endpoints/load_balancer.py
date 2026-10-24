from fastapi import APIRouter, HTTPException, status

from app.schemas.load_balancer import (
    LoadBalancerConfigSchema,
    LoadBalancerResultSchema,
)
from app.services.load_balancer import execute_load_balanced_test

router = APIRouter()


@router.post(
    "/simulate",
    response_model=LoadBalancerResultSchema,
    status_code=status.HTTP_200_OK,
    summary="Simulate Load Balancer Routing",
    description="Dispatches a concurrent batch across upstream servers using Round-Robin, Weighted Round-Robin, or Least Connections.",
)
async def simulate_load_balancer(
    config: LoadBalancerConfigSchema,
) -> LoadBalancerResultSchema:
    # Verify at least one server is healthy
    healthy_servers = [s for s in config.servers if s.is_healthy]
    if not healthy_servers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No healthy upstream servers available for routing.",
        )

    result = await execute_load_balanced_test(config)
    return LoadBalancerResultSchema(**result)
