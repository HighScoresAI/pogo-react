import asyncio
import motor.motor_asyncio
from bson import ObjectId
import requests
import json
from datetime import datetime, timezone

# Base URL for FastAPI
BASE_URL = "http://127.0.0.1:8000"

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["pogo_db"]

async def check_database():
    print("\nChecking database contents...")
    
    # Check users
    users = await db.users.find().to_list(100)
    print("\nUsers in database:")
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"User ID: {user['_id']}, Email: {user.get('userId', 'N/A')}")
    
    # Check projects
    projects = await db.projects.find().to_list(100)
    print("\nProjects in database:")
    print(f"Total projects: {len(projects)}")
    for project in projects:
        print(f"Project ID: {project['_id']}, Name: {project.get('nema', 'N/A')}, Created By: {project.get('createdBy', 'N/A')}")
    
    # Check sessions
    sessions = await db.sessions.find().to_list(100)
    print("\nSessions in database:")
    print(f"Total sessions: {len(sessions)}")
    for session in sessions:
        print(f"Session ID: {session['_id']}, Project ID: {session.get('projectId', 'N/A')}")

async def main():
    # Create a project using the existing user ID
    project_data = {
        "name": "Test Project",
        "createdBy": "67d382379a5ea6171ec94265"  # Using the actual user ID from the database
    }

    print("Creating project...")
    response = requests.post(f"{BASE_URL}/projects/", json=project_data)
    print(f"Response Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.json()}")

    if response.status_code == 200:
        # Wait a moment for the database operation to complete
        await asyncio.sleep(1)
        await check_database()

# Run the async main function
asyncio.run(main()) 