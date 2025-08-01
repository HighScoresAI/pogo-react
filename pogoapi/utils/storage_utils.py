import os
from bson import ObjectId
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from pogoapi.utils.mongodb_client import get_mongodb_client
from slugify import slugify

# Define the base upload folder
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "hellopogo")

def get_storage_path(sessionId: str, db=None):
    """Generate storage path based on organization, project, and session."""
    try:
        if db is None:
            db = get_mongodb_client()
        session_object_id = ObjectId(sessionId)
    except Exception:
        raise BadRequest("Invalid session ID format")

    try:
        session = db.db.testCollection.find_one({"_id": session_object_id})
        if not session:
            raise NotFound("Session not found")

        try:
            project_object_id = ObjectId(session["projectId"])
        except Exception:
            raise BadRequest("Invalid project ID format in session")

        project = db.db.testCollection.find_one({"_id": project_object_id})
        if not project:
            raise NotFound("Project not found")

        # Remove organization lookup for now
        org_slug = "default-org"

        # Safely extract project name
        project_name = project.get("name", "unknown-project")
        if isinstance(project_name, dict):
            project_name = project_name.get("en") or project_name.get("value") or "unknown-project"
        project_slug = slugify(project_name)

        storage_path = os.path.join(BASE_UPLOAD_FOLDER, org_slug, project_slug, str(session_object_id))
        os.makedirs(storage_path, exist_ok=True)

        return f"{org_slug}/{project_slug}/{str(session_object_id)}"

    except (BadRequest, NotFound):
        raise
    except Exception as e:
        raise InternalServerError(f"Failed to get storage path: {str(e)}")