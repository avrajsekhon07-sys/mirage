import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Mirage...")
    try:
        from app.db.database import engine, Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database connected!")
    except Exception as e:
        logger.error(f"Database error (continuing anyway): {e}")
    yield
    logger.info("Shutdown")

app = FastAPI(title="Mirage")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "operational"}

try:
    from app.api.routes import auth, transactions, analytics, alerts, admin, websocket
    app.include_router(auth.router, prefix="/api/auth")
    app.include_router(transactions.router, prefix="/api/transactions")
    app.include_router(analytics.router, prefix="/api/analytics")
    app.include_router(alerts.router, prefix="/api/alerts")
    app.include_router(admin.router, prefix="/api/admin")
    app.include_router(websocket.router, prefix="/ws")
    logger.info("All routes loaded!")
except Exception as e:
    logger.error(f"Route loading error: {e}")
