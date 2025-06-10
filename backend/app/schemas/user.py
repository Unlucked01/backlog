from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


# OAuth user creation removed as per PRD requirements


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email_notifications: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    is_verified: bool
    avatar_url: Optional[str] = None
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


# OAuth schemas removed as per PRD requirements


# Схема для изменения пароля
class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# Схема для push-уведомлений
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # Contains p256dh and auth keys


# Схема для push-уведомлений пользователю
class PushNotification(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    url: Optional[str] = None
    tag: Optional[str] = None 