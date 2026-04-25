"""
Unit tests for Fuel Logs and Mileage calculation.
"""

import pytest

@pytest.fixture
def vehicle_id(client):
    user = client.post("/api/users/", json={"username": "driver", "pin": "1234"}).json()
    vehicle = client.post("/api/vehicles/", json={
        "user_id": user["id"],
        "name": "Mileage Tester",
        "initial_odometer": 100.0
    }).json()
    return vehicle["id"]

def test_add_fuel_log(client, vehicle_id):
    response = client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id,
        "date": "2023-10-01",
        "odometer_reading": 200.0,
        "fuel_quantity": 10.0,
        "price_per_liter": 100.0,
        "is_full_tank": True
    })
    assert response.status_code == 201
    data = response.json()
    assert data["total_cost"] == 1000.0  # 10 * 100

def test_fuel_log_mileage_sequence(client, vehicle_id):
    # 1. Base log (dist: 100, no mileage since it's first and compared to initial 100)
    # Actually initial odo is 100. Let's add log at 200.
    client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id,
        "date": "2023-10-01",
        "odometer_reading": 200.0,
        "fuel_quantity": 10.0,
        "price_per_liter": 100.0,
        "is_full_tank": True,
        "missed": False
    })
    
    # 2. Second log at 400 odo, 20L fuel -> dist: 200, fuel: 20 -> mileage: 10.0
    client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id,
        "date": "2023-10-10",
        "odometer_reading": 400.0,
        "fuel_quantity": 20.0,
        "price_per_liter": 100.0,
        "is_full_tank": True,
        "missed": False
    })
    
    # Fetch logs
    res = client.get(f"/api/vehicles/{vehicle_id}/fuel-logs/")
    logs = res.json()
    
    assert len(logs) == 2
    # They should be sorted by date desc usually? We return them in original order but reversed, 
    # so newest is first.
    # Check the newest one (400 odo)
    newest = logs[0]
    assert newest["odometer_reading"] == 400.0
    assert newest["distance_km"] == 200.0
    assert newest["mileage_kmpl"] == 10.0

def test_fuel_log_partial_fill_invalidates_mileage(client, vehicle_id):
    # Base
    client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-01", "odometer_reading": 200.0, 
        "fuel_quantity": 10.0, "price_per_liter": 100.0, "is_full_tank": False
    })
    # Next log
    client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-10", "odometer_reading": 400.0, 
        "fuel_quantity": 20.0, "price_per_liter": 100.0, "is_full_tank": True
    })
    
    res = client.get(f"/api/vehicles/{vehicle_id}/fuel-logs/")
    logs = res.json()
    newest = logs[0]
    # Prev was partial, so current mileage should be null
    assert newest["mileage_kmpl"] is None

def test_get_stats(client, vehicle_id):
    # Add expense
    client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-05", "category": "maintenance",
        "title": "Service", "amount": 1500.0
    })
    
    # Add fuel
    client.post(f"/api/vehicles/{vehicle_id}/fuel-logs/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-01", "odometer_reading": 200.0, 
        "fuel_quantity": 10.0, "price_per_liter": 100.0, "is_full_tank": True
    })
    
    res = client.get(f"/api/vehicles/{vehicle_id}/stats/")
    assert res.status_code == 200
    stats = res.json()
    
    assert stats["total_expense_spent"] == 1500.0
    assert stats["total_fuel_spent"] == 1000.0
    assert stats["total_vehicle_cost"] == 2500.0
    assert stats["total_distance_km"] == 100.0 # 200 - 100(initial)
