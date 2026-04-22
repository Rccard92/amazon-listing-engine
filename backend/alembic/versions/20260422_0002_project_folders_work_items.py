"""project folders and work items

Revision ID: 0002_project_items
Revises: 0001_initial
Create Date: 2026-04-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_project_items"
down_revision: Union[str, Sequence[str], None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_folders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_folders_name"), "project_folders", ["name"], unique=False)

    op.create_table(
        "work_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("workflow_type", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("competitor_url", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("input_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column(
            "keyword_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "generated_output",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("project_folder_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_folder_id"], ["project_folders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_work_items_project_folder_id"), "work_items", ["project_folder_id"], unique=False)
    op.create_index(op.f("ix_work_items_status"), "work_items", ["status"], unique=False)
    op.create_index(op.f("ix_work_items_updated_at"), "work_items", ["updated_at"], unique=False)
    op.create_index(op.f("ix_work_items_workflow_type"), "work_items", ["workflow_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_work_items_workflow_type"), table_name="work_items")
    op.drop_index(op.f("ix_work_items_updated_at"), table_name="work_items")
    op.drop_index(op.f("ix_work_items_status"), table_name="work_items")
    op.drop_index(op.f("ix_work_items_project_folder_id"), table_name="work_items")
    op.drop_table("work_items")
    op.drop_index(op.f("ix_project_folders_name"), table_name="project_folders")
    op.drop_table("project_folders")

