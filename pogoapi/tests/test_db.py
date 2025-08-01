from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timezone

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["pogo"]

# Check if users collection exists and has any documents
print("\nChecking users collection:")
users = list(db.users.find())
print(f"Found {len(users)} users in the database")
for user in users:
    print(f"User ID: {user['_id']}")

# Print all collections in the database
print("\nAll collections in database:")
collections = db.list_collection_names()
print(collections) 