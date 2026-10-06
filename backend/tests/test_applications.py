import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

import pyotp

client = TestClient(app)

def test_student_applications_and_rbacs():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@student.sanjivani.edu.in",
        "password": "Student@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve student's applications
    my_apps = client.get("/api/v1/applications/my", headers=headers)
    assert my_apps.status_code == 200
    apps_data = my_apps.json()
    assert len(apps_data) >= 1

    # Student cannot access admin audit logs
    audit_res = client.get("/api/v1/audit-logs", headers=headers)
    assert audit_res.status_code == 403

def test_faculty_review_and_status_update():
    # Login as faculty
    fac_login = client.post("/api/v1/auth/login", json={
        "email": "sunita.sharma@sanjivani.edu.in",
        "password": "Faculty@1234"
    })
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # Faculty can list applications
    all_apps = client.get("/api/v1/applications", headers=fac_headers)
    assert all_apps.status_code == 200
    assert len(all_apps.json()) > 0
    target_app_id = all_apps.json()[0]["id"]

    # Faculty can update status
    update_res = client.put(
        f"/api/v1/applications/{target_app_id}/status",
        headers=fac_headers,
        json={
            "status": "SHORTLISTED",
            "comment": "Candidate shortlisted for technical round",
            "faculty_notes": "Impressive coding assessment result"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "SHORTLISTED"

def test_admin_analytics_dashboard():
    # Login as admin with mandatory 2FA
    step1 = client.post("/api/v1/auth/login", json={
        "email": "tpo@sanjivani.edu.in",
        "password": "Admin@1234"
    })
    assert step1.status_code == 200
    temp_token = step1.json()["temp_token"]
    totp_code = pyotp.TOTP("JBSWY3DPEHPK3PXP").now()
    step2 = client.post("/api/v1/auth/2fa/login", json={
        "temp_token": temp_token,
        "totp_code": totp_code
    })
    assert step2.status_code == 200
    admin_token = step2.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    dash = client.get("/api/v1/reports/dashboard", headers=admin_headers)
    assert dash.status_code == 200
    data = dash.json()
    assert "overview" in data
    assert data["overview"]["total_students"] >= 20
    assert data["overview"]["total_companies"] >= 10
    assert data["overview"]["active_internships"] >= 20
