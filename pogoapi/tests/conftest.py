import pytest
import httpx
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main1 import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
async def async_client():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        yield client

@pytest.fixture
async def test_create_session(async_client):
    """Fixture to create a session and return its ID."""
    response = await async_client.post("/sessions/", json={
        "projectId": "dummy_project_id",
        "createdBy": "test@example.com"
    })
    assert response.status_code == 200, response.json()
    return response.json()["sessionId"]
