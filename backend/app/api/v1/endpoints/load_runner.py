import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.load_test_run import LoadTestRun
from app.schemas.load_test import (
    LoadTestConfigSchema,
    LoadTestHistoryResponseSchema,
    LoadTestMetricsResponseSchema,
)
from app.services.load_engine import execute_load_test

router = APIRouter()


@router.post(
    "/start",
    response_model=LoadTestMetricsResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Concurrent Load Test",
    description="Dispatches concurrent asynchronous load tests against a target URL, records percentiles, and persists the run.",
)
async def start_load_test(
    config: LoadTestConfigSchema,
    db: AsyncSession = Depends(get_db),
) -> LoadTestRun:
    # 1. Execute load test via engine service
    result_data = await execute_load_test(config)

    # 2. Persist record to PostgreSQL
    load_run = LoadTestRun(**result_data)
    try:
        db.add(load_run)
        await db.commit()
        await db.refresh(load_run)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving load test run: {str(exc)}",
        )

    return load_run


@router.get(
    "/history",
    response_model=LoadTestHistoryResponseSchema,
    summary="Get Historical Load Test Runs",
    description="Returns a paginated list of historical load test sessions ordered from newest to oldest.",
)
async def get_load_test_history(
    limit: int = Query(default=20, ge=1, le=100, description="Items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    db: AsyncSession = Depends(get_db),
) -> LoadTestHistoryResponseSchema:
    count_query = select(func.count()).select_from(LoadTestRun)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    runs_query = (
        select(LoadTestRun)
        .order_by(LoadTestRun.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(runs_query)
    items = result.scalars().all()

    return LoadTestHistoryResponseSchema(items=list(items), total=total)


@router.get(
    "/{run_id}",
    response_model=LoadTestMetricsResponseSchema,
    summary="Get Load Test Run Details",
    description="Fetches a specific load test execution record and performance metrics by UUID.",
)
async def get_load_test_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> LoadTestRun:
    query = select(LoadTestRun).where(LoadTestRun.id == run_id)
    result = await db.execute(query)
    load_run = result.scalar_one_or_none()

    if load_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Load test run with ID '{run_id}' not found.",
        )

    return load_run
