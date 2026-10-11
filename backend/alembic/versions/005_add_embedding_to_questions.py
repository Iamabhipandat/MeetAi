"""Fix embedding column type to JSON

Revision ID: 005_add_embedding_to_questions
Revises: 004_create_questions
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

revision = "005_add_embedding_to_questions"
down_revision = "004_create_questions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("embedding", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("questions", "embedding")
