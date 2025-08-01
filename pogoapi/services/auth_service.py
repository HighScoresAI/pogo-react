import uuid
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.models.user_models import SignupRequest, PasswordResetRequest
from datetime import datetime, timezone
from pogoapi.utils.auth_utils import hash_password, verify_password # Updated import
from werkzeug.exceptions import BadRequest, Unauthorized
from bson import ObjectId, errors as bson_errors
from werkzeug.exceptions import BadRequest, Unauthorized
from datetime import datetime, timedelta
import random
from pogoapi.services.email_service import send_email_verification_code
import pyotp

# Store token for 1 hour
RESET_TOKEN_EXPIRATION_MINUTES = 60

def register_user(user: SignupRequest):
    """
    Register a new user in the system.
    
    Args:
        user (SignupRequest): User registration data
        
    Returns:
        dict: Registration result with user ID
        
    Raises:
        BadRequest: If user already exists
    """
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    # Debug prints
    print("DB Name:", db.db.name)
    print("Trying to access:", users_collection.full_name)
    try:
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise BadRequest("User already exists")
        provider = getattr(user, "provider", "local")
        new_user = {
            "firstName": user.firstName,
            "lastName": user.lastName,
            "userId": user.email,
            "email": user.email,
            "acceptTerms": user.acceptTerms,
            "provider": provider,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "hashedPassword": hash_password(user.password) if provider == "local" and user.password else None,
            "verified": False
        }
        inserted_user = users_collection.insert_one(new_user)
        created_user = users_collection.find_one({"_id": inserted_user.inserted_id})
        if not created_user:
            raise Exception("Failed to retrieve created user after insertion")
        # Generate 6-digit code
        # code = f"{random.randint(100000, 999999)}"
        # expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        # db.store_email_verification_code(user.email, code, expires_at)
        # send_email_verification_code(user.email, code)
        return {"message": "User registered successfully.", "email": created_user["email"], "userId": str(created_user["_id"])}
    except Exception as e:
        import traceback
        print("Registration failed:", traceback.format_exc())
        raise BadRequest(f"Registration failed: {str(e)}")

def login_user(email: str, password: str):
    """
    Authenticate a user and return login result.
    
    Args:
        email (str): User's email ID
        password (str): User's password
        
    Returns:
        dict: Login result with user ID
        
    Raises:
        Unauthorized: If credentials are invalid
    """
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            raise Unauthorized("Invalid credentials")

        # Verify password if the provider is "local"
        if user.get("provider", "local") == "local":
            if not user.get("hashedPassword") or not verify_password(password, user["hashedPassword"]):
                raise Unauthorized("Invalid credentials")

        return {
            "message": "Login successful",
            "email": user["email"],
            "name": user["firstName"] + " " + user["lastName"],
            "provider": user["provider"],
            "userId" : str(user["_id"])
        }
    except Exception as e:
        import traceback
        print("Login failed:", traceback.format_exc())
        raise Unauthorized(f"Login failed: {str(e)}")


def get_user_by_id(user_id: str):
    """
    Fetch user details by user ID (MongoDB ObjectId or email).
    Args:
        user_id (str): The ID of the user (ObjectId as string or email).
    Returns:
        dict: User details or None if not found.
    Raises:
        Unauthorized: If the user is not found.
    """
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    try:
        try:
            # Try as ObjectId
            user = users_collection.find_one({"_id": ObjectId(user_id)})
        except bson_errors.InvalidId:
            # Fallback: try as userId (email)
            user = users_collection.find_one({"userId": user_id})
        if not user:
            raise Unauthorized("User not found")
        user["_id"] = str(user["_id"])
        return user
    except Exception as e:
        import traceback
        print(f"Error fetching user by ID: {traceback.format_exc()}")
        raise Unauthorized(f"Error fetching user by ID: {str(e)}")

def initiate_password_reset(email: str) -> str:
    user = db.session.query(User).filter_by(email=email).first()
    if not user:
        raise BadRequest("User with this email does not exist")

    token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRATION_MINUTES)
    
    db = get_mongodb_client()
    # Save token to DB (replace old token if exists)
    db.db.session.query(PasswordResetToken).filter_by(user_id=user.id).delete()
    db.db.session.add(PasswordResetToken(user_id=user.id, token=token, expires_at=expiry))
    db.db.session.commit()
    return token


def reset_user_password(token: str, new_password: str):
    db = get_mongodb_client()
    reset_entry = db.db.session.query(PasswordResetToken).filter_by(token=token).first()
    if not reset_entry:
        raise Unauthorized("Invalid reset token")

    if reset_entry.expires_at < datetime.utcnow():
        raise Unauthorized("Reset token has expired")

    user = db.db.pogo.find_one(id=reset_entry.user_id).first()
    if not user:
        raise BadRequest("User not found")

    user.password_hash = hash_password(new_password)
    db.db.session.delete(reset_entry)  # Invalidate token after use
    db.db.session.commit()

def verify_email_code(email: str, code: str):
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    code_entry = db.get_email_verification_code(email)
    if not code_entry:
        raise BadRequest("No verification code found for this email.")
    if code_entry["code"] != code:
        raise BadRequest("Invalid verification code.")
    if datetime.now(timezone.utc) > code_entry["expires_at"]:
        raise BadRequest("Verification code has expired.")
    # Mark user as verified
    users_collection.update_one({"email": email}, {"$set": {"verified": True}})
    db.delete_email_verification_code(email)
    return {"message": "Email verified successfully."}

