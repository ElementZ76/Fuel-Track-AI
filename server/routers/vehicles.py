"""
Vehicle router for FuelTrack AI.
Handles CRUD operations for vehicles.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.post("/", response_model=schemas.VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    """
    Create a new vehicle for a user.
    """
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == vehicle.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    db_vehicle = models.Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("/", response_model=List[schemas.VehicleRead])
def get_vehicles(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    List all vehicles, optionally filtered by user_id.
    """
    query = db.query(models.Vehicle)
    if user_id is not None:
        query = query.filter(models.Vehicle.user_id == user_id)
    return query.all()


@router.get("/{vehicle_id}", response_model=schemas.VehicleRead)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Get a specific vehicle by ID.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle


@router.put("/{vehicle_id}", response_model=schemas.VehicleRead)
def update_vehicle(vehicle_id: int, vehicle_update: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    """
    Update a vehicle's details.
    """
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
        
    update_data = vehicle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
        
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Delete a vehicle. Cascades to delete all associated fuel logs and expenses.
    """
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
        
    db.delete(db_vehicle)
    db.commit()
    return None
