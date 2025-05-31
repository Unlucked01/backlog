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
    OAuthRequest, OAuthCallback, GoogleUserInfo, VKUserInfo, TelegramAuthData,
    UserCreateOAuth, PushNotification
)
from ....services.oauth import OAuthService
from ....services.notifications import NotificationService

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


# OAuth Endpoints

@router.get("/oauth/{provider}/url")
async def get_oauth_url(provider: str) -> dict:
    """
    Получить URL для OAuth авторизации
    """
    state = OAuthService.generate_state()
    
    if provider == "google":
        auth_url = await OAuthService.get_google_auth_url(state)
    elif provider == "vk":
        auth_url = await OAuthService.get_vk_auth_url(state)
    elif provider == "telegram":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Telegram OAuth использует Telegram Login Widget"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый провайдер"
        )
    
    return {"auth_url": auth_url, "state": state}


@router.post("/oauth/{provider}/callback", response_model=Token)
async def oauth_callback(
    provider: str,
    callback_data: OAuthCallback,
    db: Session = Depends(get_db)
) -> Any:
    """
    Обработка callback от OAuth провайдера
    """
    try:
        if provider == "google":
            user_info = await OAuthService.exchange_google_code(callback_data.code)
            
            # Проверяем существует ли пользователь с Google ID
            existing_user = crud_user.get_user_by_google_id(db, user_info.id)
            if existing_user:
                user = existing_user
            else:
                # Проверяем по email
                existing_user = crud_user.get_user_by_email(db, user_info.email)
                if existing_user:
                    # Привязываем Google аккаунт к существующему пользователю
                    user = crud_user.link_oauth_account(
                        db, existing_user.id, "google", user_info.id, avatar_url=user_info.picture
                    )
                else:
                    # Создаем нового пользователя
                    oauth_user = UserCreateOAuth(
                        email=user_info.email,
                        full_name=user_info.name,
                        avatar_url=user_info.picture,
                        google_id=user_info.id
                    )
                    user = crud_user.create_oauth_user(db, oauth_user)
                    
                    # Отправляем приветственное уведомление
                    NotificationService.send_welcome_notification(
                        db, user.id, user.full_name or user.email.split('@')[0]
                    )
        
        elif provider == "vk":
            user_info = await OAuthService.exchange_vk_code(callback_data.code)
            
            # Проверяем существует ли пользователь с VK ID
            existing_user = crud_user.get_user_by_vk_id(db, user_info.id)
            if existing_user:
                user = existing_user
            else:
                # Если email предоставлен, проверяем по нему
                if user_info.email:
                    existing_user = crud_user.get_user_by_email(db, user_info.email)
                    if existing_user:
                        user = crud_user.link_oauth_account(
                            db, existing_user.id, "vk", user_info.id, avatar_url=user_info.photo_100
                        )
                    else:
                        oauth_user = UserCreateOAuth(
                            email=user_info.email,
                            full_name=f"{user_info.first_name} {user_info.last_name}",
                            avatar_url=user_info.photo_100,
                            vk_id=user_info.id
                        )
                        user = crud_user.create_oauth_user(db, oauth_user)
                        
                        NotificationService.send_welcome_notification(
                            db, user.id, user.full_name or user.email.split('@')[0]
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="VK не предоставил email. Используйте обычную регистрацию."
                    )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неподдерживаемый провайдер"
            )
        
        # Создаем токен
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка OAuth авторизации: {str(e)}"
        )


@router.post("/oauth/telegram", response_model=Token)
async def telegram_login(
    auth_data: TelegramAuthData,
    db: Session = Depends(get_db)
) -> Any:
    """
    Авторизация через Telegram Login Widget
    """
    # Проверяем подлинность данных
    if not OAuthService.verify_telegram_auth(auth_data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверные данные Telegram авторизации"
        )
    
    # Проверяем существует ли пользователь с Telegram ID
    existing_user = crud_user.get_user_by_telegram_id(db, auth_data.id)
    if existing_user:
        user = existing_user
    else:
        # Создаем временный email для Telegram пользователей
        temp_email = f"telegram_{auth_data.id}@studentplanner.local"
        full_name = auth_data.first_name
        if auth_data.last_name:
            full_name += f" {auth_data.last_name}"
        
        oauth_user = UserCreateOAuth(
            email=temp_email,
            full_name=full_name,
            avatar_url=auth_data.photo_url,
            telegram_id=auth_data.id,
            telegram_username=auth_data.username
        )
        user = crud_user.create_oauth_user(db, oauth_user)
        
        NotificationService.send_welcome_notification(
            db, user.id, user.full_name or auth_data.username or "Пользователь"
        )
    
    # Создаем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


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
    import json
    subscription_json = json.dumps(subscription.dict())
    updated_user = crud_user.update_push_subscription(db, current_user.id, subscription_json)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Ошибка сохранения подписки")
    
    # Отправляем тестовое уведомление
    test_notification = PushNotification(
        title="🎉 Уведомления включены!",
        body="Теперь вы будете получать напоминания о дедлайнах",
        url="/",
        tag="push-enabled"
    )
    NotificationService.send_notification_to_user(db, current_user.id, test_notification)
    
    return {"message": "Push-подписка сохранена"}


@router.post("/test-notification")
def send_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Отправить тестовое уведомление (для разработки)
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Не найдено")
    
    test_notification = PushNotification(
        title="🧪 Тестовое уведомление",
        body="Это тестовое push-уведомление для проверки работы системы",
        url="/",
        tag="test"
    )
    
    success = NotificationService.send_notification_to_user(
        db, current_user.id, test_notification
    )
    
    if success:
        return {"message": "Тестовое уведомление отправлено"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="Не удалось отправить уведомление. Проверьте подписку."
        ) 