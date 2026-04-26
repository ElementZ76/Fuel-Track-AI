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
from server.services.mileage import calculate_mileage, enrich_fuel_logs
from server.services.stats import get_vehicle_stats, get_monthly_breakdown

router = APIRouter(prefix="/vehicles/{vehicle_id}/fuel-logs", tags=["Fuel Logs"])


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

    # Odometer regression check: warn if new reading is lower than existing max
    max_odo = db.query(models.FuelLog.odometer_reading)\
                .filter(models.FuelLog.vehicle_id == vehicle_id)\
                .order_by(models.FuelLog.odometer_reading.desc())\
                .scalar()
    if max_odo is not None and log_create.odometer_reading < max_odo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Odometer reading ({log_create.odometer_reading} km) is lower than the "
                   f"last recorded reading ({max_odo} km). If the instrument cluster was "
                   f"replaced or reset, delete the previous logs and restart from your new "
                   f"initial odometer."
        )

    # total_cost, fuel_quantity, and price_per_liter are fully populated by the Pydantic validator
    data = log_create.model_dump(exclude={"vehicle_id"})
    db_log = models.FuelLog(vehicle_id=vehicle_id, **data)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Enrich with computed fields in context of full history
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
    enriched = enrich_fuel_logs(logs, vehicle.initial_odometer)
    for entry in enriched:
        if entry['id'] == db_log.id:
            return entry
    
    # Fallback (should never hit)
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
    Update a fuel log entry. Recomputes total_cost and returns enriched mileage data.
    """
    db_log = db.query(models.FuelLog).filter(
        models.FuelLog.id == log_id,
        models.FuelLog.vehicle_id == vehicle_id
    ).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
        
    update_data = log_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
        
    # Maintain mathematical consistency if any fuel metric is updated
    if any(k in update_data for k in ["fuel_quantity", "price_per_liter", "total_cost"]):
        if "total_cost" not in update_data:
            db_log.total_cost = round(db_log.fuel_quantity * db_log.price_per_liter, 2)
        elif "fuel_quantity" not in update_data:
            db_log.fuel_quantity = round(db_log.total_cost / db_log.price_per_liter, 2)
        elif "price_per_liter" not in update_data:
            db_log.price_per_liter = round(db_log.total_cost / db_log.fuel_quantity, 2)
    
    db.commit()
    db.refresh(db_log)
    
    # Return enriched result consistent with GET /fuel-logs
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
    enriched = enrich_fuel_logs(logs, vehicle.initial_odometer)
    for entry in enriched:
        if entry['id'] == log_id:
            return entry

    # Fallback
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
    
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
    expenses = db.query(models.Expense)\
                 .filter(models.Expense.vehicle_id == vehicle_id)\
                 .all()
    enriched_logs = enrich_fuel_logs(logs, vehicle.initial_odometer)
    return get_monthly_breakdown(enriched_logs, expenses)
