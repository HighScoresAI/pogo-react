from flask import Blueprint, request, jsonify
from pogoapi.services.user_service import get_user_projects_with_roles, create_user, update_user_profile, get_user_profile_by_id, get_dashboard_data
from pogoapi.services.auth_service import get_user_by_id
from pogoapi.utils.auth_utils import verify_access_token
from werkzeug.exceptions import Unauthorized, BadRequest
from pogoapi.models.user_models import UserRequest, UserProfileRequest
from bson import ObjectId
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.auth_utils import jwt_required_custom
import secrets
from datetime import datetime


bp = Blueprint('users', __name__)

@bp.route('/', methods=['POST'])
def create_new_user():
    """Creates a new user."""
    data = request.get_json()
    user = UserRequest(**data)
    result = create_user(user)
    return jsonify(result)

@bp.route('/<userId>/projects', methods=['GET'])
def get_user_projects(userId):
    """Gets all projects for a user with their roles."""
    result = get_user_projects_with_roles(userId)
    return jsonify(result)

@bp.route("/user", methods=["GET"])
@jwt_required_custom
def get_current_user(user_id=None):
    
    """
    Get the currently logged-in user.

    Returns:
        dict: User details
    """
    try:
        
        # Fetch user details using the auth_service function
        user = get_user_by_id(user_id)

        if not user:
            raise Unauthorized("User not found")

        return jsonify({
            "userId": str(user["_id"]),
            "email": user["email"],
            "firstName": user.get("firstName", ""),
            "lastName": user.get("lastName", ""),
            "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
            "role": user.get("role", ""),
            "jobTitle": user.get("jobTitle", ""),
            "organizationId": str(user.get("organizationId", "")),
            "provider": user.get("provider", "local")
        })
    except Exception as e:
        raise Unauthorized(str(e))
    
@bp.route("/organization/<organizationId>", methods=["GET"])
def get_users_by_organization(organizationId):
    """
    Get all users belonging to a specific organization.

    Args:
        organizationId (str): The ID of the organization.

    Returns:
        list: A list of users in the organization.
    """
    try:
        # Validate the organization ID format
        try:
            org_object_id = ObjectId(organizationId)
        except:
            raise Unauthorized("Invalid organization ID format")

        # Fetch users from the database
        db = get_mongodb_client()
        users = list(db.db.testCollection.find({"organizationId": org_object_id}))

        # Convert ObjectId fields to strings for JSON serialization
        for user in users:
            user["_id"] = str(user["_id"])
            user["organizationId"] = str(user["organizationId"])

        return jsonify(users)
    except Exception as e:
        raise Unauthorized(str(e))
    
@bp.route("/profile", methods=["GET"])
@jwt_required_custom
def get_current_user_profile(user_id=None):
    
    """
    Get the currently logged-in user.

    Returns:
        dict: User Profile details
    """
    try:
        #

        # Fetch user profil details using the user_service function
        result = get_user_profile_by_id(user_id)

        return jsonify(result)
    except Exception as e:
        raise Unauthorized(str(e))

@bp.route("/me", methods=["POST"])
@jwt_required_custom
def update_profile(user_id=None):
    """ Update the profile of the currently logged-in user.
    Args:
        user_id (str): The ID of the user to update, obtained from the JWT token.       
    """       
    try:
        if not user_id:
            raise Unauthorized("User id not found")
        
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
            
        profile_data = UserProfileRequest(**data) # Use UserProfileRequest
        
        result = update_user_profile(profile_data, user_id) # Use fields from UserProfileRequest

        return jsonify(result)
    except Exception as e:
        raise BadRequest(str(e))

@bp.route('/<userId>/dashboard', methods=['GET'])
def user_dashboard_data(userId):
    """Gets all projects for a user with their roles."""
    result = get_dashboard_data(userId)
    return jsonify(result)    

