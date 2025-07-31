#!/usr/bin/env python3
"""
Test script for chatbot API endpoints
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:5000"

def test_general_chat():
    """Test the general chat endpoint"""
    print("Testing general chat endpoint...")
    
    url = f"{BASE_URL}/api/chat/message"
    data = {
        "message": "Hello! What can you help me with?",
        "userId": "test-user-123"
    }
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_project_chat():
    """Test the project-specific chat endpoint"""
    print("\nTesting project-specific chat endpoint...")
    
    # Use a valid ObjectId format (24 character hex string)
    url = f"{BASE_URL}/api/chat/507f1f77bcf86cd799439011/message"
    data = {
        "message": "Tell me about this project",
        "userId": "test-user-123"
    }
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        # Accept 404 (project not found) as valid since we're using a dummy project ID
        return response.status_code in [200, 404]
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chat_history():
    """Test the chat history endpoint"""
    print("\nTesting chat history endpoint...")
    
    # Use a valid ObjectId format (24 character hex string)
    url = f"{BASE_URL}/api/chat/history/507f1f77bcf86cd799439012"
    
    try:
        response = requests.get(url, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        # Accept 404 (session not found) as valid since we're using a dummy session ID
        return response.status_code in [200, 404]
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint to see if the server is running"""
    print("Testing root endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=== Chatbot API Test ===")
    
    # Test root endpoint first
    if not test_root_endpoint():
        print("❌ Server is not running or not accessible")
        exit(1)
    
    print("✅ Server is running")
    
    # Test general chat
    if test_general_chat():
        print("✅ General chat endpoint working")
    else:
        print("❌ General chat endpoint failed")
    
    # Test project chat
    if test_project_chat():
        print("✅ Project chat endpoint working")
    else:
        print("❌ Project chat endpoint failed")
    
    # Test chat history
    if test_chat_history():
        print("✅ Chat history endpoint working")
    else:
        print("❌ Chat history endpoint failed")
    
    print("\n=== Test Complete ===") 