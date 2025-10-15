from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db, close_db
from .routers import auth, users, wallets, trips, investments, transactions, notifications, bank_accounts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Initializing PostgreSQL database...")
    init_db()
    print("PostgreSQL Database initialized successfully\n")
    yield
    # Shutdown
    close_db()


app = FastAPI(
    title="TruckFin Hub API",
    description="FastAPI backend for TruckFin Hub - Logistics Financing Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(wallets.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(investments.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(bank_accounts.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TruckFin Hub API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }
