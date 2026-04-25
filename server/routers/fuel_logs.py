"""
Fuel logs router for FuelTrack AI.
Handles CRUD for fuel logs, automatic cost computation, and mileage calculations.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server.database import get_db
from server import models, schemas
from server.services.mileage import calculate_mileage
from server.services.stats import get_vehicle_stats, get_monthly_breakdown

router = APIRouter(prefix="/vehicles/{vehicle_id}/fuel-logs", tags=["Fuel Logs"])


def enrich_fuel_logs(logs: List[models.FuelLog], initial_odometer: float) -> List[dict]:
    """
    Enrich fuel logs with computed distance_km and mileage_kmpl.
    Requires logs to be sorted by odometer_reading ascending.
    """
    enriched_logs = []
    prev_odo = initial_odometer
    prev_is_full_tank = True # Assume initial is a baseline

    for log in logs:
        log_dict = {c.name: getattr(log, c.name) for c in log.__table__.columns}
        
        # Calculate distance
        distance_km = log.odometer_reading - prev_odo
        if distance_km > 0:
            log_dict['distance_km'] = round(distance_km, 2)
        else:
            log_dict['distance_km'] = None
            
        # Calculate mileage
        mileage = calculate_mileage(
            current_odo=log.odometer_reading,
            prev_odo=prev_odo,
            fuel_qty=log.fuel_quantity,
            is_full_tank=log.is_full_tank and prev_is_full_tank,
            missed=log.missed
        )
        log_dict['mileage_kmpl'] = mileage
        
        enriched_logs.append(log_dict)
        
        # Update prev for next iteration
        prev_odo = log.odometer_reading
        prev_is_full_tank = log.is_full_tank
        
    # Return in original order (usually descending for display)
    return enriched_logs[::-1]


@router.post("/", response_model=schemas.FuelLogRead, status_code=status.HTTP_201_CREATED)
def add_fuel_log(vehicle_id: int, log_create: schemas.FuelLogCreate, db: Session = Depends(get_db)):
    """
    Add a fuel log entry. total_cost is auto-calculated.
    """
    if log_create.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Vehicle ID in path must match body"
        )
        
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Auto-calculate total_cost
    total_cost = round(log_create.fuel_quantity * log_create.price_per_liter, 2)
    
    db_log = models.FuelLog(**log_create.model_dump(), total_cost=total_cost)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Simple enrichment for response (no previous context here, handled in list)
    result = {c.name: getattr(db_log, c.name) for c in db_log.__table__.columns}
    result['distance_km'] = None
    result['mileage_kmpl'] = None
    
    return result


@router.get("/", response_model=List[schemas.FuelLogRead])
def get_fuel_logs(vehicle_id: int, db: Session = Depends(get_db)):
    """
    List fuel logs for a vehicle, enriched with computed mileage.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Fetch logs ordered by odometer ascending to calculate mileage properly
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
             
    enriched_logs = enrich_fuel_logs(logs, vehicle.initial_odometer)
    return enriched_logs


@router.get("/{log_id}", response_model=schemas.FuelLogRead)
def get_fuel_log(vehicle_id: int, log_id: int, db: Session = Depends(get_db)):
    """
    Get a single fuel log entry. Includes computed mileage context.
    """
    # Easiest way to get computed fields is to enrich all and filter
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
             
    enriched_logs = enrich_fuel_logs(logs, vehicle.initial_odometer)
    
    for log in enriched_logs:
        if log['id'] == log_id:
            return log
            
    raise HTTPException(status_code=404, detail="Fuel log not found")


@router.put("/{log_id}", response_model=schemas.FuelLogRead)
def update_fuel_log(vehicle_id: int, log_id: int, log_update: schemas.FuelLogUpdate, db: Session = Depends(get_db)):
    """
    Update a fuel log entry. Recomputes total_cost if quantity or price changes.
    """
    db_log = db.query(models.FuelLog).filter(
        models.FuelLog.id == log_id,
        models.FuelLog.vehicle_id == vehicle_id
    ).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
        
    update_data = log_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
        
    # Recompute total cost
    db_log.total_cost = round(db_log.fuel_quantity * db_log.price_per_liter, 2)
    
    db.commit()
    db.refresh(db_log)
    
    # Return simple enriched dict
    result = {c.name: getattr(db_log, c.name) for c in db_log.__table__.columns}
    result['distance_km'] = None
    result['mileage_kmpl'] = None
    
    return result


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel_log(vehicle_id: int, log_id: int, db: Session = Depends(get_db)):
    """
    Delete a fuel log entry.
    """
    db_log = db.query(models.FuelLog).filter(
        models.FuelLog.id == log_id,
        models.FuelLog.vehicle_id == vehicle_id
    ).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
        
    db.delete(db_log)
    db.commit()
    return None

# Use a new prefix for stats to keep it separate but related to vehicle
stats_router = APIRouter(prefix="/vehicles/{vehicle_id}/stats", tags=["Stats"])

@stats_router.get("/", response_model=schemas.MileageStats)
def get_stats(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Get overall mileage and expenditure stats for a vehicle.
    """
    try:
        return get_vehicle_stats(db, vehicle_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@stats_router.get("/monthly", response_model=List[schemas.MonthlyBreakdown])
def get_monthly_stats(vehicle_id: int, db: Session = Depends(get_db)):
    """
    Get monthly breakdown of costs and mileage.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return get_monthly_breakdown(db, vehicle_id)
