import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Mirage...")
    try:
        from app.db.database import engine, Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ready")
    except Exception as e:
        logger.error(f"DB init error: {e}")
    yield


app = FastAPI(title="Mirage Risk Engine", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "operational", "version": "2.0"}


# ── Inline Auth (fast path, no router overhead) ───────────────────────────────

class RegData(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class LogData(BaseModel):
    email: str
    password: str


@app.post("/api/auth/register")
async def register(data: RegData):
    from app.db.database import AsyncSessionLocal
    from app.services.user_service import UserService
    from app.core.security import create_access_token
    async with AsyncSessionLocal() as db:
        if await UserService.get_user_by_email(db, data.email):
            raise HTTPException(400, "Email already registered")
        if await UserService.get_user_by_username(db, data.username):
            raise HTTPException(400, "Username already taken")
        user = await UserService.create_user(db, data.email, data.username, data.password, data.full_name)
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
                "created_at": str(user.created_at),
            },
        }


@app.post("/api/auth/login")
async def login(data: LogData):
    from app.db.database import AsyncSessionLocal
    from app.services.user_service import UserService
    from app.core.security import create_access_token
    async with AsyncSessionLocal() as db:
        user = await UserService.authenticate(db, data.email, data.password)
        if not user:
            raise HTTPException(401, "Invalid credentials")
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
                "created_at": str(user.created_at),
            },
        }


# ── Feature Routers ────────────────────────────────────────────────────────────

from app.api.routes import transactions, analytics, alerts, admin, websocket as ws_routes

app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analytics.router,    prefix="/api/analytics",    tags=["analytics"])
app.include_router(alerts.router,       prefix="/api/alerts",       tags=["alerts"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["admin"])
app.include_router(ws_routes.router,    prefix="/ws",               tags=["websocket"])
