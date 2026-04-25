"""
Mileage calculation service for FuelTrack AI.
Contains deterministic logic for computing fuel efficiency.
"""

from typing import Optional, List
from server import models


def calculate_mileage(
    current_odo: float, 
    prev_odo: float, 
    fuel_qty: float, 
    is_full_tank: bool, 
    missed: bool
) -> Optional[float]:
    """
    Calculate fuel mileage (km/L) between two fill-ups.
    
    Args:
        current_odo: Current odometer reading (km)
        prev_odo: Previous odometer reading (km)
        fuel_qty: Fuel quantity added in current fill-up (Liters)
        is_full_tank: Whether current fill-up is a full tank
        missed: Whether a fill-up was missed before this one
        
    Returns:
        float: Calculated mileage in km/L
        None: If mileage cannot be accurately calculated (partial fill, missed, invalid data)
    """
    # Cannot calculate if it's a partial tank fill or if previous logs were missed
    if not is_full_tank or missed:
        return None
        
    # Validation
    if fuel_qty <= 0:
        return None
        
    distance = current_odo - prev_odo
    if distance <= 0:
        return None
        
    mileage = distance / fuel_qty
    return round(mileage, 2)


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
