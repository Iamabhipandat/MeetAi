"""Create ai_responses table

Revision ID: 006_create_ai_responses
Revises: 005_add_embedding_to_questions
Create Date: 2026-09-15
"""
from alembic import op
import sqlalchemy as sa

revision = "006_create_ai_responses"
down_revision = "005_add_embedding_to_questions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_responses",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id"), nullable=False, index=True),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("context_used", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("ai_responses")
