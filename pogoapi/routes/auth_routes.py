import jwt
import uuid
from flask import Blueprint, request, jsonify, redirect, session as flask_session
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest, Unauthorized
from pogoapi.models.user_models import SignupRequest, LoginRequest, PasscodeLoginRequest, SendPasscodeRequest
from pogoapi.services.auth_service import register_user, login_user, get_user_by_id, initiate_password_reset, reset_user_password, verify_email_code, change_user_password, send_passcode, verify_passcode
from pogoapi.services.email_service import send_password_reset_email
from pogoapi.utils.auth_utils import create_access_token, verify_access_token, jwt_required_custom
from pogoapi.services.firebase_auth_service import firebase_auth_service
from pydantic import ValidationError
import os
import requests
import pyotp

bp = Blueprint("auth", __name__)

# Google OAuth2 config (set these in your environment)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/auth/google/callback')

def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()

# GitHub OAuth2 config (set these in your environment)
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
GITHUB_REDIRECT_URI = os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:5000/auth/github/callback')

@bp.route("/signup", methods=["POST", "OPTIONS"])
def signup():
    """
    Register a new user.
    
    Returns:
        dict: Registration result with access token
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
        if "provider" not in data or data["provider"] not in ["local", "google", "github"]:
            data["provider"] = "local"  # Default to local if not provided
        user = SignupRequest(**data)
        result = register_user(user)

        # Create access token
        token = create_access_token(str(result["userId"]))
        # Create refresh token
        from pogoapi.utils.auth_utils import create_refresh_token
        refresh_token = create_refresh_token(str(result["userId"]))
        result["access_token"] = token
        result["refresh_token"] = refresh_token
        
        return jsonify(result)
    except Exception as e:
        raise BadRequest(str(e))

@bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    """
    Alias for signup endpoint for frontend compatibility.
    """
    return signup()

@bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    """
    Login a user.
    
    Returns:
        dict: Login result with access token
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
            
        login_data = LoginRequest(**data) # Use LoginRequest
        result = login_user(login_data.email, login_data.password) # Use fields from LoginRequest
        
        # Create access token
        token = create_access_token(str(result["userId"]))
        # Create refresh token
        from pogoapi.utils.auth_utils import create_refresh_token
        refresh_token = create_refresh_token(str(result["userId"]))
        result["access_token"] = token
        result["refresh_token"] = refresh_token
        
        return jsonify(result)
    except ValidationError as ve:
        raise BadRequest(f"Validation error: {ve}")
    except BadRequest as br:
        raise br
    except Unauthorized as ue:
        raise ue
    except Exception:
        # Don't expose internal errors to clients
        raise Unauthorized("Invalid login credentials")

@bp.route("/send-passcode", methods=["POST", "OPTIONS"])
def send_passcode_route():
    """
    Send a 6-digit passcode to the user's email for login.
    
    Returns:
        dict: Success message
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
            
        passcode_data = SendPasscodeRequest(**data)
        send_passcode(passcode_data.email)
        
        return jsonify({
            "message": "Passcode sent successfully",
            "email": passcode_data.email
        })
    except ValidationError as ve:
        raise BadRequest(f"Validation error: {ve}")
    except BadRequest as br:
        raise br
    except Exception as e:
        raise BadRequest(f"Failed to send passcode: {str(e)}")

@bp.route("/login-passcode", methods=["POST", "OPTIONS"])
def login_with_passcode():
    """
    Login a user with a 6-digit passcode.
    
    Returns:
        dict: Login result with access token
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
            
        login_data = PasscodeLoginRequest(**data)
        result = verify_passcode(login_data.email, login_data.passcode)
        
        # Create access token
        token = create_access_token(str(result["userId"]))
        # Create refresh token
        from pogoapi.utils.auth_utils import create_refresh_token
        refresh_token = create_refresh_token(str(result["userId"]))
        result["access_token"] = token
        result["refresh_token"] = refresh_token
        
        return jsonify(result)
    except ValidationError as ve:
        raise BadRequest(f"Validation error: {ve}")
    except BadRequest as br:
        raise br
    except Unauthorized as ue:
        raise ue
    except Exception:
        # Don't expose internal errors to clients
        raise Unauthorized("Invalid passcode")

