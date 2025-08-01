from pogoapi.utils.mongodb_client import get_mongodb_client
from bson import ObjectId

def create_default_org():
    db = get_mongodb_client()
    # Check if default org exists
    existing_org = db.db.organizations.find_one({"name": "Default Organization"})
    if existing_org:
        print(f"Default organization already exists with ID: {existing_org['_id']}") # Corrected f-string
        return str(existing_org["_id"])
    else:
        # Create default org
        org_data = {
            "name": "Default Organization",
            "logo": None, # Or a default logo path
            "admins": [], # Add initial admin if needed
            "members": []
        }
        result = db.db.organizations.insert_one(org_data)
        print(f"Created default organization with ID: {result.inserted_id}")
        return str(result.inserted_id)

if __name__ == "__main__":
    create_default_org()

