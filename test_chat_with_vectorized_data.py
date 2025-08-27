import requests
import json

# Test the chatbot with the newly vectorized data
base_url = "https://api.hellopogo.com"
session_id = "68ab60f5b366c63b217ab111"

print("🧪 Testing chatbot with newly vectorized data...")
print(f"Session ID: {session_id}")
print("-" * 50)

# Test 1: Ask about screenshot content
print("\n📸 Test 1: Asking about screenshot content...")
payload = {
    "message": "What is the content of the screenshot analysis?",
    "userId": "test_user"
}

response = requests.post(
    f"{base_url}/api/chat/session/{session_id}/message", 
    json=payload, 
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    response_text = response.json().get('response', 'No response')
    print(f"✅ Response: {response_text[:200]}...")
    
    # Check if response contains specific content vs generic
    if "i don't have the specific content" in response_text.lower() or "i don't have specific details" in response_text.lower():
        print("❌ Still getting generic response - context not retrieved")
    elif "visual elements" in response_text.lower() or "screenshot" in response_text.lower():
        print("✅ SUCCESS: Response contains artifact content!")
    else:
        print("🤔 Response is different but unclear")
else:
    print(f"❌ Error: {response.status_code} - {response.text}")

# Test 2: Ask about audio content
print("\n🎵 Test 2: Asking about audio content...")
payload = {
    "message": "What was said in the audio recording?",
    "userId": "test_user"
}

response = requests.post(
    f"{base_url}/api/chat/session/{session_id}/message", 
    json=payload, 
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    response_text = response.json().get('response', 'No response')
    print(f"✅ Response: {response_text[:200]}...")
    
    if "i don't have the specific content" in response_text.lower() or "i don't have specific details" in response_text.lower():
        print("❌ Still getting generic response - context not retrieved")
    elif "audio" in response_text.lower() or "recording" in response_text.lower():
        print("✅ SUCCESS: Response contains artifact content!")
    else:
        print("🤔 Response is different but unclear")
else:
    print(f"❌ Error: {response.status_code} - {response.text}")

# Test 3: Ask about session overview
print("\n📋 Test 3: Asking about session overview...")
payload = {
    "message": "What artifacts are in this session?",
    "userId": "test_user"
}

response = requests.post(
    f"{base_url}/api/chat/session/{session_id}/message", 
    json=payload, 
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    response_text = response.json().get('response', 'No response')
    print(f"✅ Response: {response_text[:200]}...")
    
    if "i don't have the specific content" in response_text.lower() or "i don't have specific details" in response_text.lower():
        print("❌ Still getting generic response - context not retrieved")
    elif "screenshot" in response_text.lower() or "audio" in response_text.lower():
        print("✅ SUCCESS: Response contains artifact content!")
    else:
        print("🤔 Response is different but unclear")
else:
    print(f"❌ Error: {response.status_code} - {response.text}")

print("\n" + "=" * 50)
print("🎯 Test completed! Check the results above.") 