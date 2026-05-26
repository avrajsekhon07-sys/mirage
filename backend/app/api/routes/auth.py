from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.services.user_service import UserService
from app.core.security import create_access_token

router = APIRouter()

class RegisterData(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class LoginData(BaseModel):
    email: str
    password: str

def user_response(user, token):
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": str(user.created_at)
        }
    }

@router.post("/register")
async def register(data: RegisterData, db: AsyncSession = Depends(get_db)):
    if await UserService.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await UserService.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = await UserService.create_user(db, data.email, data.username, data.password, data.full_name)
    await db.commit()
    token = create_access_token({"sub": str(user.id)})
    return user_response(user, token)

@router.post("/login")
async def login(data: LoginData, db: AsyncSession = Depends(get_db)):
    user = await UserService.authenticate(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return user_response(user, token)

@router.get("/me")
async def me():
    return {"status": "ok"}
