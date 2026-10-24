"""Create projects and saved_endpoints tables

Revision ID: 0002_projects_endpoints
Revises: 0001_initial_tables
Create Date: 2026-10-24 15:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_projects_endpoints"
down_revision: Union[str, None] = "0001_initial_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create projects table if it doesn't already exist
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("base_url", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False, if_not_exists=True)

    # 2. Create saved_endpoints table if it doesn't already exist
    op.create_table(
        "saved_endpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("method", sa.String(length=10), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("headers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_saved_endpoints_project_id_projects",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_saved_endpoints_id"), "saved_endpoints", ["id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_saved_endpoints_project_id"), "saved_endpoints", ["project_id"], unique=False, if_not_exists=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_saved_endpoints_project_id"), table_name="saved_endpoints")
    op.drop_index(op.f("ix_saved_endpoints_id"), table_name="saved_endpoints")
    op.drop_table("saved_endpoints")
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")
