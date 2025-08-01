from flask import Blueprint, request, jsonify
from pogoapi.services.project_service import (
    create_project,
    get_project_by_id_service,
    list_projects_by_org,
    update_project,
    delete_project_by_id,
    add_member_to_project,
    remove_member_from_project,
    change_project_role,
    rename_project,
    list_sessions_by_project
)
from pogoapi.utils.auth_utils import jwt_required_custom, get_current_user
from pogoapi.models.project_models import ProjectRequest
from pogoapi.utils.mongodb_client import get_mongodb_client
from bson import ObjectId
from pogoapi.services.session_service import list_sessions_by_project, get_artifacts_by_session_id

def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

bp = Blueprint('projects', __name__)

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def get_all_projects():
    db = get_mongodb_client()
    # Only return documents that have type == 'project' (i.e., are real projects)
    projects = [doc for doc in db.db.testCollection.find({"type": "project"})]
    print(f"[DEBUG] Found {len(projects)} projects: {[str(p.get('_id')) for p in projects]}")
    result = []
    for project in projects:
        result.append({
            'projectId': str(project.get('_id', '')),
            'projectName': project.get('name', ''),
            'name': project.get('name', ''),
            'description': project.get('description', '')
        })
    return jsonify(result)

@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
def create_new_project():
    """Creates a new project."""
    project_data = request.get_json()
    result = create_project(project_data)
    return jsonify(result)

@bp.route('/<projectId>/role/<userId>', methods=['PUT'])
def change_role(projectId, userId):
    """Changes a user's role in a project."""
    role_data = request.get_json()
    new_role = role_data.get('role')
    if not new_role:
        return jsonify({"error": "Role is required"}), 400
    result = change_project_role(projectId, userId, new_role)
    return jsonify(result)

@bp.route('/<projectId>/members', methods=['POST'])
def add_project_member(projectId):
    """Adds a member to a project."""
    member_data = request.get_json()
    user_id = member_data.get('userId')
    role = member_data.get('role')
    if not user_id or not role:
        return jsonify({"error": "userId and role are required"}), 400
    result = add_member_to_project(projectId, user_id, role)
    return jsonify(result)

@bp.route('/<projectId>/members/<userId>', methods=['DELETE'])
def remove_project_member(projectId, userId):
    """Removes a member from a project."""
    result = remove_member_from_project(projectId, userId)
    return jsonify(result)

@bp.route('/<projectId>/rename', methods=['PUT'])
def rename_project_endpoint(projectId):
    """Renames a project."""
    name_data = request.get_json()
    new_name = name_data.get('name')
    if not new_name:
        return jsonify({"error": "projectName is required"}), 400
    result = rename_project(projectId, new_name)
    return jsonify(result)


@bp.route('/<projectId>', methods=['PUT'])
def update_project_endpoint(projectId):
    """Renames a project."""
    name_data = request.get_json()
    new_name = name_data.get('name')
    new_description = name_data.get('description', '')
    if not name_data:
        return jsonify({"error": "projectName is required"}), 400
    result = update_project(projectId, new_name, new_description)
    return jsonify(result)


@bp.route('/organization/<organizationId>', methods=['GET'])
def get_projects_by_org(organizationId):
    """Gets all projects in an organization."""
    result = list_projects_by_org(organizationId)
    return jsonify(result)

@bp.route('/<projectId>/sessions', methods=['GET'])
def get_project_sessions(projectId):
    """Gets all sessions in a project."""
    result = list_sessions_by_project(projectId)
    return jsonify(result)

@bp.route('/<project_id>/sessions', methods=['GET'])
def get_sessions_for_project(project_id):
    """Get all sessions for a given project."""
    db = get_mongodb_client()
    try:
        project_obj_id = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project ID"}), 400
    sessions = list(db.db.testCollection.find({
        "$or": [
            {"projectId": project_obj_id},
            {"projectId": project_id}
        ]
    }))
    sessions = [convert_objectid(session) for session in sessions]
    for session in sessions:
        session['sessionId'] = session.get('_id', '')
        if '_id' in session:
            del session['_id']
    return jsonify(sessions)

@bp.route('/<projectId>/session-stats', methods=['GET'])
def get_project_session_stats(projectId):
    """Returns session stats (total, draft, processed, published) for a project."""
    try:
        sessions = list_sessions_by_project(projectId)
        total = len(sessions)
        draft = 0
        processed = 0
        published = 0
        for session in sessions:
            session_id = session.get('_id')
            if not session_id:
                continue
            if session.get('status') == 'draft':
                draft += 1
                continue
            # Get artifacts for this session
            try:
                artifact_data = get_artifacts_by_session_id(session_id)
                artifacts = artifact_data.get('artifacts', [])
            except Exception:
                artifacts = []
            if not artifacts:
                draft += 1
                continue
            all_processed = all(a.get('status') == 'processed' for a in artifacts)
            if all_processed:
                processed += 1
                published += 1  # Published = Processed for now
            else:
                draft += 1
        return jsonify({
            'total': total,
            'draft': draft,
            'processed': processed,
            'published': published
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<projectId>', methods=['DELETE'])
def delete_project(projectId):
    """Deletes a project."""
    # Implement the logic to delete a project
    result = delete_project_by_id(projectId)
    return jsonify(result)

@bp.route('/<projectId>', methods=['GET'])
def get_project_by_id(projectId):
    """Gets a project by its ID."""

    result = get_project_by_id_service(projectId)
    return jsonify(result)

@bp.route('/<projectId>/invite', methods=['POST'])
def invite_project_member(projectId):
    """Invite a member to a project by email. If user exists, add as member; else, create a pending invite."""
    data = request.get_json()
    email = data.get('email')
    role = data.get('role')
    if not email or not role:
        return jsonify({"error": "email and role are required"}), 400
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"email": email})
    if user:
        # Add as member
        from pogoapi.services.project_service import add_member_to_project
        result = add_member_to_project(projectId, str(user['_id']), role)
        return jsonify({"status": "added", "userId": str(user['_id'])})
    else:
        # Simulate invite creation (in real app, store invite and send email)
        invite_link = f"https://invite.link/{projectId}/{email}"
        return jsonify({"status": "invited", "inviteLink": invite_link})