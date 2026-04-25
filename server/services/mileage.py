"""
Mileage calculation service for FuelTrack AI.
Contains deterministic logic for computing fuel efficiency.
"""

from typing import Optional


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
