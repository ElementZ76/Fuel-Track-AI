"""
Lightweight authentication router for FuelTrack AI.
Handles user creation, listing, and simple PIN-based login.
"""

import hashlib
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/users", tags=["Users & Auth"])


def hash_pin(pin: str) -> str:
    """Hashes a 4-digit PIN using SHA-256."""
    return hashlib.sha256(pin.encode('utf-8')).hexdigest()


@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user profile with a 4-digit PIN.
    """
    hashed_pin = hash_pin(user.pin)
    db_user = models.User(
        username=user.username,
        pin_hash=hashed_pin,
        display_name=user.display_name
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )


@router.get("/", response_model=List[schemas.UserRead])
def get_users(db: Session = Depends(get_db)):
    """
    List all available users (for the switcher screen).
    """
    users = db.query(models.User).all()
    return users


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(creds: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Lightweight PIN-based login.
    Returns success status and user data if valid.
    """
    user = db.query(models.User).filter(models.User.username == creds.username.strip().lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user.pin_hash != hash_pin(creds.pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect PIN"
        )
        
    return schemas.LoginResponse(
        success=True,
        user=user,
        message="Login successful"
    )
