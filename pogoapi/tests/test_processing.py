import pytest

BASE_URL = "/process"

@pytest.mark.asyncio
async def test_process_session(async_client, test_create_session):
    session_id = await test_create_session
    response = await async_client.post(f"/process/sessions/{session_id}")
    print(response.json())  # Debugging
    assert response.status_code == 200, response.json()


@pytest.mark.asyncio
async def test_process_artifact(async_client):
    response = await async_client.post(f"{BASE_URL}/artifacts/dummy_artifact_id")
    assert response.status_code == 200
    assert "Artifact processed" in response.json()["message"]
