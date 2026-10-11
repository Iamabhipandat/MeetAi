"""Create transcripts table

Revision ID: 003_create_transcripts
Revises: 002_create_meetings
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

revision = "003_create_transcripts"
down_revision = "002_create_meetings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transcripts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("speaker", sa.String(length=100), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
    )
    op.create_index(op.f("ix_transcripts_id"), "transcripts", ["id"], unique=False)
    op.create_index(op.f("ix_transcripts_meeting_id"), "transcripts", ["meeting_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_transcripts_meeting_id"), table_name="transcripts")
    op.drop_index(op.f("ix_transcripts_id"), table_name="transcripts")
    op.drop_table("transcripts")
