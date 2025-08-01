from pymongo import MongoClient
from datetime import datetime

# Replace with your actual MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://roshangehlot500:roshan99999@pogo.ieempom.mongodb.net/?retryWrites=true&w=majority&appName=pogo"
DB_NAME = "pogo"  # Replace with your actual database name if different
COLLECTION_NAME = "testCollection"

# Replace with your actual userId (from your users collection)
USER_ID = "roshangehlot500"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
projects = db[COLLECTION_NAME]

project_doc = {
    "name": "Seeded Project",
    "description": "This project was seeded via script.",
    "members": [
        {
            "userId": USER_ID,
            "role": "Owner"
        }
    ],
    "createdAt": datetime.utcnow(),
    "updatedAt": datetime.utcnow()
}

result = projects.insert_one(project_doc)
print(f"Inserted project with _id: {result.inserted_id}") 