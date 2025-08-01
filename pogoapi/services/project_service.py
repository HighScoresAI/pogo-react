from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.models.project_models import ProjectRequest
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from bson import ObjectId, errors as bson_errors
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_valid_objectid(oid):
    try:
        ObjectId(oid)
        return True
    except bson_errors.InvalidId:
        return False

def create_project(project_data: dict) -> Dict[str, Any]:
    """Creates a new project and assigns the creator as the owner, also creates an initial session."""

    if "name" not in project_data or "createdBy" not in project_data:
        raise BadRequest("Project name and createdBy are required")

    try:
        db = get_mongodb_client()
        if db is None:
            raise InternalServerError("Database connection is not available")

        # Accept either ObjectId or email for createdBy
        created_by = project_data["createdBy"]
        user = None
        try:
            # Try to treat as ObjectId
            user = db.get_user(created_by)
        except Exception:
            pass
        if not user:
            # Try to look up by email in testCollection (for type 'user')
            user = db.db.testCollection.find_one({"email": created_by, "type": "user"})
        if not user:
            raise NotFound("User not found")
        project_data["createdBy"] = user["_id"]

        # if "organizationId" in project_data:  // if organizationId is provided
        if user.get("organizationId"):
            project_data["organizationId"] = user["organizationId"]
            existing_project = db.get_documentation({
                "organizationId": project_data["organizationId"],
                "name": project_data["name"]
            }, "testCollection")  # Use testCollection
            if existing_project:
                raise BadRequest("A project with this name already exists in the organizationId")
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except (BadRequest, NotFound, InternalServerError):  # Let these propagate
        raise
    except Exception as e:
        raise InternalServerError(f"Unexpected error during pre-check: {str(e)}")

    project_data["createdBy"] = user["_id"]
    project_data["createdAt"] = datetime.now(timezone.utc)
    project_data["updatedAt"] = datetime.now(timezone.utc)
    project_data["members"] = [{"userId": user["_id"], "role": "owner"}]
    project_data["type"] = "project"

    try:
        logger.info("Creating project with data: %s", project_data)
        project_id = db.insert_documentation(project_data, "testCollection")  # Use testCollection
        if project_id is None:
            raise InternalServerError("Failed to create project")
        logger.info(f"Project created with _id: {project_id} (type: {type(project_id)})")

        project = db.get_documentation({"_id": project_id}, "testCollection")  # Use testCollection
        if project is None:
            raise InternalServerError("Failed to retrieve created project")

        # Create an initial session for the project
        from pogoapi.services.session_service import create_session
        session_data = {
            "projectId": project_id,  # Use ObjectId directly
            "createdBy": project["createdBy"]
        }
        session_result = create_session(session_data)
        logger.info(f"Session created with sessionId: {session_result.get('sessionId')} for projectId: {project_id} (type: {type(project_id)})")
        project["initialSessionId"] = session_result.get("sessionId")

        # Convert ObjectIds to strings for frontend
        project["projectId"] = str(project.pop("_id"))
        project["createdBy"] = str(project["createdBy"])
        if "organizationId" in project:
            project["organizationId"] = str(project["organizationId"])
        for member in project.get("members", []):
            member["userId"] = str(member["userId"])

        return project

    except (BadRequest, NotFound, InternalServerError):  # Known exceptions pass through
        raise
    except Exception as e:
        raise InternalServerError(f"Unexpected error during project creation: {str(e)}")

def change_project_role(projectId: str, userId: str, newRole: str) -> Dict[str, Any]:
    """Changes a user's role in a project."""
    try:
        db = get_mongodb_client()
        project_id = ObjectId(projectId)
        user_id = ObjectId(userId)
        
        # Verify project exists
        project = db.db.testCollection.find_one({"_id": project_id})
        if not project:
            raise NotFound("Project not found")
            
        # Verify user is a member
        member = next((m for m in project["members"] if m["userId"] == str(user_id)), None)
        if not member:
            raise BadRequest("User is not a member of this project")
            
        # If the role is the same, return the current project without updating
        if member["role"] == newRole:
            project["_id"] = str(project["_id"])
            if "createdBy" in project:
                project["createdBy"] = str(project["createdBy"])
            if "organizationId" in project:
                project["organizationId"] = str(project["organizationId"])
            return project
        
        # Update role only if it's different
        result = db.db.testCollection.update_one(
            {"_id": project_id, "members.userId": str(user_id)},
            {"$set": {"members.$.role": newRole}}
        )
        
        if result.modified_count == 0:
            raise InternalServerError("Failed to update role")
        
        # Return updated member info
        return {
            "message": "User role updated successfully",
            "userId": str(user_id),
            "projectId": str(project_id),
            "role": newRole
        }
        
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except Exception as e:
        raise InternalServerError(f"Error changing project role: {str(e)}")