@bp.route("/refresh", methods=["POST", "OPTIONS"])
def refresh_token():
    """
    Issue a new access token if a valid refresh token is provided.
    Expects JSON: {"refresh_token": "..."}
    Returns: {"access_token": "..."}
    """
    if request.method == "OPTIONS":
        return "", 200
    try:
        data = request.get_json()
        if not data or "refresh_token" not in data:
            raise BadRequest("No refresh token provided")
        from pogoapi.utils.auth_utils import verify_refresh_token, create_access_token
        user_id = verify_refresh_token(data["refresh_token"])
        access_token = create_access_token(user_id)
        return jsonify({"access_token": access_token})
    except Exception as e:
        raise Unauthorized(str(e))

@bp.route("/verify", methods=["POST", "OPTIONS"])
def verify_token():
    """
    Verify an access token.
    
    Returns:
        dict: Verification result
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data or "token" not in data:
            raise BadRequest("No token provided")

        user_id = verify_access_token(data["token"])
        return jsonify({
            "valid": True,
            "userId": user_id
        })
    except IndexError:
        raise Unauthorized("Invalid authorization header format")
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Token has expired")
    except jwt.DecodeError:
        raise Unauthorized("Invalid token")

@bp.route("/forgot-password", methods=["POST", "OPTIONS"])
def forgot_password():
    """
    Send a password reset link or token to the user's email.
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data or "email" not in data:
            raise BadRequest("Email is required")

        reset_token = initiate_password_reset(data["email"])  # Generates token, stores it, returns token
        send_password_reset_email(data["email"], reset_token)  # Sends email (e.g., via SendGrid, SMTP)

        return jsonify({"message": "Password reset instructions sent to your email."})
    except Exception as e:
        raise BadRequest(str(e))


@bp.route("/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    """
    Reset user's password using a valid reset token.
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data or "token" not in data or "password" not in data:
            raise BadRequest("Token and new password are required")

        reset_user_password(data["token"], data["password"])  # Verifies token, resets password

        return jsonify({"message": "Password has been reset successfully."})
    except Unauthorized as ue:
        raise ue
    except Exception as e:
        raise BadRequest(str(e))

@bp.route('/google')
def google_login():
    # Discover Google's OAuth 2.0 endpoints
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Prepare request
    request_uri = (
        f"{authorization_endpoint}?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return redirect(request_uri)

@bp.route('/google/callback')
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code from Google"}), 400

    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]

    # Exchange code for tokens
    token_response = requests.post(
        token_endpoint,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token_response_json = token_response.json()
    access_token = token_response_json.get("access_token")
    id_token = token_response_json.get("id_token")
    if not access_token:
        return jsonify({"error": "Failed to obtain access token from Google"}), 400

    # Get user info
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    userinfo_response = requests.get(
        userinfo_endpoint,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    userinfo = userinfo_response.json()
    email = userinfo.get("email")
    first_name = userinfo.get("given_name", "")
    last_name = userinfo.get("family_name", "")
    if not email:
        return jsonify({"error": "Failed to get user email from Google"}), 400

    # Register or log in the user
    from pogoapi.services.auth_service import register_user, login_user
    from pogoapi.models.user_models import SignupRequest
    db_user = None
    try:
        # Try to log in (if user exists)
        db_user = login_user(email, None)
    except Exception:
        # Register if not exists
        signup_req = SignupRequest(
            firstName=first_name,
            lastName=last_name,
            acceptTerms=True,
            email=email,
            password="GOOGLE_OAUTH_NO_PASSWORD",  # Not used
            provider="google"
        )
        register_user(signup_req)
        db_user = login_user(email, None)

    # Issue JWT
    token = create_access_token(email)
    # Redirect to frontend with token (or set cookie, as preferred)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    return redirect(f"{frontend_url}/login?token={token}")

@bp.route('/github')
def github_login():
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&scope=user:email"
    )
    return redirect(github_auth_url)

@bp.route('/github/callback')
def github_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Missing code from GitHub"}), 400

    # Exchange code for access token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": GITHUB_REDIRECT_URI,
        }
    )
    token_json = token_response.json()
    access_token = token_json.get("access_token")
    if not access_token:
        return jsonify({"error": "Failed to obtain access token from GitHub"}), 400

    # Get user info
    user_response = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"}
    )
    user_json = user_response.json()
    email = user_json.get("email")
    login = user_json.get("login")
    if not email:
        # Try to get primary email if not public
        emails_response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"}
        )
        emails = emails_response.json()
        primary_email = next((e["email"] for e in emails if e.get("primary")), None)
        email = primary_email or (emails[0]["email"] if emails else None)

    # Try to get user_id from JWT in Authorization header or cookies
    user_id = None
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        # Try cookies (for frontend-initiated OAuth)
        auth_header = request.cookies.get("access_token")
        if auth_header:
            auth_header = f"Bearer {auth_header}"
    if auth_header:
        try:
            user_id = verify_access_token(auth_header)
        except Exception:
            user_id = None

    if user_id:
        # Link GitHub account to the logged-in user
        from pogoapi.utils.mongodb_client import get_mongodb_client
        db = get_mongodb_client()
        db.db.testCollection.update_one(
            {"userId": user_id},
            {"$addToSet": {"linkedAccounts": {"provider": "github", "email": email, "login": login}}}
        )
        # Optionally redirect to frontend with success
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/user-profile?linked=github")
    else:
        # Not logged in, just return info for now
        return jsonify({"github_login": login, "email": email})

