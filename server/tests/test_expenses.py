"""
Unit tests for the Expenses router.
"""

import pytest

@pytest.fixture
def vehicle_id(client):
    user = client.post("/api/users/", json={"username": "driver2", "pin": "1234"}).json()
    vehicle = client.post("/api/vehicles/", json={
        "user_id": user["id"],
        "name": "Expense Tester"
    }).json()
    return vehicle["id"]

def test_add_expense(client, vehicle_id):
    response = client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id,
        "date": "2023-10-05",
        "category": "maintenance",
        "title": "Oil Change",
        "amount": 2500.0,
        "odometer_reading": 5000.0
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Oil Change"
    assert data["amount"] == 2500.0

def test_add_expense_invalid_category(client, vehicle_id):
    response = client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id,
        "date": "2023-10-05",
        "category": "groceries", # Invalid
        "title": "Snacks",
        "amount": 500.0
    })
    assert response.status_code == 422
    assert "category must be one of" in response.json()["detail"][0]["msg"]

def test_get_expenses_filtered(client, vehicle_id):
    client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-01", "category": "tolls", "title": "Toll 1", "amount": 100.0
    })
    client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-02", "category": "tolls", "title": "Toll 2", "amount": 100.0
    })
    client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-03", "category": "wash", "title": "Car Wash", "amount": 500.0
    })
    
    # Get all
    res_all = client.get(f"/api/vehicles/{vehicle_id}/expenses/")
    assert len(res_all.json()) == 3
    
    # Filter
    res_tolls = client.get(f"/api/vehicles/{vehicle_id}/expenses/?category=tolls")
    assert len(res_tolls.json()) == 2
    
    res_wash = client.get(f"/api/vehicles/{vehicle_id}/expenses/?category=wash")
    assert len(res_wash.json()) == 1

def test_delete_expense(client, vehicle_id):
    exp = client.post(f"/api/vehicles/{vehicle_id}/expenses/", json={
        "vehicle_id": vehicle_id, "date": "2023-10-01", "category": "tolls", "title": "Toll", "amount": 100.0
    }).json()
    
    res = client.delete(f"/api/vehicles/{vehicle_id}/expenses/{exp['id']}")
    assert res.status_code == 204
    
    get_res = client.get(f"/api/vehicles/{vehicle_id}/expenses/{exp['id']}")
    assert get_res.status_code == 404
