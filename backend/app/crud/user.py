from typing import Optional
from sqlalchemy.orm import Session
from ..core.security import get_password_hash, verify_password
from ..db.models.user import User
from ..schemas.user import UserCreate, UserUpdate, UserCreateOAuth


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.query(User).filter(User.google_id == google_id).first()


def get_user_by_vk_id(db: Session, vk_id: str) -> Optional[User]:
    return db.query(User).filter(User.vk_id == vk_id).first()


def get_user_by_telegram_id(db: Session, telegram_id: str) -> Optional[User]:
    return db.query(User).filter(User.telegram_id == telegram_id).first()


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


def create_oauth_user(db: Session, user: UserCreateOAuth) -> User:
    """Создает пользователя через OAuth (без пароля)"""
    import secrets
    # Генерируем случайный пароль для OAuth пользователей
    random_password = secrets.token_urlsafe(32)
    hashed_password = get_password_hash(random_password)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        google_id=user.google_id,
        vk_id=user.vk_id,
        telegram_id=user.telegram_id,
        telegram_username=user.telegram_username,
        is_active=True,
        is_verified=True  # OAuth пользователи считаются верифицированными
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def link_oauth_account(
    db: Session, 
    user_id: int, 
    provider: str, 
    oauth_id: str, 
    username: str = None,
    avatar_url: str = None
) -> Optional[User]:
    """Привязывает OAuth аккаунт к существующему пользователю"""
    user = get_user(db, user_id)
    if not user:
        return None
    
    if provider == "google":
        user.google_id = oauth_id
    elif provider == "vk":
        user.vk_id = oauth_id
    elif provider == "telegram":
        user.telegram_id = oauth_id
        if username:
            user.telegram_username = username
    
    if avatar_url and not user.avatar_url:
        user.avatar_url = avatar_url
    
    db.commit()
    db.refresh(user)
    return user


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


def update_push_subscription(db: Session, user_id: int, subscription: str) -> Optional[User]:
    user = get_user(db, user_id)
    if not user:
        return None
    
    user.push_subscription = subscription
    db.commit()
    db.refresh(user)
    return user 