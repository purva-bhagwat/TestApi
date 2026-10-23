import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TestRun(Base):
    """
    Model representing an individual API test execution and its captured response metrics.
    """
    __tablename__ = "test_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    headers: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    query_params: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    response_headers: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    response_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<TestRun(id={self.id}, method='{self.method}', url='{self.url}', status={self.status_code})>"
