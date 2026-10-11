"""Create meeting_summaries table

Revision ID: 007_create_meeting_summaries
Revises: 006_create_ai_responses
Create Date: 2026-09-15
"""
from alembic import op
import sqlalchemy as sa

revision = "007_create_meeting_summaries"
down_revision = "006_create_ai_responses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "meeting_summaries",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False, index=True),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("meeting_summaries")