def remove_member_from_project(projectId: str, userId: str) -> Dict[str, Any]:
    """Removes a member from a project."""
    try:
        db = get_mongodb_client()
        project_id = ObjectId(projectId)
        user_id = ObjectId(userId)
        
        # Verify project exists
        project = db.db.testCollection.find_one({"_id": project_id})
        if not project:
            raise NotFound("Project not found")
            
        # Verify user is a member
        member = next((m for m in project["members"] if str(m["userId"]) == str(user_id)), None)
        if not member:
            raise BadRequest("User is not a member of this project")
            
        # Remove member
        result = db.db.testCollection.update_one(
            {"_id": project_id},
            {"$pull": {"members": {"userId": user_id}}}
        )
        
        if result.modified_count == 0:
            raise InternalServerError("Failed to remove member")
            
        # Return updated project
        updated_project = db.db.testCollection.find_one({"_id": project_id})
        updated_project["projectId"] = str(updated_project.pop("_id"))
        # Only convert createdBy if it exists
        if "createdBy" in updated_project:
            updated_project["createdBy"] = str(updated_project["createdBy"])
        if "organizationId" in updated_project:
            updated_project["organizationId"] = str(updated_project["organizationId"])
        for member in updated_project.get("members", []):
            member["userId"] = str(member["userId"])

        return updated_project
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except Exception as e:
        raise InternalServerError(f"Error removing member from project: {str(e)}")

