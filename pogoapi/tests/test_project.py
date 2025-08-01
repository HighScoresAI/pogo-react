import pytest
from bson import ObjectId

BASE_URL = "/projects"

@pytest.fixture
async def test_user(async_client):
    """Create a test user and return their ID"""
    user_data = {
        "userId": "test@example.com",
        "name": "Test User",
        "provider": "local"
    }
    result = await async_client.app.mongodb.users.insert_one(user_data)
    return str(result.inserted_id)

@pytest.mark.asyncio
async def test_create_project(async_client, test_user):
    response = await async_client.post(f"{BASE_URL}/", json={
        "name": "Test Project",
        "createdBy": test_user  # Using actual ObjectId from users collection
    })
    assert response.status_code == 200
    assert "Project created" in response.json()["message"]
    global project_id
    project_id = response.json()["projectId"]

@pytest.mark.asyncio
async def test_delete_project(async_client):
    response = await async_client.delete(f"{BASE_URL}/{project_id}")
    assert response.status_code == 200
    assert "Project deleted" in response.json()["message"]
