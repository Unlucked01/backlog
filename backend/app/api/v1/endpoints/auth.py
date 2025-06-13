from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ....core import security
from ....core.config import settings
from ....crud import user as crud_user
from ....db.session import get_db
from ....schemas.user import (
    User, UserCreate, Token, UserLogin, PasswordChange, PushSubscription,
    PushNotification
)
from ....services.notifications import notification_service

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    payload = security.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud_user.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Регистрация нового пользователя
    """
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует"
        )
    db_user = crud_user.create_user(db=db, user=user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    """
    Авторизация пользователя
    """
    user = crud_user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Аккаунт не активен")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-json", response_model=Token)
def login_json(user_login: UserLogin, db: Session = Depends(get_db)) -> Any:
    """
    Авторизация пользователя через JSON
    """
    user = crud_user.authenticate_user(db, email=user_login.email, password=user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Аккаунт не активен")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# OAuth endpoints removed as per PRD requirements
# Only email/password authentication is supported


# All OAuth endpoints removed as per PRD requirements


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Получить данные текущего пользователя
    """
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Изменить пароль пользователя
    """
    success = crud_user.change_password(
        db, current_user.id, password_data.current_password, password_data.new_password
    )
    if not success:
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    return {"message": "Пароль успешно изменен"}


@router.post("/push-subscription")
def save_push_subscription(
    subscription: PushSubscription,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Сохранить push-подписку для уведомлений
    """
    success = crud_user.save_push_subscription(
        db, current_user.id, subscription.endpoint, subscription.keys['p256dh'], subscription.keys['auth']
    )
    if not success:
        raise HTTPException(status_code=400, detail="Ошибка сохранения подписки")
    
    # Отправляем тестовое уведомление асинхронно
    import asyncio
    try:
        asyncio.create_task(notification_service.send_push_notification(
            user_id=current_user.id,
            title="🎉 Уведомления включены!",
            body="Теперь вы будете получать напоминания о дедлайнах",
            data={'type': 'subscription_enabled', 'url': '/'}
        ))
    except Exception:
        pass  # Не блокируем регистрацию подписки из-за ошибки уведомления
    
    return {"message": "Push-подписка сохранена"}


@router.post("/test-notification")
async def send_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Отправить тестовое уведомление (для разработки)
    """
    success = await notification_service.send_test_notification(current_user.id)
    
    if success:
        return {"message": "Тестовое уведомление отправлено"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="Не удалось отправить уведомление. Проверьте подписку."
        ) 