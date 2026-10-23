"""Pydantic schemas module."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app: str


__all__ = ["HealthResponse"]
