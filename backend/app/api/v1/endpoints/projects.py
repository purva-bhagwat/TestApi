import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.project import Project, SavedEndpoint
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    SavedEndpointCreate,
    SavedEndpointResponse,
    SavedEndpointUpdate,
)

router = APIRouter()


# -----------------------------------------------------------------------------
# Project Endpoints
# -----------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="List all projects",
    description="Returns all workspace projects and their saved endpoint collections ordered by creation date.",
)
async def list_projects(
    db: AsyncSession = Depends(get_db),
) -> List[Project]:
    stmt = (
        select(Project)
        .options(selectinload(Project.endpoints))
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()
    return list(projects)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project workspace",
    description="Creates a new workspace collection with optional base_url and description.",
)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
) -> Project:
    project = Project(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        base_url=payload.base_url.strip() if payload.base_url else None,
    )
    try:
        db.add(project)
        await db.commit()
        await db.refresh(project)
        # Explicitly ensure endpoints relationship is initialized
        stmt = (
            select(Project)
            .options(selectinload(Project.endpoints))
            .where(Project.id == project.id)
        )
        res = await db.execute(stmt)
        return res.scalar_one()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating project: {str(exc)}",
        )


# -----------------------------------------------------------------------------
# Saved Endpoint-Specific Routes (declared BEFORE `/{project_id}` routes)
# -----------------------------------------------------------------------------

@router.delete(
    "/endpoints/{endpoint_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a saved endpoint",
    description="Deletes an individual saved endpoint from its parent project.",
)
async def delete_saved_endpoint(
    endpoint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    stmt = select(SavedEndpoint).where(SavedEndpoint.id == endpoint_id)
    result = await db.execute(stmt)
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved endpoint with ID '{endpoint_id}' was not found.",
        )

    try:
        await db.delete(endpoint)
        await db.commit()
        return {
            "message": "Saved endpoint deleted successfully",
            "id": str(endpoint_id),
        }
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while deleting endpoint: {str(exc)}",
        )


@router.patch(
    "/endpoints/{endpoint_id}",
    response_model=SavedEndpointResponse,
    summary="Update a saved endpoint",
    description="Updates fields on a saved endpoint.",
)
async def update_saved_endpoint(
    endpoint_id: uuid.UUID,
    payload: SavedEndpointUpdate,
    db: AsyncSession = Depends(get_db),
) -> SavedEndpoint:
    stmt = select(SavedEndpoint).where(SavedEndpoint.id == endpoint_id)
    result = await db.execute(stmt)
    endpoint = result.scalar_one_or_none()
    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved endpoint with ID '{endpoint_id}' was not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(endpoint, field, value)

    try:
        db.add(endpoint)
        await db.commit()
        await db.refresh(endpoint)
        return endpoint
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while updating endpoint: {str(exc)}",
        )


# -----------------------------------------------------------------------------
# Project Parameterized Routes
# -----------------------------------------------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details",
    description="Returns project details along with its complete collection of saved endpoints.",
)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Project:
    stmt = (
        select(Project)
        .options(selectinload(Project.endpoints))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' was not found.",
        )
    return project


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project metadata",
    description="Updates name, description, or base_url of an existing project.",
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> Project:
    stmt = (
        select(Project)
        .options(selectinload(Project.endpoints))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' was not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    try:
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while updating project: {str(exc)}",
        )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a project",
    description="Deletes a project workspace and cascades deletion to all its saved endpoints.",
)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' was not found.",
        )

    try:
        await db.delete(project)
        await db.commit()
        return {
            "message": "Project and associated endpoints deleted successfully",
            "id": str(project_id),
        }
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while deleting project: {str(exc)}",
        )


@router.post(
    "/{project_id}/endpoints",
    response_model=SavedEndpointResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a new endpoint under a project",
    description="Appends a new saved endpoint with HTTP method, path, headers, and body to the project collection.",
)
async def create_saved_endpoint(
    project_id: uuid.UUID,
    payload: SavedEndpointCreate,
    db: AsyncSession = Depends(get_db),
) -> SavedEndpoint:
    # 1. Verify project exists
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot add endpoint: Project with ID '{project_id}' was not found.",
        )

    # 2. Create saved endpoint record
    endpoint = SavedEndpoint(
        project_id=project_id,
        name=payload.name.strip(),
        method=payload.method,
        path=payload.path.strip(),
        headers=payload.headers if payload.headers is not None else {},
        body=payload.body,
    )
    try:
        db.add(endpoint)
        await db.commit()
        await db.refresh(endpoint)
        return endpoint
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving endpoint: {str(exc)}",
        )