@bp.route('/email/<email>', methods=['GET'])
def get_user_by_email(email):
    """Get a user by email address."""
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["_id"] = str(user["_id"])
    if "organizationId" in user:
        user["organizationId"] = str(user["organizationId"])
    return jsonify(user)    

@bp.route('/<userId>', methods=['GET'])
def get_user_by_id_route(userId):
    db = get_mongodb_client()
    from bson import ObjectId
    user = db.db.testCollection.find_one({"_id": ObjectId(userId)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["_id"] = str(user["_id"])
    return jsonify({
        "userId": user["_id"],
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
        "email": user.get("email", "")
    })

@bp.route("/notifications", methods=["GET"])
@jwt_required_custom
def get_notification_preferences(user_id=None):
    """Get the current user's notification preferences."""
    try:
        db = get_mongodb_client()
        user = db.db.testCollection.find_one({"userId": user_id})
        if not user:
            raise Unauthorized("User not found")
        # Default preferences if not set
        prefs = user.get("notifications", {
            "email": True,
            "push": False,
            "newsletter": True
        })
        return jsonify(prefs)
    except Exception as e:
        raise Unauthorized(str(e))

@bp.route("/notifications", methods=["POST"])
@jwt_required_custom
def update_notification_preferences(user_id=None):
    """Update the current user's notification preferences."""
    try:
        db = get_mongodb_client()
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
        result = db.db.testCollection.update_one(
            {"userId": user_id},
            {"$set": {"notifications": data}}
        )
        if result.matched_count == 0:
            raise Unauthorized("User not found")
        return jsonify({"message": "Notification preferences updated successfully."})
    except Exception as e:
        raise BadRequest(str(e))    

@bp.route("/api-keys", methods=["GET"])
@jwt_required_custom
def get_api_keys(user_id=None):
    """Get the current user's API keys."""
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"userId": user_id})
    if not user:
        raise Unauthorized("User not found")
    api_keys = user.get("apiKeys", [])
    # Do not return revoked keys
    return jsonify([k for k in api_keys if not k.get("revoked")])

@bp.route("/api-keys", methods=["POST"])
@jwt_required_custom
def create_api_key(user_id=None):
    """Generate a new API key for the user."""
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"userId": user_id})
    if not user:
        raise Unauthorized("User not found")
    new_key = {
        "key": "sk-" + secrets.token_urlsafe(24),
        "createdAt": datetime.utcnow().isoformat(),
        "revoked": False
    }
    db.db.testCollection.update_one(
        {"userId": user_id},
        {"$push": {"apiKeys": new_key}}
    )
    return jsonify(new_key)

@bp.route("/api-keys/<key>", methods=["DELETE"])
@jwt_required_custom
def revoke_api_key(key, user_id=None):
    """Revoke (delete) an API key for the user."""
    db = get_mongodb_client()
    result = db.db.testCollection.update_one(
        {"userId": user_id, "apiKeys.key": key},
        {"$set": {"apiKeys.$.revoked": True}}
    )
    if result.matched_count == 0:
        raise BadRequest("API key not found")
    return jsonify({"message": "API key revoked"})    

@bp.route("/linked-accounts", methods=["GET"])
@jwt_required_custom
def get_linked_accounts(user_id=None):
    """Get the current user's linked accounts."""
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"userId": user_id})
    if not user:
        raise Unauthorized("User not found")
    linked = user.get("linkedAccounts", [])
    return jsonify(linked)

@bp.route("/linked-accounts/<provider>", methods=["DELETE"])
@jwt_required_custom
def unlink_account(provider, user_id=None):
    """Unlink a provider from the user's linked accounts."""
    db = get_mongodb_client()
    result = db.db.testCollection.update_one(
        {"userId": user_id},
        {"$pull": {"linkedAccounts": {"provider": provider}}}
    )
    if result.matched_count == 0:
        raise BadRequest("Provider not found or not linked")
    return jsonify({"message": f"{provider} account unlinked"})    
