import pytest
import pyotp
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_admin_with_2fa():
    # Step 1: Password validation returns 2FA challenge
    step1 = client.post("/api/v1/auth/login", json={
        "email": "tpo@sanjivani.edu.in",
        "password": "Admin@1234"
    })
    assert step1.status_code == 200
    data1 = step1.json()
    assert data1["requires_2fa"] is True
    temp_token = data1["temp_token"]

    # Step 2: Resolve with TOTP code
    totp_code = pyotp.TOTP("JBSWY3DPEHPK3PXP").now()
    step2 = client.post("/api/v1/auth/2fa/login", json={
        "temp_token": temp_token,
        "totp_code": totp_code
    })
    assert step2.status_code == 200
    data2 = step2.json()
    assert "access_token" in data2
    assert data2["user"]["role"] == "ADMIN"
    assert data2["user"]["two_factor_enabled"] is True

def test_login_faculty():
    response = client.post("/api/v1/auth/login", json={
        "email": "sunita.sharma@sanjivani.edu.in",
        "password": "Faculty@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "FACULTY"

def test_login_student():
    response = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@student.sanjivani.edu.in",
        "password": "Student@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@student.sanjivani.edu.in",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401

def test_get_current_user_profile():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@student.sanjivani.edu.in",
        "password": "Student@1234"
    })
    token = login_res.json()["access_token"]
    
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "aarav.sharma@student.sanjivani.edu.in"
    assert res.json()["email_verified"] is True
