"""
Stats aggregation service for FuelTrack AI.
Combines data from fuel logs and expenses for dashboard visualizations.
"""

from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from server import models, schemas
from server.services.mileage import enrich_fuel_logs


def get_monthly_breakdown(db: Session, vehicle_id: int):
    """
    Generate a monthly breakdown of costs and mileage.
    """
    # Fetch all logs and expenses for the vehicle
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        return []
        
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
             
    expenses = db.query(models.Expense)\
                 .filter(models.Expense.vehicle_id == vehicle_id)\
                 .all()
                 
    enriched_logs = enrich_fuel_logs(logs, vehicle.initial_odometer)
    
    # Group by month (YYYY-MM)
    monthly_data = defaultdict(lambda: {
        "distance_km": 0.0,
        "fuel_liters": 0.0,
        "fuel_cost": 0.0,
        "expense_cost": 0.0,
        "mileage_sum": 0.0,
        "mileage_count": 0
    })
    
    # Aggregate Fuel Logs
    for log in enriched_logs:
        month = log['date'].strftime("%Y-%m")
        if log['distance_km'] is not None:
            monthly_data[month]["distance_km"] += log['distance_km']
        monthly_data[month]["fuel_liters"] += log['fuel_quantity']
        monthly_data[month]["fuel_cost"] += log['total_cost']
        
        if log['mileage_kmpl'] is not None:
            monthly_data[month]["mileage_sum"] += log['mileage_kmpl']
            monthly_data[month]["mileage_count"] += 1
            
    # Aggregate Expenses
    for exp in expenses:
        month = exp.date.strftime("%Y-%m")
        monthly_data[month]["expense_cost"] += exp.amount
        
    # Format output
    result = []
    for month in sorted(monthly_data.keys()):
        data = monthly_data[month]
        total_cost = data["fuel_cost"] + data["expense_cost"]
        
        avg_mileage = None
        if data["mileage_count"] > 0:
            avg_mileage = round(data["mileage_sum"] / data["mileage_count"], 2)
            
        result.append(schemas.MonthlyBreakdown(
            month=month,
            distance_km=round(data["distance_km"], 2),
            fuel_liters=round(data["fuel_liters"], 2),
            fuel_cost=round(data["fuel_cost"], 2),
            expense_cost=round(data["expense_cost"], 2),
            total_cost=round(total_cost, 2),
            avg_mileage=avg_mileage
        ))
        
    return result


def get_vehicle_stats(db: Session, vehicle_id: int) -> schemas.MileageStats:
    """
    Calculate overall vehicle statistics (fuel + expenses).
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise ValueError("Vehicle not found")
        
    logs = db.query(models.FuelLog)\
             .filter(models.FuelLog.vehicle_id == vehicle_id)\
             .order_by(models.FuelLog.odometer_reading.asc())\
             .all()
             
    expenses = db.query(models.Expense)\
                 .filter(models.Expense.vehicle_id == vehicle_id)\
                 .all()
                 
    enriched_logs = enrich_fuel_logs(logs, vehicle.initial_odometer)
    
    # Calculate totals
    total_distance = sum(log['distance_km'] for log in enriched_logs if log['distance_km'])
    total_fuel_liters = sum(log['fuel_quantity'] for log in enriched_logs)
    total_fuel_spent = sum(log['total_cost'] for log in enriched_logs)
    total_expense_spent = sum(exp.amount for exp in expenses)
    total_vehicle_cost = total_fuel_spent + total_expense_spent
    
    # Calculate valid mileages
    valid_mileages = [log['mileage_kmpl'] for log in enriched_logs if log['mileage_kmpl'] is not None]
    
    avg_mileage = None
    best_mileage = None
    worst_mileage = None
    
    if valid_mileages:
        avg_mileage = round(sum(valid_mileages) / len(valid_mileages), 2)
        best_mileage = round(max(valid_mileages), 2)
        worst_mileage = round(min(valid_mileages), 2)
        
    avg_cost_per_km = None
    if total_distance > 0:
        avg_cost_per_km = round(total_vehicle_cost / total_distance, 2)
        
    # Expense by category
    expense_categories = defaultdict(lambda: {"total": 0.0, "count": 0})
    for exp in expenses:
        expense_categories[exp.category]["total"] += exp.amount
        expense_categories[exp.category]["count"] += 1
        
    category_breakdown = [
        schemas.CategoryBreakdown(
            category=cat, 
            total_amount=round(data["total"], 2), 
            count=data["count"]
        ) for cat, data in expense_categories.items()
    ]
    
    monthly_breakdown = get_monthly_breakdown(db, vehicle_id)
    
    return schemas.MileageStats(
        vehicle_id=vehicle_id,
        total_distance_km=round(total_distance, 2),
        total_fuel_liters=round(total_fuel_liters, 2),
        total_fuel_spent=round(total_fuel_spent, 2),
        total_expense_spent=round(total_expense_spent, 2),
        total_vehicle_cost=round(total_vehicle_cost, 2),
        avg_mileage_kmpl=avg_mileage,
        avg_cost_per_km=avg_cost_per_km,
        best_mileage_kmpl=best_mileage,
        worst_mileage_kmpl=worst_mileage,
        expense_by_category=category_breakdown,
        monthly_breakdown=monthly_breakdown
    )
