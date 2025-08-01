import asyncio
import motor.motor_asyncio
from bson import ObjectId
from datetime import datetime, timezone

async def main():
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["pogo_db"]
    
    # Create a test session
    session_data = {
        "projectId": ObjectId("67d8c33e749073dea9afb230"),  # Using the existing project ID
        "createdBy": ObjectId("67d382379a5ea6171ec94265"),  # Using the existing user ID
        "createdAt": datetime.now(timezone.utc),
        "status": "created"
    }
    
    print("\nCreating test session...")
    try:
        result = await db.sessions.insert_one(session_data)
        print(f"Session created with ID: {result.inserted_id}")
        
        # Verify session was created
        session = await db.sessions.find_one({"_id": result.inserted_id})
        print(f"\nRetrieved session: {session}")
        
        # List all sessions
        print("\nAll sessions:")
        sessions = await db.sessions.find().to_list(100)
        for session in sessions:
            print(f"Session ID: {session['_id']}, Project ID: {session['projectId']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

asyncio.run(main()) 