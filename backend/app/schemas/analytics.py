from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class UnifiedHistoryItem(BaseModel):
    """Normalized test execution record across Single, Load, and Balancer engines."""
    id: str
    test_type: str = Field(..., description="single, load, or balancer")
    timestamp: datetime
    url: str
    target_urls: Optional[List[str]] = None
    method: str
    status: str
    status_code: Optional[int] = None
    duration_seconds: Optional[float] = None
    latency_avg_ms: Optional[float] = None
    p50_ms: Optional[float] = None
    p90_ms: Optional[float] = None
    p95_ms: Optional[float] = None
    p99_ms: Optional[float] = None
    concurrency: Optional[int] = None
    total_requests: Optional[int] = None
    success_count: Optional[int] = None
    failure_count: Optional[int] = None
    success_rate: Optional[float] = None
    rps: Optional[float] = None
    project_id: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedHistoryResponse(BaseModel):
    """Paginated list of historical test runs."""
    items: List[UnifiedHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class MetricComparison(BaseModel):
    """Differential metrics comparing two benchmark runs."""
    delta_rps: float
    pct_rps_diff: float
    delta_p50_ms: Optional[float] = None
    pct_p50_diff: Optional[float] = None
    delta_p90_ms: Optional[float] = None
    pct_p90_diff: Optional[float] = None
    delta_p99_ms: Optional[float] = None
    pct_p99_diff: Optional[float] = None
    delta_error_rate: float
    delta_duration_seconds: float
    verdict: Literal["improved", "regressed", "equivalent"]
    summary: str


class RunComparisonResponse(BaseModel):
    """Comprehensive comparison report between baseline Run A and target Run B."""
    run_a: UnifiedHistoryItem
    run_b: UnifiedHistoryItem
    comparison: MetricComparison
