"""
Unit tests for the Auth router.
"""

def test_create_user(client):
    response = client.post("/api/users/", json={
        "username": "testuser",
        "pin": "1234",
        "display_name": "Test User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["display_name"] == "Test User"
    assert "pin_hash" not in data
    assert "id" in data

def test_create_user_duplicate_username(client):
    client.post("/api/users/", json={"username": "testuser", "pin": "1234"})
    response = client.post("/api/users/", json={"username": "testuser", "pin": "5678"})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_invalid_pin(client):
    response = client.post("/api/users/", json={"username": "testuser", "pin": "123"})
    assert response.status_code == 422 # Pydantic validation error

def test_get_users(client):
    client.post("/api/users/", json={"username": "user1", "pin": "1111"})
    client.post("/api/users/", json={"username": "user2", "pin": "2222"})
    
    response = client.get("/api/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_login_success(client):
    client.post("/api/users/", json={"username": "tester", "pin": "9999"})
    
    response = client.post("/api/users/auth/login", json={
        "username": "tester",
        "pin": "9999"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["username"] == "tester"

def test_login_invalid_pin(client):
    client.post("/api/users/", json={"username": "tester", "pin": "9999"})
    
    response = client.post("/api/users/auth/login", json={
        "username": "tester",
        "pin": "0000"
    })
    assert response.status_code == 401
    assert "Incorrect PIN" in response.json()["detail"]

def test_login_user_not_found(client):
    response = client.post("/api/users/auth/login", json={
        "username": "nobody",
        "pin": "1234"
    })
    assert response.status_code == 404
