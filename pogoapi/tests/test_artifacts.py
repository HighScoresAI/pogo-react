import pytest

BASE_URL = "/artifacts"

@pytest.mark.asyncio
async def test_upload_artifact(async_client):
    files = {"file": ("test_audio.wav", b"fake audio data")}
    response = await async_client.post(f"{BASE_URL}/upload", params={
        "sessionId": "dummy_session_id", "captureType": "audio"
    }, files=files)
    assert response.status_code == 200
    assert "Artifact uploaded" in response.json()["message"]
