"""
MongoDB collection schemas
"""

from typing import Dict, Any, List
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT

# Collection schemas
COLLECTION_SCHEMAS = {
    "users": {
        "required_fields": ["userId", "email"],
        "optional_fields": ["firstName", "lastName", "jobTitle", "role", "provider", "organizationId", "teams", "phone", "location", "bio", "createdAt", "updatedAt"]
    },
    "organizations": {
        "required_fields": ["name", "createdBy"],
        "optional_fields": ["description", "members", "projects", "teams", "createdAt", "updatedAt"]
    },
    "projects": {
        "required_fields": ["name", "organizationId", "createdBy"],
        "optional_fields": ["description", "members", "sessions", "status", "createdAt", "updatedAt"]
    },
    "sessions": {
        "required_fields": ["projectId", "name", "createdBy"],
        "optional_fields": ["description", "artifacts", "status", "createdAt", "updatedAt"]
    },
    "teams": {
        "required_fields": ["name", "organizationId"],
        "optional_fields": ["description", "members", "projects", "createdAt", "updatedAt"]
    },
    "artifacts": {
        "required_fields": ["sessionId", "captureType", "url"],
        "optional_fields": ["content", "metadata", "status", "createdAt", "updatedAt"]
    },
    "artifact_updates": {
        "required_fields": ["artifactId", "sessionId", "status"],
        "optional_fields": ["processor", "content", "errorMessage", "createdAt", "updatedAt"]
    },
    "artifact_vectors": {
        "required_fields": ["artifactId", "sessionId", "vector_data"],
        "optional_fields": ["metadata", "createdAt", "updatedAt"]
    },
    "chat_sessions": {
        "required_fields": ["projectId", "userId"],
        "optional_fields": ["title", "status", "createdAt", "updatedAt"]
    },
    "chat_messages": {
        "required_fields": ["sessionId", "role", "content"],
        "optional_fields": ["metadata", "createdAt"]
    },
    "extension_tokens": {
        "required_fields": ["token", "user_id", "created_at"],
        "optional_fields": [
            "expires_at", "device_info", "last_used_at", "status", "pairing_code", "ip_address", "metadata"
        ]
    }
}

# ------------------------------
# 🔍 Schema Access Functions
# ------------------------------

def get_collection_schema(collection_name: str) -> Dict[str, Any]:
    """
    Get schema for a specific collection.
    Args:
        collection_name (str): Name of the MongoDB collection.
    Returns:
        dict: Schema with required and optional fields.
    """
    return COLLECTION_SCHEMAS.get(collection_name, {})

def get_collection_indexes(collection_name: str) -> List[IndexModel]:
    """
    Get indexes for a specific collection.
    Args:
        collection_name (str): Name of the MongoDB collection.
    Returns:
        list: List of pymongo IndexModel objects.
    """
    # Placeholder: Add indexes as needed per collection
    indexes = {
        "users": [IndexModel([("email", ASCENDING)], unique=True)],
        "projects": [IndexModel([("organization", ASCENDING), ("name", ASCENDING)], unique=True)],
        "chat_messages": [IndexModel([("sessionId", ASCENDING), ("createdAt", DESCENDING)])],
        # Add more as needed
    }
    return indexes.get(collection_name, [])