"""Remove OAuth fields and add push_subscriptions table

Revision ID: b91ddce9a7a2
Revises: 001
Create Date: 2025-06-10 10:15:34.830902

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b91ddce9a7a2'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем таблицу push_subscriptions
    op.create_table('push_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh_key', sa.Text(), nullable=False),
        sa.Column('auth_key', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_push_subscriptions_id'), 'push_subscriptions', ['id'], unique=False)
    
    # Создаем таблицу notifications
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('was_opened', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    
    # Добавляем поле is_overdue в таблицу tasks
    op.add_column('tasks', sa.Column('is_overdue', sa.Boolean(), nullable=True))
    op.create_index(op.f('ix_tasks_is_overdue'), 'tasks', ['is_overdue'], unique=False)
    
    # Удаляем OAuth поля из таблицы users
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'vk_id') 
    op.drop_column('users', 'telegram_id')
    op.drop_column('users', 'telegram_username')
    op.drop_column('users', 'push_subscription')
    op.drop_column('users', 'telegram_notifications')


def downgrade() -> None:
    # Возвращаем OAuth поля в таблицу users
    op.add_column('users', sa.Column('telegram_notifications', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('push_subscription', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('telegram_username', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('telegram_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('vk_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('google_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    
    # Удаляем поле is_overdue из таблицы tasks
    op.drop_index(op.f('ix_tasks_is_overdue'), table_name='tasks')
    op.drop_column('tasks', 'is_overdue')
    
    # Удаляем таблицу notifications
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    
    # Удаляем таблицу push_subscriptions
    op.drop_index(op.f('ix_push_subscriptions_id'), table_name='push_subscriptions')
    op.drop_table('push_subscriptions') 