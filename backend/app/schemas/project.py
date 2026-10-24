from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SavedEndpointCreate(BaseModel):
    """Schema for adding an endpoint to a project collection."""
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the endpoint")
    method: str = Field(default="GET", description="HTTP method (GET, POST, PUT, DELETE, PATCH)")
    path: str = Field(..., description="Endpoint path (e.g., /api/v1/users)")
    headers: Optional[Dict[str, Any]] = Field(default=None, description="Default headers")
    body: Optional[Any] = Field(default=None, description="Default JSON payload body")

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        upper = v.strip().upper()
        allowed = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
        if upper not in allowed:
            raise ValueError(f"Method must be one of: {', '.join(sorted(allowed))}")
        return upper


class SavedEndpointUpdate(BaseModel):
    """Schema for updating an existing saved endpoint."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    method: Optional[str] = Field(default=None)
    path: Optional[str] = Field(default=None)
    headers: Optional[Dict[str, Any]] = Field(default=None)
    body: Optional[Any] = Field(default=None)

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        upper = v.strip().upper()
        allowed = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
        if upper not in allowed:
            raise ValueError(f"Method must be one of: {', '.join(sorted(allowed))}")
        return upper


class SavedEndpointResponse(BaseModel):
    """Schema returning stored endpoint details."""
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    method: str
    path: str
    headers: Optional[Dict[str, Any]] = None
    body: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectCreate(BaseModel):
    """Schema for creating a new project workspace."""
    name: str = Field(..., min_length=1, max_length=100, description="Project or workspace name")
    description: Optional[str] = Field(default=None, description="Optional project description")
    base_url: Optional[str] = Field(default=None, description="Base API URL for all endpoints in collection")


class ProjectUpdate(BaseModel):
    """Schema for updating project workspace metadata."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None)
    base_url: Optional[str] = Field(default=None)


class ProjectResponse(BaseModel):
    """Schema returning project details along with saved endpoint collection."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    base_url: Optional[str] = None
    created_at: datetime
    endpoints: List[SavedEndpointResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
