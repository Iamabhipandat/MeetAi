"""Create questions table

Revision ID: 004_create_questions
Revises: 003_create_transcripts
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

revision = "004_create_questions"
down_revision = "003_create_transcripts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("transcript_id", sa.Integer(), sa.ForeignKey("transcripts.id"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("speaker", sa.String(length=100), nullable=False),
        sa.Column(
            "status",
            sa.Enum("UNANSWERED", "ANSWERED", "DUPLICATE", "IGNORED", name="questionstatus"),
            nullable=False,
            server_default="UNANSWERED",
        ),
        sa.Column("is_duplicate", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("duplicate_of", sa.Integer(), sa.ForeignKey("questions.id"), nullable=True),
        sa.Column("similarity_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_questions_id"), "questions", ["id"], unique=False)
    op.create_index(op.f("ix_questions_meeting_id"), "questions", ["meeting_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_questions_meeting_id"), table_name="questions")
    op.drop_index(op.f("ix_questions_id"), table_name="questions")
    op.drop_table("questions")
    op.execute("DROP TYPE IF EXISTS questionstatus")
