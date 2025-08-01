from flask import Blueprint, request, jsonify
from pogoapi.services.org_service import get_user_organazations, create_organization, delete_organization, rename_organization
from pogoapi.services.project_service import list_projects_by_org
from pogoapi.utils.auth_utils import get_current_user
from pogoapi.models.org_models import OrganizationRequest

bp = Blueprint('organizations', __name__)

@bp.route('/', methods=['POST'])
def create_org():
    """Creates a new organization."""
    org_data = request.get_json()
    org = OrganizationRequest(**org_data)
    result = create_organization(org.name, org.desc, org.createdBy)
    return jsonify(result)
    
@bp.route('/user', methods=['GET'])
def get_user_orgs():
    """Gets all organizations in a loginser."""
    # userId = request.args.get('userId')
    userId = get_current_user(request.headers.get('Authorization'))
    result = get_user_organazations(userId)
    return jsonify(result)
    
@bp.route('/<organizationId>', methods=['DELETE'])
def delete_org(organizationId):
    """Deletes an organization."""
    result = delete_organization(organizationId)
    return jsonify(result)

@bp.route('/<organizationId>/rename', methods=['PUT'])
def rename_org(organizationId):
    """Renames an organization."""
    name_data = request.get_json()
    result = rename_organization(organizationId, name_data)
    return jsonify(result)

@bp.route('/<organizationId>/projects', methods=['GET'])
def get_organization_projects(organizationId):
    """Gets all projects in an organization."""
    userId = request.args.get('userId')
    result = list_projects_by_org(organizationId)
    return jsonify(result)