import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

import pyotp

client = TestClient(app)

@pytest.fixture
def admin_token():
    step1 = client.post("/api/v1/auth/login", json={"email": "tpo@sanjivani.edu.in", "password": "Admin@1234"})
    assert step1.status_code == 200
    temp_token = step1.json()["temp_token"]
    totp_code = pyotp.TOTP("JBSWY3DPEHPK3PXP").now()
    step2 = client.post("/api/v1/auth/2fa/login", json={"temp_token": temp_token, "totp_code": totp_code})
    assert step2.status_code == 200
    return step2.json()["access_token"]

@pytest.fixture
def faculty_token():
    res = client.post("/api/v1/auth/login", json={"email": "sunita.sharma@sanjivani.edu.in", "password": "Faculty@1234"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_evaluations_list(faculty_token):
    res = client.get("/api/v1/evaluations", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_eval = data[0]
    assert "technical_score" in first_eval
    assert "overall_score" in first_eval
    assert "hiring_recommendation" in first_eval

def test_reports_dashboard(admin_token):
    res = client.get("/api/v1/reports/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "overview" in data
    assert data["overview"]["total_students"] > 0
    assert "status_distribution" in data
    assert "domain_distribution" in data
    assert "monthly_trends" in data
    assert "top_companies" in data
    assert "top_students" in data

def test_export_applications_csv(admin_token):
    res = client.get("/api/v1/reports/export/applications/csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    assert "Application ID" in content
    assert "Student Name" in content

def test_export_placements_csv(admin_token):
    res = client.get("/api/v1/reports/export/placements/csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    assert "Student ID" in content
    assert "Placement Status" in content

def test_system_settings_crud(admin_token):
    # Get settings
    res = client.get("/api/v1/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    settings = res.json()
    assert len(settings) > 0

    # Update a setting
    res_update = client.put(
        "/api/v1/settings/ACADEMIC_YEAR",
        json={"value": "2025-2026", "description": "Active year session"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["value"] == "2025-2026"

def test_audit_logs(admin_token):
    res = client.get("/api/v1/audit-logs?limit=10", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert "action" in logs[0]
    assert "entity_type" in logs[0]

def test_student_deactivate_and_activate(admin_token):
    # Student #3 is a student from seed
    res_deact = client.post("/api/v1/students/3/deactivate", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_deact.status_code == 200
    assert "deactivated" in res_deact.json()["message"]

    res_act = client.post("/api/v1/students/3/activate", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_act.status_code == 200
    assert "reactivated" in res_act.json()["message"]
