import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_demo_admin():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@demo.local",
        "password": "Admin@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_demo_faculty():
    response = client.post("/api/v1/auth/login", json={
        "email": "faculty@demo.local",
        "password": "Faculty@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "FACULTY"

def test_login_demo_student():
    response = client.post("/api/v1/auth/login", json={
        "email": "student@demo.local",
        "password": "Student@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "student@demo.local",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401

def test_get_current_user_profile():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@demo.local",
        "password": "Student@1234"
    })
    token = login_res.json()["access_token"]
    
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "student@demo.local"
