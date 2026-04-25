"""
SQLAlchemy ORM models for FuelTrack AI.

Tables:
    - User: Lightweight user profiles for multi-user switching
    - Vehicle: Vehicle profiles scoped per user
    - FuelLog: Individual fuel fill-up records
    - Expense: Non-fuel vehicle expenses (maintenance, insurance, etc.)

Relationships:
    User → Vehicle (one-to-many, cascade delete)
    Vehicle → FuelLog (one-to-many, cascade delete)
    Vehicle → Expense (one-to-many, cascade delete)
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from server.database import Base


class User(Base):
    """
    Lightweight user profile for login/switching.
    PIN is hashed with SHA-256 (not bcrypt — keeping it light).
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    pin_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class Vehicle(Base):
    """
    Vehicle profile with identifying details and specs.
    Each vehicle belongs to a single user.
    """
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    make = Column(String, nullable=True)
    model = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    fuel_type = Column(String, default="petrol")  # petrol | diesel | cng | electric
    plate = Column(String, nullable=True)  # License plate, e.g., 'KA01AB1234'
    tank_capacity = Column(Float, nullable=True)  # Fuel tank size in liters
    initial_odometer = Column(Float, default=0.0)  # Starting odometer in km
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    fuel_logs = relationship("FuelLog", back_populates="vehicle", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="vehicle", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Vehicle(id={self.id}, name='{self.name}')>"


class FuelLog(Base):
    """
    Individual fuel fill-up record.

    Mileage calculation rules:
    - Accurate km/L requires is_full_tank=True AND missed=False
      on BOTH the current entry and the previous entry.
    - total_cost is auto-computed: fuel_quantity × price_per_liter
    """
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    odometer_reading = Column(Float, nullable=False, index=True)  # Current odometer in km
    fuel_quantity = Column(Float, nullable=False)  # Liters filled
    price_per_liter = Column(Float, nullable=False)  # ₹ per liter
    total_cost = Column(Float, nullable=False)  # Auto-computed: fuel_quantity × price_per_liter
    is_full_tank = Column(Boolean, default=True)  # Needed for accurate mileage calc
    fuel_type = Column(String, default="petrol")  # petrol | diesel | cng
    station_name = Column(String, nullable=True)  # e.g., 'HP Petrol Pump, MG Road'
    missed = Column(Boolean, default=False)  # If True, a fill-up was missed before this entry
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="fuel_logs")

    def __repr__(self):
        return f"<FuelLog(id={self.id}, date={self.date}, odo={self.odometer_reading})>"


class Expense(Base):
    """
    Non-fuel vehicle expense.

    Categories (fixed in v1, not user-customizable):
        maintenance, insurance, service, parking, tolls, wash, repairs, tires, other
    """
    __tablename__ = "expenses"

    # Valid expense categories
    VALID_CATEGORIES = [
        "maintenance", "insurance", "service", "parking",
        "tolls", "wash", "repairs", "tires", "other"
    ]

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # One of VALID_CATEGORIES
    title = Column(String, nullable=False)  # e.g., 'Oil Change', 'Annual Insurance'
    amount = Column(Float, nullable=False)  # ₹ cost
    odometer_reading = Column(Float, nullable=True)  # Odometer at time of expense (optional)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="expenses")

    def __repr__(self):
        return f"<Expense(id={self.id}, category='{self.category}', title='{self.title}')>"
