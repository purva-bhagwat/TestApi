from typing import Dict, List, Literal
from pydantic import BaseModel, Field, field_validator


class UpstreamServerConfig(BaseModel):
    """Configuration for an individual upstream backend server."""
    url: str = Field(..., description="Target server base URL (must start with http:// or https://)")
    weight: int = Field(default=1, ge=1, le=10, description="Routing weight for weighted round-robin (1-10)")
    is_healthy: bool = Field(default=True, description="Health status of the upstream server")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        trimmed = v.strip()
        if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
            raise ValueError("Upstream server URL must start with http:// or https://")
        return trimmed


class LoadBalancerConfigSchema(BaseModel):
    """Schema for configuring a load-balanced simulation run."""
    servers: List[UpstreamServerConfig] = Field(
        ...,
        min_length=2,
        max_length=6,
        description="Pool of upstream servers (minimum 2, maximum 6)",
    )
    algorithm: Literal["round_robin", "weighted_round_robin", "least_connections"] = Field(
        default="round_robin",
        description="Load balancing routing algorithm",
    )
    concurrent_users: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Simulated concurrent virtual users",
    )
    total_requests: int = Field(
        default=50,
        ge=1,
        le=1000,
        description="Total requests dispatched in this simulation",
    )
    timeout_seconds: float = Field(
        default=5.0,
        gt=0,
        le=60.0,
        description="Per-request timeout limit in seconds",
    )

    @field_validator("servers")
    @classmethod
    def validate_servers(cls, servers: List[UpstreamServerConfig]) -> List[UpstreamServerConfig]:
        healthy_count = sum(1 for s in servers if s.is_healthy)
        if healthy_count == 0:
            raise ValueError("At least one upstream server must be marked as healthy (is_healthy=True).")
        return servers


class ServerMetrics(BaseModel):
    """Performance telemetry and request counts allocated to an upstream server."""
    url: str
    total_dispatched: int
    success_count: int
    failure_count: int
    avg_latency_ms: float


class LoadBalancerResultSchema(BaseModel):
    """Aggregated outcome of a simulated load balancing batch."""
    algorithm: str
    total_requests: int
    total_duration_seconds: float
    overall_rps: float
    server_distribution: Dict[str, ServerMetrics]
