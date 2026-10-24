import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, Float, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LoadTestRun(Base):
    """
    Model representing a stress / load testing session and aggregated performance percentiles.
    """
    __tablename__ = "load_test_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    target_urls: Mapped[List[str]] = mapped_column(JSONB, nullable=False)
    concurrency: Mapped[int] = mapped_column(Integer, nullable=False)
    total_requests: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failure_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    p50_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p90_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p95_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p99_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status_distribution: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Computed properties to match LoadTestMetricsResponseSchema
    @property
    def url(self) -> str:
        return self.target_urls[0] if self.target_urls else ""

    @property
    def method(self) -> str:
        if self.status_distribution and "_method" in self.status_distribution:
            return str(self.status_distribution["_method"])
        return "GET"

    @property
    def status(self) -> str:
        if self.status_distribution and "_status" in self.status_distribution:
            return str(self.status_distribution["_status"])
        return "completed" if self.failure_count < self.total_requests else "failed"

    @property
    def successful_requests(self) -> int:
        return self.success_count

    @property
    def failed_requests(self) -> int:
        return self.failure_count

    @property
    def rps(self) -> float:
        if self.status_distribution and "_rps" in self.status_distribution:
            return float(self.status_distribution["_rps"])
        if self.duration_seconds > 0:
            return round(self.success_count / self.duration_seconds, 2)
        return 0.0

    @property
    def avg_latency_ms(self) -> Optional[float]:
        if self.status_distribution and "_avg_latency_ms" in self.status_distribution:
            return float(self.status_distribution["_avg_latency_ms"])
        return self.p50_ms

    @property
    def min_latency_ms(self) -> Optional[float]:
        if self.status_distribution and "_min_latency_ms" in self.status_distribution:
            return float(self.status_distribution["_min_latency_ms"])
        return None

    @property
    def max_latency_ms(self) -> Optional[float]:
        if self.status_distribution and "_max_latency_ms" in self.status_distribution:
            return float(self.status_distribution["_max_latency_ms"])
        return None

    @property
    def p50_latency_ms(self) -> Optional[float]:
        return self.p50_ms

    @property
    def p90_latency_ms(self) -> Optional[float]:
        return self.p90_ms

    @property
    def p99_latency_ms(self) -> Optional[float]:
        return self.p99_ms

    @property
    def status_code_distribution(self) -> Dict[str, int]:
        if not self.status_distribution:
            return {}
        return {
            str(k): int(v)
            for k, v in self.status_distribution.items()
            if not str(k).startswith("_")
        }

    def __repr__(self) -> str:
        return (
            f"<LoadTestRun(id={self.id}, concurrency={self.concurrency}, "
            f"requests={self.total_requests}, duration={self.duration_seconds}s)>"
        )
