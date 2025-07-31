#!/usr/bin/env python3
"""
Comprehensive API endpoint test script for Pogo application
Tests all the endpoints specified in the API documentation
"""

import requests
import json
import os
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000"

# Test data
TEST_USER_ID = "507f1f77bcf86cd799439011"
TEST_ORG_ID = "507f1f77bcf86cd799439012"
TEST_PROJECT_ID = "507f1f77bcf86cd799439013"
TEST_SESSION_ID = "507f1f77bcf86cd799439014"
TEST_ARTIFACT_ID = "507f1f77bcf86cd799439015"

def test_organization_endpoints():
    """Test organization-related endpoints"""
    print("=== Testing Organization Endpoints ===")
    
    # Test POST /organizations/
    print("\n1. Testing POST /organizations/")
    org_data = {
        "name": "Test Organization",
        "createdBy": TEST_USER_ID
    }
    try:
        response = requests.post(f"{BASE_URL}/organizations/", json=org_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            org_id = response.json().get("_id")
            print(f"✅ Organization created with ID: {org_id}")
        else:
            print("❌ Organization creation failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test DELETE /organizations/<organizationId>
    print("\n2. Testing DELETE /organizations/<organizationId>")
    try:
        response = requests.delete(f"{BASE_URL}/organizations/{TEST_ORG_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Organization deletion endpoint working")
        else:
            print("❌ Organization deletion failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test PUT /organizations/<organizationId>/rename
    print("\n3. Testing PUT /organizations/<organizationId>/rename")
    rename_data = {"name": "Renamed Organization"}
    try:
        response = requests.put(f"{BASE_URL}/organizations/{TEST_ORG_ID}/rename", json=rename_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Organization rename endpoint working")
        else:
            print("❌ Organization rename failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /organizations/<organizationId>/projects
    print("\n4. Testing GET /organizations/<organizationId>/projects")
    try:
        response = requests.get(f"{BASE_URL}/organizations/{TEST_ORG_ID}/projects")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Organization projects endpoint working")
        else:
            print("❌ Organization projects failed")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_project_endpoints():
    """Test project-related endpoints"""
    print("\n=== Testing Project Endpoints ===")
    
    # Test POST /projects/
    print("\n1. Testing POST /projects/")
    project_data = {
        "projectName": "Test Project",
        "createdBy": TEST_USER_ID,
        "organization": TEST_ORG_ID
    }
    try:
        response = requests.post(f"{BASE_URL}/projects/", json=project_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            print("✅ Project creation endpoint working")
        else:
            print("❌ Project creation failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test PUT /projects/<projectId>/role/<userId>
    print("\n2. Testing PUT /projects/<projectId>/role/<userId>")
    role_data = {"role": "admin"}
    try:
        response = requests.put(f"{BASE_URL}/projects/{TEST_PROJECT_ID}/role/{TEST_USER_ID}", json=role_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project role update endpoint working")
        else:
            print("❌ Project role update failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test POST /projects/<projectId>/members
    print("\n3. Testing POST /projects/<projectId>/members")
    member_data = {
        "userId": TEST_USER_ID,
        "role": "member"
    }
    try:
        response = requests.post(f"{BASE_URL}/projects/{TEST_PROJECT_ID}/members", json=member_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project member addition endpoint working")
        else:
            print("❌ Project member addition failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test DELETE /projects/<projectId>/members/<userId>
    print("\n4. Testing DELETE /projects/<projectId>/members/<userId>")
    try:
        response = requests.delete(f"{BASE_URL}/projects/{TEST_PROJECT_ID}/members/{TEST_USER_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project member removal endpoint working")
        else:
            print("❌ Project member removal failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test PUT /projects/<projectId>/rename
    print("\n5. Testing PUT /projects/<projectId>/rename")
    rename_data = {"projectName": "Renamed Project"}
    try:
        response = requests.put(f"{BASE_URL}/projects/{TEST_PROJECT_ID}/rename", json=rename_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project rename endpoint working")
        else:
            print("❌ Project rename failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /projects/organization/<organizationId>
    print("\n6. Testing GET /projects/organization/<organizationId>")
    try:
        response = requests.get(f"{BASE_URL}/projects/organization/{TEST_ORG_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Organization projects list endpoint working")
        else:
            print("❌ Organization projects list failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /projects/<projectId>/sessions
    print("\n7. Testing GET /projects/<projectId>/sessions")
    try:
        response = requests.get(f"{BASE_URL}/projects/{TEST_PROJECT_ID}/sessions")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project sessions list endpoint working")
        else:
            print("❌ Project sessions list failed")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_session_endpoints():
    """Test session-related endpoints"""
    print("\n=== Testing Session Endpoints ===")
    
    # Test POST /sessions/
    print("\n1. Testing POST /sessions/")
    session_data = {
        "projectId": TEST_PROJECT_ID,
        "createdBy": TEST_USER_ID
    }
    try:
        response = requests.post(f"{BASE_URL}/sessions/", json=session_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            print("✅ Session creation endpoint working")
        else:
            print("❌ Session creation failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /sessions/<sessionId>/storage-path
    print("\n2. Testing GET /sessions/<sessionId>/storage-path")
    try:
        response = requests.get(f"{BASE_URL}/sessions/{TEST_SESSION_ID}/storage-path")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Session storage path endpoint working")
        else:
            print("❌ Session storage path failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /sessions/project/<projectId>
    print("\n3. Testing GET /sessions/project/<projectId>")
    try:
        response = requests.get(f"{BASE_URL}/sessions/project/{TEST_PROJECT_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Project sessions list endpoint working")
        else:
            print("❌ Project sessions list failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test DELETE /sessions/<sessionId>
    print("\n4. Testing DELETE /sessions/<sessionId>")
    try:
        response = requests.delete(f"{BASE_URL}/sessions/{TEST_SESSION_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Session deletion endpoint working")
        else:
            print("❌ Session deletion failed")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_artifact_endpoints():
    """Test artifact-related endpoints"""
    print("\n=== Testing Artifact Endpoints ===")
    
    # Test POST /artifacts/audio
    print("\n1. Testing POST /artifacts/audio")
    try:
        # Create a dummy audio file for testing
        with open("test_audio.mp3", "wb") as f:
            f.write(b"dummy audio content")
        
        with open("test_audio.mp3", "rb") as audio_file:
            files = {'file': ('test_audio.mp3', audio_file, 'audio/mpeg')}
            data = {'sessionId': TEST_SESSION_ID}
            response = requests.post(f"{BASE_URL}/artifacts/upload/audio", files=files, data=data)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 201, 404]:
            print("✅ Audio upload endpoint working")
        else:
            print("❌ Audio upload failed")
        
        # Clean up test file
        os.remove("test_audio.mp3")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test POST /artifacts/image
    print("\n2. Testing POST /artifacts/image")
    try:
        # Create a dummy image file for testing
        with open("test_image.jpg", "wb") as f:
            f.write(b"dummy image content")
        
        with open("test_image.jpg", "rb") as image_file:
            files = {'file': ('test_image.jpg', image_file, 'image/jpeg')}
            data = {'sessionId': TEST_SESSION_ID}
            response = requests.post(f"{BASE_URL}/artifacts/upload/image", files=files, data=data)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 201, 404]:
            print("✅ Image upload endpoint working")
        else:
            print("❌ Image upload failed")
        
        # Clean up test file
        os.remove("test_image.jpg")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_documentation_endpoints():
    """Test documentation-related endpoints"""
    print("\n=== Testing Documentation Endpoints ===")
    
    # Test GET /documentation/<artifact_id>
    print("\n1. Testing GET /documentation/<artifact_id>")
    try:
        response = requests.get(f"{BASE_URL}/api/documentation/documentation/{TEST_ARTIFACT_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Documentation by artifact endpoint working")
        else:
            print("❌ Documentation by artifact failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /documentation/by-id/<documentation_id>
    print("\n2. Testing GET /documentation/by-id/<documentation_id>")
    try:
        response = requests.get(f"{BASE_URL}/api/documentation/documentation/by-id/{TEST_ARTIFACT_ID}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Documentation by ID endpoint working")
        else:
            print("❌ Documentation by ID failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test POST /documentation/<sessionId>/generate
    print("\n3. Testing POST /documentation/<sessionId>/generate")
    try:
        response = requests.post(f"{BASE_URL}/api/documentation/{TEST_SESSION_ID}/generate")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Documentation generation endpoint working")
        else:
            print("❌ Documentation generation failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test PUT /documentation/<documentation_id>
    print("\n4. Testing PUT /documentation/<documentation_id>")
    update_data = {"content": "Updated documentation content"}
    try:
        response = requests.put(f"{BASE_URL}/api/documentation/{TEST_ARTIFACT_ID}", json=update_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Documentation update endpoint working")
        else:
            print("❌ Documentation update failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test PUT /documentation/<documentation_id>/status
    print("\n5. Testing PUT /documentation/<documentation_id>/status")
    status_data = {"status": "completed"}
    try:
        response = requests.put(f"{BASE_URL}/api/documentation/{TEST_ARTIFACT_ID}/status", json=status_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code in [200, 404]:
            print("✅ Documentation status update endpoint working")
        else:
            print("❌ Documentation status update failed")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_root_endpoint():
    """Test the root endpoint to verify server is running"""
    print("=== Testing Root Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            print("✅ Server is running and accessible")
            return True
        else:
            print("❌ Server is not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Server is not running: {e}")
        return False

if __name__ == "__main__":
    print("=== Pogo API Endpoint Test Suite ===")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now()}")
    
    # Test root endpoint first
    if not test_root_endpoint():
        print("\n❌ Cannot connect to server. Please ensure the backend is running.")
        exit(1)
    
    # Run all endpoint tests
    test_organization_endpoints()
    test_project_endpoints()
    test_session_endpoints()
    test_artifact_endpoints()
    test_documentation_endpoints()
    
    print("\n=== Test Suite Complete ===")
    print("Note: 404 responses are expected for non-existent test IDs")
    print("200 responses indicate the endpoints are working correctly") 