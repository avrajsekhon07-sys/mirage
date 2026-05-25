from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.user_service import UserService
from app.core.security import create_access_token

router = APIRouter()

@router.post("/register")
async def register(data: dict, db: AsyncSession = Depends(get_db)):
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    full_name = data.get("full_name")
    if not email or not username or not password:
        raise HTTPException(status_code=400, detail="Missing fields")
    if await UserService.get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await UserService.get_user_by_username(db, username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = await UserService.create_user(db, email, username, password, full_name)
    await db.commit()
    token = create_access_token({"sub": str(user.id)})
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

@router.post("/login")
async def login(data: dict, db: AsyncSession = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")
    user = await UserService.authenticate(db, email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
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

@router.get("/me")
async def me():
    return {"status": "ok"}
