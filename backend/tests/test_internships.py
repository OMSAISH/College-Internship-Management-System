import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_internships_public():
    response = client.get("/api/v1/internships")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    # Check shape
    first = data[0]
    assert "title" in first
    assert "company" in first
    assert "stipend_amount" in first
    assert "duration_weeks" in first

def test_filter_internships_by_domain():
    response = client.get("/api/v1/internships?domain=Software Engineering")
    assert response.status_code == 200
    data = response.json()
    for item in data:
        assert item["domain"] == "Software Engineering"

def test_get_internship_detail():
    list_res = client.get("/api/v1/internships")
    first_id = list_res.json()[0]["id"]
    detail_res = client.get(f"/api/v1/internships/{first_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == first_id
