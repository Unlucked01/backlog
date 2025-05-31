import hashlib
import hmac
import json
import time
from typing import Optional, Dict, Any
from urllib.parse import urlencode, parse_qs

import httpx
from authlib.integrations.base_client import BaseOAuth
from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import HTTPException, status

from ..core.config import settings
from ..schemas.user import GoogleUserInfo, VKUserInfo, TelegramAuthData


class OAuthService:
    
    @staticmethod
    async def get_google_auth_url(state: str) -> str:
        """Генерирует URL для авторизации через Google"""
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth не настроен"
            )
        
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'scope': 'openid email profile',
            'response_type': 'code',
            'state': state,
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        return f"{base_url}?{urlencode(params)}"
    
    @staticmethod
    async def get_vk_auth_url(state: str) -> str:
        """Генерирует URL для авторизации через VK"""
        if not settings.VK_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="VK OAuth не настроен"
            )
        
        params = {
            'client_id': settings.VK_CLIENT_ID,
            'redirect_uri': settings.VK_REDIRECT_URI,
            'scope': 'email',
            'response_type': 'code',
            'state': state,
            'v': '5.131'
        }
        
        base_url = 'https://oauth.vk.com/authorize'
        return f"{base_url}?{urlencode(params)}"
    
    @staticmethod
    async def exchange_google_code(code: str) -> GoogleUserInfo:
        """Обменивает код на токен и получает информацию о пользователе Google"""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth не настроен"
            )
        
        # Обмен кода на токен
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        }
        
        async with httpx.AsyncClient() as client:
            # Получаем токен
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                headers={'Accept': 'application/json'}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка получения токена Google"
                )
            
            token_json = token_response.json()
            access_token = token_json.get('access_token')
            
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось получить токен доступа"
                )
            
            # Получаем информацию о пользователе
            user_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка получения данных пользователя Google"
                )
            
            user_data = user_response.json()
            return GoogleUserInfo(
                id=user_data['id'],
                email=user_data['email'],
                name=user_data['name'],
                picture=user_data.get('picture')
            )
    
    @staticmethod
    async def exchange_vk_code(code: str) -> VKUserInfo:
        """Обменивает код на токен и получает информацию о пользователе VK"""
        if not settings.VK_CLIENT_ID or not settings.VK_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="VK OAuth не настроен"
            )
        
        # Обмен кода на токен
        token_data = {
            'client_id': settings.VK_CLIENT_ID,
            'client_secret': settings.VK_CLIENT_SECRET,
            'redirect_uri': settings.VK_REDIRECT_URI,
            'code': code,
        }
        
        async with httpx.AsyncClient() as client:
            # Получаем токен
            token_response = await client.post(
                'https://oauth.vk.com/access_token',
                data=token_data
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка получения токена VK"
                )
            
            token_json = token_response.json()
            access_token = token_json.get('access_token')
            user_id = token_json.get('user_id')
            email = token_json.get('email')
            
            if not access_token or not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось получить токен доступа VK"
                )
            
            # Получаем информацию о пользователе
            user_params = {
                'access_token': access_token,
                'user_ids': user_id,
                'fields': 'first_name,last_name,photo_100',
                'v': '5.131'
            }
            
            user_response = await client.get(
                'https://api.vk.com/method/users.get',
                params=user_params
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка получения данных пользователя VK"
                )
            
            user_data = user_response.json()
            if 'error' in user_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка VK API"
                )
            
            user_info = user_data['response'][0]
            return VKUserInfo(
                id=str(user_info['id']),
                email=email,
                first_name=user_info['first_name'],
                last_name=user_info['last_name'],
                photo_100=user_info.get('photo_100')
            )
    
    @staticmethod
    def verify_telegram_auth(auth_data: TelegramAuthData) -> bool:
        """Проверяет подлинность данных Telegram авторизации"""
        if not settings.TELEGRAM_BOT_TOKEN:
            return False
        
        # Создаем строку для проверки
        check_dict = auth_data.dict()
        check_hash = check_dict.pop('hash')
        
        check_string = '\n'.join([f'{k}={v}' for k, v in sorted(check_dict.items()) if v is not None])
        
        # Создаем секретный ключ
        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        
        # Вычисляем хеш
        calculated_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
        
        # Проверяем хеш и время (не более 1 дня)
        current_time = int(time.time())
        return (
            calculated_hash == check_hash and
            current_time - auth_data.auth_date <= 86400
        )
    
    @staticmethod
    def generate_state() -> str:
        """Генерирует случайную строку для OAuth state параметра"""
        import secrets
        return secrets.token_urlsafe(32) 