import motor.motor_asyncio
import asyncio

async def main():
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["pogo_db"]
    
    # List all collections
    collections = await db.list_collection_names()
    print("\nCollections in database:")
    print(collections)
    
    # Create sessions collection if it doesn't exist
    if "sessions" not in collections:
        print("\nCreating sessions collection...")
        await db.create_collection("sessions")
        print("Sessions collection created")
    
    # List collections again
    collections = await db.list_collection_names()
    print("\nCollections after creation:")
    print(collections)

asyncio.run(main()) 