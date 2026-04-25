"""
Unit tests for the Vehicles router.
"""

import pytest

@pytest.fixture
def test_user(client):
    response = client.post("/api/users/", json={"username": "owner", "pin": "0000"})
    return response.json()

def test_create_vehicle(client, test_user):
    user_id = test_user["id"]
    response = client.post("/api/vehicles/", json={
        "user_id": user_id,
        "name": "My Car",
        "make": "Honda",
        "model": "City",
        "year": 2022,
        "fuel_type": "petrol",
        "initial_odometer": 1000.5
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Car"
    assert data["initial_odometer"] == 1000.5

def test_create_vehicle_invalid_user(client):
    response = client.post("/api/vehicles/", json={
        "user_id": 999,
        "name": "Ghost Car"
    })
    assert response.status_code == 404

def test_get_vehicles(client, test_user):
    user_id = test_user["id"]
    client.post("/api/vehicles/", json={"user_id": user_id, "name": "Car 1"})
    client.post("/api/vehicles/", json={"user_id": user_id, "name": "Car 2"})
    
    # Another user
    other = client.post("/api/users/", json={"username": "other", "pin": "1111"}).json()
    client.post("/api/vehicles/", json={"user_id": other["id"], "name": "Car 3"})
    
    # Get all
    res_all = client.get("/api/vehicles/")
    assert len(res_all.json()) == 3
    
    # Filter by user
    res_filtered = client.get(f"/api/vehicles/?user_id={user_id}")
    assert len(res_filtered.json()) == 2

def test_update_vehicle(client, test_user):
    vehicle = client.post("/api/vehicles/", json={
        "user_id": test_user["id"], 
        "name": "Old Name"
    }).json()
    
    vid = vehicle["id"]
    response = client.put(f"/api/vehicles/{vid}", json={"name": "New Name", "year": 2023})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["year"] == 2023

def test_delete_vehicle(client, test_user):
    vehicle = client.post("/api/vehicles/", json={
        "user_id": test_user["id"], 
        "name": "Delete Me"
    }).json()
    
    vid = vehicle["id"]
    response = client.delete(f"/api/vehicles/{vid}")
    assert response.status_code == 204
    
    get_res = client.get(f"/api/vehicles/{vid}")
    assert get_res.status_code == 404