@bp.route("/verify-email", methods=["POST", "OPTIONS"])
def verify_email():
    if request.method == "OPTIONS":
        return "", 200
    try:
        data = request.get_json()
        email = data.get("email")
        code = data.get("code")
        if not email or not code:
            raise BadRequest("Email and code are required.")
        result = verify_email_code(email, code)
        return jsonify(result)
    except Exception as e:
        raise BadRequest(str(e))

@bp.route("/change-password", methods=["POST"])
@jwt_required_custom
def change_password(user_id=None):
    """
    Change password for a logged-in user (requires old and new password).
    """
    data = request.get_json()
    if not data or "oldPassword" not in data or "newPassword" not in data:
        return jsonify({"error": "Old and new password are required."}), 400
    old_password = data["oldPassword"]
    new_password = data["newPassword"]
    try:
        change_user_password(user_id, old_password, new_password)
        return jsonify({"message": "Password changed successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/2fa/generate", methods=["POST"])
@jwt_required_custom
def generate_2fa(user_id=None):
    from pogoapi.services.auth_service import generate_2fa_secret
    secret = generate_2fa_secret(user_id)
    user_email = get_user_by_id(user_id)["email"]
    otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(name=user_email, issuer_name="PogoApp")
    return jsonify({"secret": secret, "otpauth_url": otpauth_url})

@bp.route("/2fa/enable", methods=["POST"])
@jwt_required_custom
def enable_2fa(user_id=None):
    from pogoapi.services.auth_service import enable_2fa
    code = request.get_json().get("code")
    if not code:
        return jsonify({"error": "Code required"}), 400
    if enable_2fa(user_id, code):
        return jsonify({"message": "2FA enabled"})
    return jsonify({"error": "Invalid code"}), 400

@bp.route("/2fa/verify", methods=["POST"])
def verify_2fa():
    from pogoapi.services.auth_service import verify_2fa_code
    data = request.get_json()
    user_id = data.get("userId")
    code = data.get("code")
    if not user_id or not code:
        return jsonify({"error": "userId and code required"}), 400
    if verify_2fa_code(user_id, code):
        return jsonify({"valid": True})
    return jsonify({"valid": False}), 400

@bp.route("/2fa/disable", methods=["POST"])
@jwt_required_custom
def disable_2fa(user_id=None):
    from pogoapi.services.auth_service import disable_2fa
    disable_2fa(user_id)
    return jsonify({"message": "2FA disabled"})

@bp.route("/sessions", methods=["GET"])
@jwt_required_custom
def list_sessions(user_id=None):
    from pogoapi.services.auth_service import get_sessions
    return jsonify(get_sessions(user_id))

@bp.route("/sessions/<session_id>", methods=["DELETE"])
@jwt_required_custom
def delete_session(session_id, user_id=None):
    from pogoapi.services.auth_service import revoke_session
    revoke_session(user_id, session_id)
    return jsonify({"message": "Session revoked"})

@bp.route("/sessions/revoke-others", methods=["POST"])
@jwt_required_custom
def revoke_other_sessions(user_id=None):
    from pogoapi.services.auth_service import revoke_all_sessions
    current_session_id = request.get_json().get("currentSessionId")
    revoke_all_sessions(user_id, except_session_id=current_session_id)
    return jsonify({"message": "Other sessions revoked"})

@bp.route("/delete-account", methods=["DELETE"])
@jwt_required_custom
def delete_account(user_id=None):
    from pogoapi.services.auth_service import delete_user_account
    delete_user_account(user_id)
    return jsonify({"message": "Account deleted"})

# Firebase Authentication Endpoints
@bp.route("/firebase", methods=["POST", "OPTIONS"])
def firebase_auth():
    """
    Authenticate user with Firebase ID token.
    
    Request body:
    {
        "id_token": "firebase_id_token_here"
    }
    
    Returns:
        dict: User data and JWT token
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data or "id_token" not in data:
            raise BadRequest("Firebase ID token is required")
        
        id_token = data["id_token"]
        
        # Authenticate with Firebase and get user data
        mongo_user, jwt_token = firebase_auth_service.authenticate_user(id_token)
        
        return jsonify({
            "userId": str(mongo_user["_id"]),
            "firebase_uid": mongo_user["firebase_uid"],
            "email": mongo_user["email"],
            "firstName": mongo_user["firstName"],
            "lastName": mongo_user["lastName"],
            "access_token": jwt_token,
            "message": "Authentication successful"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/firebase/signup", methods=["POST", "OPTIONS"])
def firebase_signup():
    """
    Create user with email/password in Firebase and MongoDB.
    
    Request body:
    {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "password": "password123",
        "acceptTerms": true
    }
    
    Returns:
        dict: User creation result
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
        
        # Add provider field for Firebase
        data["provider"] = "firebase"
        
        signup_data = SignupRequest(**data)
        result = firebase_auth_service.create_user_with_email_password(signup_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/firebase/verify", methods=["POST", "OPTIONS"])
def firebase_verify_token():
    """
    Verify Firebase ID token and return user info.
    
    Request body:
    {
        "id_token": "firebase_id_token_here"
    }
    
    Returns:
        dict: User information from Firebase
    """
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.get_json()
        if not data or "id_token" not in data:
            raise BadRequest("Firebase ID token is required")
        
        id_token = data["id_token"]
        firebase_user = firebase_auth_service.verify_firebase_token(id_token)
        
        return jsonify({
            "uid": firebase_user["uid"],
            "email": firebase_user["email"],
            "email_verified": firebase_user["email_verified"],
            "name": firebase_user.get("name"),
            "picture": firebase_user.get("picture"),
            "provider": firebase_user.get("provider")
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/firebase/user/<user_id>", methods=["GET"])
@jwt_required_custom
def firebase_get_user(user_id, current_user_id=None):
    """
    Get user information from MongoDB by user ID.
    
    Returns:
        dict: User information
    """
    try:
        user = firebase_auth_service.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Remove sensitive fields
        user.pop("_id", None)
        
        return jsonify(user)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/firebase/profile", methods=["PUT"])
@jwt_required_custom
def firebase_update_profile(current_user_id=None):
    """
    Update user profile in MongoDB.
    
    Request body:
    {
        "firstName": "John",
        "lastName": "Doe",
        "profile_picture": "https://example.com/picture.jpg"
    }
    
    Returns:
        dict: Update result
    """
    try:
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
        
        success = firebase_auth_service.update_user_profile(current_user_id, data)
        
        if success:
            return jsonify({"message": "Profile updated successfully"})
        else:
            return jsonify({"error": "Failed to update profile"}), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400