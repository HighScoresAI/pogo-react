import pytest

BASE_URL = "/sessions"

@pytest.mark.asyncio
async def test_create_session(async_client):
    """Creates a session and verifies it is created successfully."""
    response = await async_client.post(f"{BASE_URL}/", json={
        "projectId": "dummy_project_id",
        "createdBy": "test_user_123"
    })
    assert response.status_code == 200, response.json()
    session_id = response.json()["sessionId"]
    return session_id

@pytest.mark.asyncio
async def test_delete_session(async_client, test_create_session):
    """Deletes a session that was created using the fixture."""
    session_id = await test_create_session  # Retrieve session ID
    response = await async_client.delete(f"{BASE_URL}/{session_id}")
    assert response.status_code == 200, response.json()
