"""Create meetings table

Revision ID: 002_create_meetings
Revises: 001_create_users
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

revision = "002_create_meetings"
down_revision = "001_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("SCHEDULED", "ACTIVE", "ENDED", name="meetingstatus"),
            nullable=False,
            server_default="SCHEDULED",
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_meetings_id"), "meetings", ["id"], unique=False)
    op.create_index(op.f("ix_meetings_user_id"), "meetings", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_meetings_user_id"), table_name="meetings")
    op.drop_index(op.f("ix_meetings_id"), table_name="meetings")
    op.drop_table("meetings")
    op.execute("DROP TYPE IF EXISTS meetingstatus")