def rename_project(projectId: str, newName: str) -> Dict[str, Any]:
    """Renames a project."""
    try:
        db = get_mongodb_client()
        project_id = ObjectId(projectId)
        
        # Verify project exists
        project = db.db.testCollection.find_one({"_id": project_id})
        if not project:
            raise NotFound("Project not found")
            
        # Check for duplicate name in organization
        if "organizationId" in project:
            existing_project = db.db.testCollection.find_one({
                "organizationId": ObjectId(project["organizationId"]),
                "name": newName,
                "_id": {"$ne": project_id}
            })
            if existing_project:
                raise BadRequest("A project with this projetName already exists in the organization")
                
        # Update name
        result = db.db.testCollection.update_one(
            {"_id": project_id},
            {"$set": {"name": newName, "updatedAt": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count == 0:
            raise InternalServerError("Failed to rename project")
            
        # Return updated project
        updated_project = db.db.testCollection.find_one({"_id": project_id})
        updated_project["projectId"] = str(updated_project.pop("_id"))
        # Only convert createdBy if it exists
        if "createdBy" in updated_project:
            updated_project["createdBy"] = str(updated_project["createdBy"])
        if "organizationId" in updated_project:
            updated_project["organizationId"] = str(updated_project["organizationId"])
        for member in updated_project.get("members", []):
            member["userId"] = str(member["userId"])
            
        return updated_project
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except Exception as e:
        raise InternalServerError(f"Error renaming project: {str(e)}")


def update_project(id: str, newName: str, newDescription: str) -> Dict[str, Any]:
    """Renames a project."""
    try:
        db = get_mongodb_client()
        project_id = ObjectId(id)
        
        # Verify project exists
        project = db.db.testCollection.find_one({"_id": project_id})
        if not project:
            raise NotFound("Project not found")
            
        # Check for duplicate name in organization
        if "organizationId" in project:
            existing_project = db.db.testCollection.find_one({
                "organizationId": project["organizationId"],
                "name": newName,
                "_id": {"$ne": project_id}
            })
            if existing_project:
                raise BadRequest("A project with this name already exists in the organization")
                
        # Update name
        result = db.db.testCollection.update_one(
            {"_id": project_id},
            {"$set": {
                "name": newName, 
                "description": newDescription,
                "updatedAt": datetime.now(timezone.utc)
                },
             }
        )
        
        if result.modified_count == 0:
            raise InternalServerError("Failed to update project")
            
        # Return updated project
        updated_project = db.db.testCollection.find_one({"_id": project_id})
        updated_project["projectId"] = str(updated_project.pop("_id"))

        # Only convert createdBy if it exists
        if "createdBy" in updated_project:
            updated_project["createdBy"] = str(updated_project["createdBy"])
        if "organizationId" in updated_project:
            updated_project["organizationId"] = str(updated_project["organizationId"])
        for member in updated_project.get("members", []):
            member["userId"] = str(member["userId"])

        return updated_project
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except Exception as e:
        raise InternalServerError(f"Error updating project: {str(e)}")

def add_member_to_project(projectId: str, userId: str, role: str) -> Dict[str, Any]:
    """Adds a member to a project with a specified role."""
    try:
        db = get_mongodb_client()
        project_id = ObjectId(projectId)
        user_id = ObjectId(userId)
        
        # Verify project exists
        project = db.db.testCollection.find_one({"_id": project_id})
        if not project:
            raise NotFound("Project not found")
            
        # Verify user exists
        user = db.db.testCollection.find_one({"_id": user_id})
        if not user:
            raise NotFound("User not found")
            
        # Check if user is already a member
        if any(str(m["userId"]) == str(user_id) for m in project["members"]):
            raise BadRequest("User is already a member of this project")
            
        # Add member
        result = db.db.testCollection.update_one(
            {"_id": project_id},
            {"$push": {"members": {"userId": user_id, "role": role}}}
        )
        
        if result.modified_count == 0:
            raise InternalServerError("Failed to add member")
            
        # Return updated project
        updated_project = db.db.testCollection.find_one({"_id": project_id})
        updated_project["projectId"] = str(updated_project.pop("_id"))
        if "createdBy" in updated_project:
            updated_project["createdBy"] = str(updated_project["createdBy"])
        if "organizationId" in updated_project:
            updated_project["organizationId"] = str(updated_project["organizationId"])
        for member in updated_project.get("members", []):
            member["userId"] = str(member["userId"])
            
        return updated_project
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except BadRequest:
        # Re-raise BadRequest to preserve 400 status
        raise
    except Exception as e:
        raise InternalServerError(f"Error adding member to project: {str(e)}")

def list_sessions_by_project(project_id: str) -> List[Dict[str, Any]]:
    """Lists all sessions for a given project."""
    if not is_valid_objectid(project_id):
        raise BadRequest("Invalid project ID format")
    try:
        db = get_mongodb_client()
        project_obj_id = ObjectId(project_id)
        sessions = list(db.db.testCollection.find({"projectId": project_obj_id}))
        for session in sessions:
            session["sessionId"] = str(session.pop("_id"))
            if "projectId" in session:
                session["projectId"] = str(session["projectId"])
            if "createdBy" in session:
                session["createdBy"] = str(session["createdBy"])
        return sessions
    except Exception as e:
        raise InternalServerError(f"Error listing sessions: {str(e)}")

def list_projects_by_org(organizationId: str):
    """Lists all projects for an organization."""
    try:
        db = get_mongodb_client()
        print("Raw organizationId from request:", organizationId)
        
        try:
            org_id = ObjectId(organizationId)
            print("Converted ObjectId:", org_id)
        except Exception as e:
            print("Failed to convert organizationId to ObjectId:", e)
            org_id = None
        
        query = {"$or": [{"organizationId": org_id}]}
        if org_id:
            query["$or"].append({"organizationId": org_id})
        
        projects = list(db.db.testCollection.find(query))
        print(f"Projects found: {len(projects)}")
        
        for project in projects:
            project["projectId"] = str(project.pop("_id"))
            if "createdBy" in project:
                project["createdBy"] = str(project["createdBy"])
            if "organizationId" in project:
                project["organizationId"] = str(project["organizationId"])
            for member in project.get("members", []):
                member["userId"] = str(member["userId"])

        return projects
    except Exception as e:
        raise InternalServerError(f"Error listing projects: {str(e)}")

def delete_project_by_id(project_id):
    """
    Deletes a project by its ID and all related sessions.
    Args:
        project_id (str): The ID of the project to delete.
    Returns:
        dict: A dictionary containing the result of the deletion.
    """
    try:
        db = get_mongodb_client()
        # Delete all sessions with this projectId
        db.db.testCollection.delete_many({"projectId": ObjectId(project_id)})
        # Delete the project itself
        result = db.db.testCollection.delete_one({"_id": ObjectId(project_id)})
        if result.deleted_count == 0:
            raise NotFound(f"Project with ID {project_id} not found.")
        return {"success": True, "message": f"Project with ID {project_id} and its sessions have been deleted."}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
def get_project_by_id_service(project_id):
    """
    Retrieves a project by its ID.

    Args:
        project_id (str): The ID of the project to retrieve.

    Returns:
        dict: A dictionary containing the project details.
    """
    try:
        db = get_mongodb_client()
        project = db.db.testCollection.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise NotFound(f"Project with ID {project_id} not found.")
        
        # Convert ObjectId fields to strings
        project["projectId"] = str(project.pop("_id"))
        if "createdBy" in project:
            project["createdBy"] = str(project["createdBy"])
        if "organizationId" in project:
            project["organizationId"] = str(project["organizationId"])
        for member in project.get("members", []):
            member["userId"] = str(member["userId"])

        return project       
        
    except Exception as e:
        raise InternalServerError(f"Error retrieving project: {str(e)}")