import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.test_run import TestRun
from app.schemas.test_run import (
    TestHistoryResponseSchema,
    TestRunCreateSchema,
    TestRunResponseSchema,
)
from app.services.executor import execute_single_request

router = APIRouter()


@router.post(
    "/single",
    response_model=TestRunResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Single API Test",
    description="Dispatches an HTTP request, tracks performance telemetry, stores the result, and returns execution metrics.",
)
async def run_single_api_test(
    payload: TestRunCreateSchema,
    db: AsyncSession = Depends(get_db),
) -> TestRun:
    # 1. Execute HTTP request via executor service
    execution_result = await execute_single_request(payload)

    # 2. Persist record into database
    test_run = TestRun(**execution_result)
    try:
        db.add(test_run)
        await db.commit()
        await db.refresh(test_run)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving test run: {str(exc)}",
        )

    return test_run


@router.get(
    "/history",
    response_model=TestHistoryResponseSchema,
    summary="Get Historical Test Runs",
    description="Returns a paginated list of previous test runs ordered from newest to oldest.",
)
async def get_test_history(
    limit: int = Query(default=20, ge=1, le=100, description="Items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    db: AsyncSession = Depends(get_db),
) -> TestHistoryResponseSchema:
    # 1. Get total count
    count_query = select(func.count()).select_from(TestRun)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    # 2. Get paginated items
    runs_query = (
        select(TestRun)
        .order_by(TestRun.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(runs_query)
    items = result.scalars().all()

    return TestHistoryResponseSchema(items=list(items), total=total)


@router.delete(
    "/history",
    summary="Clear Test History",
    description="Removes all previous test runs from the database.",
)
async def clear_test_history(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    try:
        await db.execute(delete(TestRun))
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear history: {str(exc)}",
        )

    return {"message": "History cleared successfully"}


@router.get(
    "/{run_id}",
    response_model=TestRunResponseSchema,
    summary="Get Single Test Run by ID",
    description="Fetches a historical single API test execution record by UUID.",
)
async def get_test_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> TestRun:
    query = select(TestRun).where(TestRun.id == run_id)
    result = await db.execute(query)
    test_run = result.scalar_one_or_none()

    if test_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test run with ID '{run_id}' not found.",
        )

    return test_run
