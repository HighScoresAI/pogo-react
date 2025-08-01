from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["pogo_db"]

# Check users collection
print("\nUsers in database:")
users = list(db.users.find())
print(f"Total users: {len(users)}")
for user in users:
    print(f"User ID: {user['_id']}, Email: {user.get('userId', 'N/A')}")

# Check projects collection
print("\nProjects in database:")
projects = list(db.projects.find())
print(f"Total projects: {len(projects)}")
for project in projects:
    print(f"Project ID: {project['_id']}, Name: {project.get('name', 'N/A')}, Created By: {project.get('createdBy', 'N/A')}")

# Check sessions collection (since projects should create an initial session)
print("\nSessions in database:")
sessions = list(db.sessions.find())
print(f"Total sessions: {len(sessions)}")
for session in sessions:
    print(f"Session ID: {session['_id']}, Project ID: {session.get('projectId', 'N/A')}") 