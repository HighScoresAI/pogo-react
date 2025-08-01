from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.models.org_models import OrganizationRequest
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from bson import ObjectId
from typing import Dict, Any

def get_user_organazations(userId: str):
    """
    Renames an organization.
    
    Args:
        organizationId (str): Organization's MongoDB ObjectId
        newName (str): New name for the organization
        
    Returns:
        dict: Rename result with new name
        
    Raises:
        BadRequest: If organization ID format is invalid
        NotFound: If organization is not found
        InternalServerError: If rename operation fails
    """
    try:
        db = get_mongodb_client()
        if not userId:
            raise BadRequest("User ID cannot be None or empty")
        loginUser = db.db.testCollection.find_one({"userId": userId})
        if not loginUser:
            raise NotFound("loginUser not found")

        return {
            "message": "loginUser found successfully",
            "loginUser": str(loginUser["_id"]),
        }
    except Exception as e:
        if isinstance(e, (NotFound, InternalServerError)):
            raise
        raise BadRequest(f"Failed to find loginUser: {str(e)}")

def rename_organization(organizationId: str, newName: str):
    """
    Renames an organization.
    
    Args:
        organizationId (str): Organization's MongoDB ObjectId
        newName (str): New name for the organization
        
    Returns:
        dict: Rename result with new name
        
    Raises:
        BadRequest: If organization ID format is invalid
        NotFound: If organization is not found
        InternalServerError: If rename operation fails
    """
    try:
        org_object_id = ObjectId(organizationId)
    except:
        raise BadRequest("Invalid organization ID format")

    try:
        db = get_mongodb_client()
        organization = db.db.organizations.find_one({"_id": org_object_id})
        if not organization:
            raise NotFound("Organization not found")

        updated_org = db.db.organizations.update_one(
            {"_id": org_object_id},
            {"$set": {"name": newName, "updatedAt": datetime.now(timezone.utc)}}
        )

        if updated_org.modified_count == 0:
            raise InternalServerError("Failed to rename organization")

        return {
            "message": "Organization renamed successfully",
            "newName": newName,
            "organizationId": organizationId
        }
    except Exception as e:
        if isinstance(e, (NotFound, InternalServerError)):
            raise
        raise BadRequest(f"Failed to rename organization: {str(e)}")

def create_organization(org_name: str, org_desc: str, createdBy:str):
    """
    Creates a new organization.
    
    Args:
        org_name (str) : Organization Name
        org_desc (str) : Organization Description
        createdBy (str) : Creator ID
        
    Returns:
        dict: Creation result with organization ID
        
    Raises:
        BadRequest: If creator ID format is invalid or creation fails
    """
    
    if not org_name or not createdBy:
        raise BadRequest("Project name and createdBy are required")
    
    try:
        creator_id = ObjectId(createdBy)
    except:
        raise BadRequest("Invalid creator ID format")

    try:
        new_org = {
            "name": org_name,
            "description": org_desc,
            "createdBy": creator_id,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        client = get_mongodb_client()
        # client._ensure_connection()  # Ensure connection is valid
        db = client.db
        if db is None:
            raise BadRequest("Database connection is not available")
        inserted_org = db.organizations.insert_one(new_org)

        user = db.db.testCollection.find_one({"_id": creator_id})
        if not user:
            raise NotFound("Organization creator not found")

        updated_org = db.db.testCollection.update_one(
            {"_id": creator_id},
            {"$set": {"organizationId": inserted_org.inserted_id, "role": "owner", "updatedAt": datetime.now(timezone.utc)}}
        )

        if updated_org.modified_count == 0:
            raise InternalServerError("Failed to rename organization")
        
        return {
            "message": "Organization created successfully",
            "organizationId": str(inserted_org.inserted_id),
            "name": org_name,
            "desc": org_desc,
        }
    except Exception as e:
        raise BadRequest(f"Failed to create organization: {str(e)}")

def delete_organization(organizationId: str):
    """
    Deletes an organization.
    
    Args:
        organizationId (str): Organization's MongoDB ObjectId
        
    Returns:
        dict: Deletion result
        
    Raises:
        BadRequest: If organization ID format is invalid
        NotFound: If organization is not found
    """
    try:
        org_object_id = ObjectId(organizationId)
    except:
        raise BadRequest("Invalid organization ID format")

    try:
        db = get_mongodb_client()
        result = db.db.organizations.delete_one({"_id": org_object_id})
        if result.deleted_count == 0:
            raise NotFound("Organization not found")
        return {"message": "Organization deleted successfully"}
    except Exception as e:
        if isinstance(e, NotFound):
            raise
        raise BadRequest(f"Failed to delete organization: {str(e)}")
