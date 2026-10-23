from datetime import datetime
from typing import Any, Dict, Optional, Union
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TestRunCreateSchema(BaseModel):
    """Schema for requesting a single API endpoint test run."""
    url: str = Field(..., description="Target API endpoint URL (must start with http:// or https://)")
    method: str = Field(default="GET", description="HTTP method (GET, POST, PUT, DELETE, PATCH)")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Custom request headers")
    query_params: Optional[Dict[str, str]] = Field(default=None, description="URL query parameters")
    body: Optional[Union[str, Dict[str, Any]]] = Field(default=None, description="Request payload body")
    timeout_seconds: float = Field(default=30.0, gt=0, le=300.0, description="Request timeout in seconds")

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


class TestRunResponseSchema(BaseModel):
    """Schema for returning completed test run records."""
    id: uuid.UUID
    url: str
    method: str
    headers: Optional[Dict[str, Any]] = None
    query_params: Optional[Dict[str, Any]] = None
    body: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    response_headers: Optional[Dict[str, Any]] = None
    response_body: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
