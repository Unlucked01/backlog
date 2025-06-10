import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..core.security import get_password_hash, verify_password
from ..db.models.user import User
from ..db.models.push_subscription import PushSubscription
from ..schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


# OAuth methods removed as per PRD requirements


def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# OAuth user creation methods removed as per PRD requirements


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> bool:
    user = get_user(db, user_id)
    if not user:
        return False
    
    if not verify_password(current_password, user.hashed_password):
        return False
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return True


def save_push_subscription(db: Session, user_id: int, endpoint: str, p256dh_key: str, auth_key: str) -> bool:
    """Сохранить push-подписку пользователя"""
    try:
        # Удаляем старую подписку если есть
        old_subscription = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).first()
        if old_subscription:
            db.delete(old_subscription)
            db.commit()  # Важно: коммитим удаление перед созданием новой
        
        # Создаем новую подписку
        new_subscription = PushSubscription(
            user_id=user_id,
            endpoint=endpoint,
            p256dh_key=p256dh_key,
            auth_key=auth_key
        )
        db.add(new_subscription)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка сохранения push-подписки для пользователя {user_id}: {e}")
        return False


def get_push_subscription(db: Session, user_id: int) -> Optional[PushSubscription]:
    """Получить push-подписку пользователя"""
    return db.query(PushSubscription).filter(PushSubscription.user_id == user_id).first() 