"""
Mileage calculation service for FuelTrack AI.
Contains deterministic logic for computing fuel efficiency.
"""

from typing import Optional, List
from server import models

def enrich_fuel_logs(logs: List[models.FuelLog], initial_odometer: float) -> List[dict]:
    """
    Enrich fuel logs with computed distance_km and mileage_kmpl.
    Requires logs to be sorted by odometer_reading ascending.
    """
    enriched_logs = []
    
    prev_odo = initial_odometer
    last_full_odo = initial_odometer
    accumulated_fuel = 0.0
    is_valid_sequence = True

    for log in logs:
        log_dict = {c.name: getattr(log, c.name) for c in log.__table__.columns}
        
        # Calculate step distance (since last log) for display
        step_distance = log.odometer_reading - prev_odo
        log_dict['distance_km'] = round(step_distance, 2) if step_distance > 0 else None
        
        # Accumulate fuel for mileage calculation
        accumulated_fuel += log.fuel_quantity
        
        if log.missed:
            is_valid_sequence = False
            
        # Only calculate mileage when the tank is completely full
        if log.is_full_tank:
            if is_valid_sequence and log.odometer_reading > last_full_odo and accumulated_fuel > 0:
                distance_since_full = log.odometer_reading - last_full_odo
                mileage = distance_since_full / accumulated_fuel
                log_dict['mileage_kmpl'] = round(mileage, 2)
            else:
                log_dict['mileage_kmpl'] = None
                
            # Reset trackers for the next calculation span
            last_full_odo = log.odometer_reading
            accumulated_fuel = 0.0
            is_valid_sequence = True
        else:
            # Partial fill: no accurate mileage can be calculated until the next full tank
            log_dict['mileage_kmpl'] = None
            
        prev_odo = log.odometer_reading
        enriched_logs.append(log_dict)
        
    # Return in original order (usually descending for display)
    return enriched_logs[::-1]
