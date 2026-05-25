"""
Mirage — Behavioral Financial Manipulation Detection Engine
Main FastAPI Application Entry Point
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes import auth, transactions, analytics, alerts, websocket, admin
from app.core.config import settings
from app.db.database import engine, Base
from app.services.transaction_simulator import TransactionSimulator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Global simulator instance
simulator: TransactionSimulator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown lifecycle."""
    global simulator

    logger.info("🚀 Starting Mirage Detection Engine...")

    # Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables initialized")

    # Start transaction simulator
    simulator = TransactionSimulator()
    simulator_task = asyncio.create_task(simulator.start())
    logger.info("✅ Transaction simulator started")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Mirage...")
    if simulator:
        simulator.stop()
    simulator_task.cancel()
    try:
        await simulator_task
    except asyncio.CancelledError:
        pass
    logger.info("✅ Shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="Mirage — Behavioral Financial Manipulation Detection Engine",
    description="AI-powered platform for detecting psychological financial manipulation patterns",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "operational",
        "service": "Mirage Detection Engine",
        "version": "1.0.0"
    }
