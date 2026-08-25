"""add acquisition fields to sessions

Revision ID: 64024a28c99b
Revises: e8b219ecfb43
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64024a28c99b'
down_revision: Union[str, Sequence[str], None] = 'e8b219ecfb43'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'sessions',
        sa.Column('acquisition_mode', sa.String(length=32), nullable=False, server_default='upload'),
    )
    op.add_column('sessions', sa.Column('search_query', sa.Text(), nullable=True))
    op.add_column('sessions', sa.Column('sources_used', sa.JSON(), nullable=True))
    op.add_column('sessions', sa.Column('results_retrieved', sa.Integer(), nullable=True))
    op.add_column('sessions', sa.Column('results_selected', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('sessions', 'results_selected')
    op.drop_column('sessions', 'results_retrieved')
    op.drop_column('sessions', 'sources_used')
    op.drop_column('sessions', 'search_query')
    op.drop_column('sessions', 'acquisition_mode')
