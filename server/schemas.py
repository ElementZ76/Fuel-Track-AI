"""
Pydantic schemas for FuelTrack AI.

Organized into:
    - Input schemas (Create/Update) — what the API receives
    - Output schemas (Read) — what the API returns
    - Stats schemas — computed aggregation results

All schemas follow the Data Schema defined in gemini.md (Project Constitution).
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# USER SCHEMAS
# =============================================================================

class UserCreate(BaseModel):
    """Input: Create a new user."""
    username: str = Field(..., min_length=1, max_length=50, description="Unique username")
    pin: str = Field(..., min_length=4, max_length=4, description="4-digit PIN")
    display_name: Optional[str] = Field(None, max_length=100, description="Display name")

    @field_validator("pin")
    @classmethod
    def pin_must_be_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("PIN must be exactly 4 digits")
        return v

    @field_validator("username")
    @classmethod
    def username_must_be_clean(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Username cannot be empty")
        return v


class LoginRequest(BaseModel):
    """Input: Login with username + PIN."""
    username: str
    pin: str


class UserRead(BaseModel):
    """Output: User profile (never exposes PIN hash)."""
    id: int
    username: str
    display_name: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    """Output: Login result."""
    success: bool
    user: Optional[UserRead] = None
    message: str


# =============================================================================
# VEHICLE SCHEMAS
# =============================================================================

class VehicleCreate(BaseModel):
    """Input: Create a new vehicle."""
    user_id: int = Field(..., description="Owner user ID")
    name: str = Field(..., min_length=1, max_length=100, description="Vehicle name")
    make: Optional[str] = Field(None, max_length=50, description="Manufacturer, e.g., 'Honda'")
    model: Optional[str] = Field(None, max_length=50, description="Model, e.g., 'City'")
    year: Optional[int] = Field(None, ge=1900, le=2100, description="Manufacturing year")
    fuel_type: str = Field("petrol", description="petrol | diesel | cng | electric")
    plate: Optional[str] = Field(None, max_length=20, description="License plate")
    tank_capacity: Optional[float] = Field(None, gt=0, description="Tank size in liters")
    initial_odometer: float = Field(0.0, ge=0, description="Starting odometer in km")
    notes: Optional[str] = Field(None, description="Optional notes")

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: str) -> str:
        valid = ["petrol", "diesel", "cng", "electric"]
        v = v.strip().lower()
        if v not in valid:
            raise ValueError(f"fuel_type must be one of: {', '.join(valid)}")
        return v


class VehicleUpdate(BaseModel):
    """Input: Update vehicle fields (all optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    make: Optional[str] = Field(None, max_length=50)
    model: Optional[str] = Field(None, max_length=50)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    fuel_type: Optional[str] = None
    plate: Optional[str] = Field(None, max_length=20)
    tank_capacity: Optional[float] = Field(None, gt=0)
    initial_odometer: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ["petrol", "diesel", "cng", "electric"]
        v = v.strip().lower()
        if v not in valid:
            raise ValueError(f"fuel_type must be one of: {', '.join(valid)}")
        return v


class VehicleRead(BaseModel):
    """Output: Full vehicle profile."""
    id: int
    user_id: int
    name: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: str
    plate: Optional[str] = None
    tank_capacity: Optional[float] = None
    initial_odometer: float
    notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# =============================================================================
# FUEL LOG SCHEMAS
# =============================================================================

class FuelLogCreate(BaseModel):
    """
    Input: Add a fuel log entry.
    total_cost is auto-computed as fuel_quantity × price_per_liter.
    """
    vehicle_id: int = Field(..., description="Vehicle this log belongs to")
    date: datetime.date = Field(..., description="Date of fill-up")
    odometer_reading: float = Field(..., gt=0, description="Current odometer in km")
    fuel_quantity: float = Field(..., gt=0, description="Liters filled")
    price_per_liter: float = Field(..., gt=0, description="₹ per liter")
    is_full_tank: bool = Field(True, description="Full tank fill-up?")
    fuel_type: Optional[str] = Field(None, description="petrol | diesel | cng")
    station_name: Optional[str] = Field(None, description="Fuel station name")
    missed: bool = Field(False, description="Was a fill-up missed before this one?")
    notes: Optional[str] = Field(None, description="Optional notes")

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ["petrol", "diesel", "cng"]
        v = v.strip().lower()
        if v not in valid:
            raise ValueError(f"fuel_type must be one of: {', '.join(valid)}")
        return v


class FuelLogUpdate(BaseModel):
    """Input: Update a fuel log entry (all optional)."""
    date: Optional[datetime.date] = None
    odometer_reading: Optional[float] = Field(None, gt=0)
    fuel_quantity: Optional[float] = Field(None, gt=0)
    price_per_liter: Optional[float] = Field(None, gt=0)
    is_full_tank: Optional[bool] = None
    fuel_type: Optional[str] = None
    station_name: Optional[str] = None
    missed: Optional[bool] = None
    notes: Optional[str] = None

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ["petrol", "diesel", "cng"]
        v = v.strip().lower()
        if v not in valid:
            raise ValueError(f"fuel_type must be one of: {', '.join(valid)}")
        return v


class FuelLogRead(BaseModel):
    """
    Output: Fuel log entry with computed mileage.
    distance_km and mileage_kmpl are computed from the previous log entry.
    """
    id: int
    vehicle_id: int
    date: datetime.date
    odometer_reading: float
    fuel_quantity: float
    price_per_liter: float
    total_cost: float
    is_full_tank: bool
    fuel_type: str
    station_name: Optional[str] = None
    missed: bool
    notes: Optional[str] = None
    created_at: datetime.datetime
    # Computed fields — populated by the service layer
    distance_km: Optional[float] = None
    mileage_kmpl: Optional[float] = None

    model_config = {"from_attributes": True}


# =============================================================================
# EXPENSE SCHEMAS
# =============================================================================

# Fixed expense categories for v1 (not user-customizable)
VALID_EXPENSE_CATEGORIES = [
    "maintenance", "insurance", "service", "parking",
    "tolls", "wash", "repairs", "tires", "other"
]


class ExpenseCreate(BaseModel):
    """Input: Add a non-fuel expense."""
    vehicle_id: int = Field(..., description="Vehicle this expense belongs to")
    date: datetime.date = Field(..., description="Date of expense")
    category: str = Field(..., description="Expense category")
    title: str = Field(..., min_length=1, max_length=200, description="Expense title")
    amount: float = Field(..., gt=0, description="₹ cost")
    odometer_reading: Optional[float] = Field(None, ge=0, description="Odometer at time of expense")
    notes: Optional[str] = Field(None, description="Optional details")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(
                f"category must be one of: {', '.join(VALID_EXPENSE_CATEGORIES)}"
            )
        return v


class ExpenseUpdate(BaseModel):
    """Input: Update an expense entry (all optional)."""
    date: Optional[datetime.date] = None
    category: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    odometer_reading: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(
                f"category must be one of: {', '.join(VALID_EXPENSE_CATEGORIES)}"
            )
        return v


class ExpenseRead(BaseModel):
    """Output: Expense entry."""
    id: int
    vehicle_id: int
    date: datetime.date
    category: str
    title: str
    amount: float
    odometer_reading: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# =============================================================================
# STATS SCHEMAS
# =============================================================================

class CategoryBreakdown(BaseModel):
    """Output: Expense totals by category."""
    category: str
    total_amount: float
    count: int


class MonthlyBreakdown(BaseModel):
    """Output: Monthly cost breakdown (fuel + expenses combined)."""
    month: str  # YYYY-MM format
    distance_km: float
    fuel_liters: float
    fuel_cost: float
    expense_cost: float
    total_cost: float  # fuel_cost + expense_cost
    avg_mileage: Optional[float] = None  # None if no valid mileage data


class MileageStats(BaseModel):
    """Output: Overall vehicle statistics (fuel + expenses aggregated)."""
    vehicle_id: int
    total_distance_km: float
    total_fuel_liters: float
    total_fuel_spent: float
    total_expense_spent: float
    total_vehicle_cost: float  # fuel + expenses combined
    avg_mileage_kmpl: Optional[float] = None
    avg_cost_per_km: Optional[float] = None
    best_mileage_kmpl: Optional[float] = None
    worst_mileage_kmpl: Optional[float] = None
    expense_by_category: list[CategoryBreakdown] = []
    monthly_breakdown: list[MonthlyBreakdown] = []
