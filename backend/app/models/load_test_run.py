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
    status_distribution: Mapped[Optional[Dict[str, int]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<LoadTestRun(id={self.id}, concurrency={self.concurrency}, "
            f"requests={self.total_requests}, duration={self.duration_seconds}s)>"
        )
