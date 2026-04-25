"""
Main FastAPI application file for FuelTrack AI.
Wires together all routers, sets up CORS, and handles startup events.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.database import Base, engine
from server.routers import auth, vehicles, fuel_logs, expenses


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to create tables on startup."""
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.")
    yield
    print("Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="FuelTrack AI API",
    description="Backend API for FuelTrack AI - vehicle fuel and expense tracking.",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS for the Vite dev server
origins = [
    "http://localhost:5173",  # Default Vite port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(fuel_logs.router, prefix="/api")
app.include_router(fuel_logs.stats_router, prefix="/api")  # The stats router defined in fuel_logs.py
app.include_router(expenses.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "FuelTrack AI Backend is running."}
