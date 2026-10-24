"""Pydantic schemas module."""
from pydantic import BaseModel
from app.schemas.load_balancer import (
    LoadBalancerConfigSchema,
    LoadBalancerResultSchema,
    ServerMetrics,
    UpstreamServerConfig,
)
from app.schemas.load_test import (
    LoadTestConfigSchema,
    LoadTestHistoryResponseSchema,
    LoadTestMetricsResponseSchema,
)
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
    "LoadTestConfigSchema",
    "LoadTestMetricsResponseSchema",
    "LoadTestHistoryResponseSchema",
    "UpstreamServerConfig",
    "LoadBalancerConfigSchema",
    "ServerMetrics",
    "LoadBalancerResultSchema",
]
