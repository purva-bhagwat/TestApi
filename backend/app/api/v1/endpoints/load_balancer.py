from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.load_test_run import LoadTestRun
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
    db: AsyncSession = Depends(get_db),
) -> LoadBalancerResultSchema:
    # Verify at least one server is healthy
    healthy_servers = [s for s in config.servers if s.is_healthy]
    if not healthy_servers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No healthy upstream servers available for routing.",
        )

    result = await execute_load_balanced_test(config)

    # Persist simulation run to load_test_runs table
    try:
        total_success = sum(m["success_count"] for m in result["server_distribution"].values())
        total_failure = sum(m["failure_count"] for m in result["server_distribution"].values())
        latencies = [
            m["avg_latency_ms"]
            for m in result["server_distribution"].values()
            if m["avg_latency_ms"] > 0
        ]
        avg_lat = round(sum(latencies) / len(latencies), 2) if latencies else None

        balancer_run = LoadTestRun(
            target_urls=[s.url for s in config.servers],
            concurrency=config.concurrent_users,
            total_requests=config.total_requests,
            duration_seconds=result["total_duration_seconds"],
            success_count=total_success,
            failure_count=total_failure,
            p50_ms=avg_lat,
            p90_ms=avg_lat,
            p95_ms=avg_lat,
            p99_ms=avg_lat,
            status_distribution={
                "_type": "balancer",
                "_algorithm": config.algorithm,
                "_rps": result["overall_rps"],
                "_avg_latency_ms": avg_lat,
                "_method": "GET",
                "_status": "completed" if total_failure < config.total_requests else "failed",
            },
        )
        db.add(balancer_run)
        await db.commit()
    except Exception:
        await db.rollback()

    return LoadBalancerResultSchema(**result)
