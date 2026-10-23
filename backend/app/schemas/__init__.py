"""Pydantic schemas module."""
from pydantic import BaseModel
from app.schemas.test_run import (
    TestHistoryResponseSchema,
    TestRunCreateSchema,
    TestRunResponseSchema,
)


class HealthResponse(BaseModel):
    status: str
    app: str


__all__ = [
    "HealthResponse",
    "TestRunCreateSchema",
    "TestRunResponseSchema",
    "TestHistoryResponseSchema",
]
