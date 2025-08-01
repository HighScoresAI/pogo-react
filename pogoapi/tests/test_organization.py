import pytest

BASE_URL = "/organizations"

@pytest.mark.asyncio
async def test_create_organization(async_client):
    response = await async_client.post("/organizations/", json={
        "name": "Test Organization",
        "createdBy": "test_user_123"
    })
    assert response.status_code == 200
    org_id = response.json()["organizationId"]
    return org_id

@pytest.mark.asyncio
async def test_delete_organization(async_client, test_create_organization):
    org_id = await test_create_organization  # Ensure valid ID
    response = await async_client.delete(f"/organizations/{org_id}")
    print(response.json())  # Debugging
    assert response.status_code == 200, response.json()
