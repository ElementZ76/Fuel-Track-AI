"""
Expenses router for FuelTrack AI.
Handles CRUD for non-fuel vehicle expenses.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server import models, schemas

router = APIRouter(prefix="/vehicles/{vehicle_id}/expenses", tags=["Expenses"])


@router.post("/", response_model=schemas.ExpenseRead, status_code=status.HTTP_201_CREATED)
def add_expense(vehicle_id: int, expense_create: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    """
    Add a new non-fuel expense for a vehicle.
    """
    if expense_create.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Vehicle ID in path must match body"
        )
        
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_expense = models.Expense(**expense_create.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense


@router.get("/", response_model=List[schemas.ExpenseRead])
def get_expenses(
    vehicle_id: int, 
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """
    List expenses for a vehicle, optionally filtered by category.
    Ordered by date descending.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    query = db.query(models.Expense).filter(models.Expense.vehicle_id == vehicle_id)
    
    if category:
        query = query.filter(models.Expense.category == category.strip().lower())
        
    return query.order_by(models.Expense.date.desc()).all()


@router.get("/{exp_id}", response_model=schemas.ExpenseRead)
def get_expense(vehicle_id: int, exp_id: int, db: Session = Depends(get_db)):
    """
    Get a single expense entry.
    """
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == exp_id,
        models.Expense.vehicle_id == vehicle_id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    return db_expense


@router.put("/{exp_id}", response_model=schemas.ExpenseRead)
def update_expense(
    vehicle_id: int, 
    exp_id: int, 
    expense_update: schemas.ExpenseUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update an expense entry.
    """
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == exp_id,
        models.Expense.vehicle_id == vehicle_id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    
    return db_expense


@router.delete("/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(vehicle_id: int, exp_id: int, db: Session = Depends(get_db)):
    """
    Delete an expense entry.
    """
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == exp_id,
        models.Expense.vehicle_id == vehicle_id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(db_expense)
    db.commit()
    return None
