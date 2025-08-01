from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.models.user_models import UserRequest, UserProfileRequest
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from bson import ObjectId
from pogoapi.services.session_service import list_sessions_by_project

def get_user_projects_with_roles(userId: str):
    """
    Returns all active projects where the user is an owner or contributor.
    
    Args:
        userId (str): User's MongoDB ObjectId
        
    Returns:
        list: List of projects with user roles
        
    Raises:
        BadRequest: If user ID format is invalid
    """
    try:
        user_object_id = ObjectId(userId)
    except:
        raise BadRequest("Invalid user ID format")

    try:
        db = get_mongodb_client()
        projects = list(db.db.projects.find({
            "members.userId": user_object_id
        }).limit(100))

        if not projects:
            return []

        project_list = []
        for project in projects:
            sessions = list_sessions_by_project(project["_id"])
            user_role = next((m["role"] for m in project["members"] if str(m["userId"]) == str(user_object_id)), None)
            project_data = {
                "projectId": str(project["_id"]),
                "name": project["name"],
                "updatedAt": project["updatedAt"],
                "description": project.get("description", ""),
                "role": user_role,
                "sessions": sessions,
            }
            
            # Only add organizationId and teamId if they exist and are not null
            if project.get("organization"):
                project_data["organizationId"] = str(project["organization"])
            if project.get("members"):
                project_data["members"] = project["members"]
                for member in project_data.get("members", []):
                    member["userId"] = str(member["userId"])
                
            project_list.append(project_data)

        return project_list
    except Exception as e:
        raise BadRequest(f"Failed to fetch user projects: {str(e)}")

def create_user(user: UserRequest):
    """
    Creates a new user in the system.
    
    Args:
        user (UserRequest): User creation data
        
    Returns:
        dict: Creation result with user details
        
    Raises:
        BadRequest: If user already exists or creation fails
    """
    try:
        db = get_mongodb_client()
        # Check if user already exists
        existing_user = db.db.testCollection.find_one({"userId": user.userId})
        if existing_user:
            raise BadRequest("User with this email already exists")

        user_data = {
            "userId": user.userId,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "provider": user.provider,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }

        inserted_user = db.db.testCollection.insert_one(user_data)
        
        return {
            "message": "User created successfully",
            "userId": str(inserted_user.inserted_id),
            "email": user.userId,
            "name": user.firstName + " " + user.lastName,
            "provider": user.provider
        }
    except Exception as e:
        raise BadRequest(f"Failed to create user: {str(e)}")

def get_user_profile_by_id(user_id: str):
    """
    Get a user profile with organization name using aggregation.
    
    Args:
        user_id (str): User ID
        
    Returns:
        dict: User profile with organization name
        
    Raises:
        BadRequest: If user is not found or ID is invalid
    """
    try:
        db = get_mongodb_client()

        pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$lookup": {
                    "from": "organizations",
                    "localField": "organizationId",
                    "foreignField": "_id",
                    "as": "organization"
                }
            },
            {
                "$unwind": {
                    "path": "$organization",
                    "preserveNullAndEmptyArrays": True  # Handles users without org
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "email": 1,
                    "userId": 1,
                    "firstName": 1,
                    "lastName": 1,
                    "role": 1,
                    "jobTitle": 1,
                    "organization": "$organization.name",
                    "phone": 1,
                    "location": 1,
                    "bio": 1
                }
            }
        ]

        result = list(db.db.testCollection.aggregate(pipeline))
        if not result:
            raise BadRequest("User not found")

        return result[0]

    except (BadRequest, InternalServerError):
        raise
    except Exception as e:
        raise InternalServerError(f"Unexpected error during aggregation: {str(e)}")
        
def update_user_profile(userProfile: UserProfileRequest, user_id: str):
    """
    Update a user profile in the system.
    
    Args:
        user (UserProfileRequest): User Profile data
        
    Returns:
        dict: Updated result with user profile details
        
    Raises:
        BadRequest: If user already exists or update fails
    """
    try:
        db = get_mongodb_client()
        # Check if user already exists
        existing_user = db.db.testCollection.find_one({"userId": user_id})
        if not existing_user:
            raise BadRequest("User not found")

        result = db.db.testCollection.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {
                "email": userProfile.email,
                "userId": userProfile.email,
                "firstName": userProfile.firstName,
                "lastName": userProfile.lastName,
                "jobTitle": userProfile.jobTitle,
                "phone": userProfile.phone,
                "location": userProfile.location,
                "bio": userProfile.bio,
                "updatedAt": datetime.now(timezone.utc)
                },
             }
        )

        if result.modified_count == 0:
            raise InternalServerError("Failed to update profile")

        # Check if user already exists
        existing_org = db.db.organizations.find_one({"_id": ObjectId(existing_user["organizationId"])})
        if not existing_org:
            raise BadRequest("Organization not found")

        result_org = db.db.organizations.update_one(
            {"_id": existing_org["_id"]},
            {"$set": {
                "name": userProfile.organization
                },
             }
        )

        if result_org.modified_count == 0:
            raise InternalServerError("Failed to update profile")
        
        return {
            "message": "User profile updated successfully"
        }
    except ValueError as e:
        raise BadRequest(f"Invalid ID format: {str(e)}")
    except (BadRequest, NotFound, InternalServerError):  # Let these propagate
        raise
    except Exception as e:
        raise InternalServerError(f"Unexpected error during pre-check: {str(e)}")
    
def get_dashboard_data(userId: str):
    """
    Returns all dashboardata.
    
    Args:
        userId (str): User's MongoDB ObjectId
        
    Returns:
        list: List of projects, sessions, artifacts, team members
        
    Raises:
        BadRequest: If user ID format is invalid
    """
    try:
        user_object_id = ObjectId(userId)
    except:
        raise BadRequest("Invalid user ID format")

    try:
        db = get_mongodb_client()
        projects = list(db.db.projects.find({
            "members.userId": user_object_id
        }))
        projectsCount = len(projects)
        projects = list(db.db.projects.find({
            "members.userId": user_object_id
        }).limit(3))
        
        project_list = []
        sessionCount = 0
        totalAtrifacts = 0
        for project in projects:
            atrifactCount = 0
            sessions = list_sessions_by_project(str(project["_id"]))
            user_role = next((m["role"] for m in project["members"] if str(m["userId"]) == str(user_object_id)), None)
            for session in sessions:
                artifacts = list(db.db.artifacts.find({"sessionId": ObjectId(session["_id"])}))
                atrifactCount += len(artifacts)
            project_data = {
                "projectId": str(project["_id"]),
                "name": project["name"],
                "updatedAt": project["updatedAt"],
                "description": project.get("description", ""),
                "updatedAt": project["updatedAt"],
                "role": user_role,
                "iconClass": "bi bi-calendar3",
                "badgeClass": "badge bg-primary",
                "sessions": len(sessions),
                "artifacts": atrifactCount,
            }
            project_list.append(project_data)
            
            sessionCount += len(sessions)
            totalAtrifacts += atrifactCount

        return {
            "totalProjects": projectsCount,
            "recentProjects": project_list,
            "totalSessions": sessionCount,
            "totalArtifacts": totalAtrifacts,
        }
    except Exception as e:
        raise BadRequest(f"Failed to fetch user projects: {str(e)}")