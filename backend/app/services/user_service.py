from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from app.models.models import User, BehavioralProfile


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password[:72].encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password[:72].encode(), hashed.encode())


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
        hashed = _hash_password(password)
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
        if not _verify_password(password, user.hashed_password):
            return None
        return user
