from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from app.models.models import User, BehavioralProfile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:

    @staticmethod
    async def get_user_by_id(db, user_id):
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db, email):
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_username(db, username):
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(db, email, username, password, full_name=None):
        hashed = pwd_context.hash(password[:72])
        user = User(email=email, username=username, hashed_password=hashed, full_name=full_name)
        db.add(user)
        await db.flush()
        profile = BehavioralProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
        return user

    @staticmethod
    async def authenticate(db, email, password):
        user = await UserService.get_user_by_email(db, email)
        if not user:
            return None
        if not pwd_context.verify(password[:72], user.hashed_password):
            return None
        return user
