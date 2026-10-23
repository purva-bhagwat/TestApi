import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.test_run import TestRun
from app.schemas.test_run import TestRunCreateSchema, TestRunResponseSchema
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
