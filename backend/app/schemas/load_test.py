from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LoadTestConfigSchema(BaseModel):
    """Schema for configuring and starting a concurrent load test."""
    url: str = Field(..., description="Target endpoint URL (must start with http:// or https://)")
    method: str = Field(default="GET", description="HTTP method (GET, POST, PUT, DELETE, PATCH)")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Custom request headers")
    body: Optional[Union[str, Dict[str, Any]]] = Field(default=None, description="Request payload body")
    concurrent_users: int = Field(default=10, ge=1, le=200, description="Virtual concurrent users / concurrency limit")
    total_requests: int = Field(default=100, ge=1, le=5000, description="Total requests to dispatch")
    timeout_seconds: float = Field(default=10.0, gt=0, le=120.0, description="Timeout per request in seconds")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        trimmed = v.strip()
        if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return trimmed

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        upper = v.strip().upper()
        allowed = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
        if upper not in allowed:
            raise ValueError(f"Method '{v}' is not supported. Must be one of: {', '.join(sorted(allowed))}")
        return upper


class LoadTestMetricsResponseSchema(BaseModel):
    """Schema returning detailed load test performance metrics and percentiles."""
    id: uuid.UUID
    url: str
    method: str
    status: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    rps: float
    avg_latency_ms: Optional[float] = None
    min_latency_ms: Optional[float] = None
    max_latency_ms: Optional[float] = None
    p50_latency_ms: Optional[float] = None
    p90_latency_ms: Optional[float] = None
    p99_latency_ms: Optional[float] = None
    status_code_distribution: Dict[str, int] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoadTestHistoryResponseSchema(BaseModel):
    """Schema for paginated load test history."""
    items: List[LoadTestMetricsResponseSchema]
    total: int
