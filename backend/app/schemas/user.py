from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserCreateOAuth(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    vk_id: Optional[str] = None
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    telegram_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    is_verified: bool
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    vk_id: Optional[str] = None
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    telegram_notifications: bool
    email_notifications: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str


# Схемы для авторизации
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# OAuth схемы
class OAuthRequest(BaseModel):
    provider: str  # 'google', 'vk', 'telegram'
    redirect_uri: Optional[str] = None


class OAuthCallback(BaseModel):
    provider: str
    code: str
    state: Optional[str] = None


class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None


class VKUserInfo(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    photo_100: Optional[str] = None


class TelegramAuthData(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


# Схема для изменения пароля
class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# Схема для push-уведомлений
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict


# Схема для push-уведомлений пользователю
class PushNotification(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    url: Optional[str] = None
    tag: Optional[str] = None 