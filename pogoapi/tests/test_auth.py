import pytest

BASE_URL = "/auth"

@pytest.mark.asyncio
async def test_signup(async_client):
    response = await async_client.post("/auth/signup", json={
        "name": "Test User",
        "userId": "test@example.com",
        "password": "testpassword",
        "provider": "local"
    })
    print(response.json())  # Debug response
    assert response.status_code == 200, response.json()

@pytest.mark.asyncio
async def test_login(async_client):
    response = await async_client.post(f"{BASE_URL}/login", json={
        "userId": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "Login successful" in response.json()["message"]

@pytest.mark.asyncio
async def test_login(async_client):
    response = await async_client.post("/auth/login", json={
        "userId": "test@example.com",
        "password": "testpassword"
    })
    print(response.json())  # Debug response
    assert response.status_code == 200, response.json()