def change_user_password(user_id: str, old_password: str, new_password: str):
    """
    Change the password for a user after verifying the old password.
    """
    from pogoapi.utils.mongodb_client import get_mongodb_client
    from pogoapi.utils.auth_utils import verify_password, hash_password
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"_id": user_id})
    if not user:
        raise Exception("User not found")
    if not verify_password(old_password, user.get("hashedPassword", "")):
        raise Exception("Old password is incorrect")
    new_hashed = hash_password(new_password)
    db.db.testCollection.update_one({"_id": user_id}, {"$set": {"hashedPassword": new_hashed}})
    return True

def generate_2fa_secret(user_id: str) -> str:
    secret = pyotp.random_base32()
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    db.db.testCollection.update_one({"_id": user_id}, {"$set": {"twoFASecret": secret}})
    return secret

def verify_2fa_code(user_id: str, code: str) -> bool:
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    user = db.db.testCollection.find_one({"_id": user_id})
    secret = user.get("twoFASecret")
    if not secret:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def enable_2fa(user_id: str, code: str) -> bool:
    if verify_2fa_code(user_id, code):
        from pogoapi.utils.mongodb_client import get_mongodb_client
        db = get_mongodb_client()
        db.db.testCollection.update_one({"_id": user_id}, {"$set": {"twoFAEnabled": True}})
        return True
    return False

def disable_2fa(user_id: str):
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    db.db.testCollection.update_one({"_id": user_id}, {"$set": {"twoFAEnabled": False, "twoFASecret": None}})
    return True

def create_session(user_id: str, device: str, ip: str, user_agent: str) -> str:
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    session = {
        "userId": user_id,
        "device": device,
        "ip": ip,
        "userAgent": user_agent,
        "createdAt": datetime.utcnow(),
        "lastActive": datetime.utcnow(),
    }
    result = db.db.user_sessions.insert_one(session)
    return str(result.inserted_id)

def get_sessions(user_id: str):
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    sessions = list(db.db.user_sessions.find({"userId": user_id}))
    for s in sessions:
        s["sessionId"] = str(s["_id"])
        s["_id"] = str(s["_id"])
    return sessions

def revoke_session(user_id: str, session_id: str):
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    db.db.user_sessions.delete_one({"userId": user_id, "_id": ObjectId(session_id)})
    return True

def revoke_all_sessions(user_id: str, except_session_id: str = None):
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    query = {"userId": user_id}
    if except_session_id:
        query["_id"] = {"$ne": ObjectId(except_session_id)}
    db.db.user_sessions.delete_many(query)
    return True

def delete_user_account(user_id: str):
    from pogoapi.utils.mongodb_client import get_mongodb_client
    db = get_mongodb_client()
    db.db.testCollection.delete_one({"_id": user_id})
    db.db.user_sessions.delete_many({"userId": user_id})
    # TODO: Delete other user-related data if needed
    return True

def send_passcode(email: str) -> bool:
    """
    Send a 6-digit passcode to the user's email for login.
    """
    from pogoapi.utils.mongodb_client import get_mongodb_client
    import random
    from pogoapi.services.email_service import send_email
    
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    
    # Check if user exists
    user = users_collection.find_one({"email": email})
    if not user:
        raise BadRequest("User not found")
    
    # Generate 6-digit passcode
    passcode = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store passcode in database
    passcode_data = {
        "email": email,
        "passcode": passcode,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Remove old passcode if exists
    db.db.passcodes.delete_many({"email": email})
    
    # Insert new passcode
    db.db.passcodes.insert_one(passcode_data)
    
    # Send email with passcode
    try:
        subject = "Your Hello Pogo Login Passcode"
        body = f"""
        Hello {user.get('firstName', 'User')},
        
        Your login passcode is: {passcode}
        
        This passcode will expire in 10 minutes.
        
        If you didn't request this passcode, please ignore this email.
        
        Best regards,
        Hello Pogo Team
        """
        
        send_email(email, subject, body)
        return True
    except Exception as e:
        print(f"Failed to send passcode email: {e}")
        raise BadRequest("Failed to send passcode. Please try again.")

def verify_passcode(email: str, passcode: str) -> dict:
    """
    Verify the passcode and return user data if valid.
    """
    from pogoapi.utils.mongodb_client import get_mongodb_client
    
    db = get_mongodb_client()
    users_collection = db.db.testCollection
    
    # Check if user exists
    user = users_collection.find_one({"email": email})
    if not user:
        raise Unauthorized("Invalid credentials")
    
    # Get stored passcode
    stored_passcode = db.db.passcodes.find_one({"email": email})
    if not stored_passcode:
        raise Unauthorized("No passcode found. Please request a new one.")
    
    # Check if passcode is expired
    # Ensure both datetimes are timezone-aware for comparison
    current_time = datetime.now(timezone.utc)
    expires_at = stored_passcode["expires_at"]
    
    # If expires_at is timezone-naive, make it timezone-aware
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if current_time > expires_at:
        # Remove expired passcode
        db.db.passcodes.delete_one({"email": email})
        raise Unauthorized("Passcode has expired. Please request a new one.")
    
    # Verify passcode
    if stored_passcode["passcode"] != passcode:
        raise Unauthorized("Invalid passcode.")
    
    # Remove used passcode
    db.db.passcodes.delete_one({"email": email})
    
    return {
        "message": "Login successful",
        "email": user["email"],
        "name": user["firstName"] + " " + user["lastName"],
        "provider": user.get("provider", "local"),
        "userId": str(user["_id"])
    }