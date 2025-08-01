import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from werkzeug.exceptions import Unauthorized
from passlib.context import CryptContext
from dotenv import load_dotenv
from functools import wraps
from flask import request

load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") # Load from .env or use a default (should be replaced)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = timedelta(days=1)

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password (str): Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password (str): Password to verify
        hashed_password (str): Hashed password to check against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def jwt_required_custom(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            raise Unauthorized("Missing token")

        try:
            user_id = verify_access_token(auth_header)
            return f(*args, user_id=user_id, **kwargs)
        except Unauthorized as e:
            raise e
    return decorated_function

def create_access_token(user_id: str) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id (str): User ID to include in the token
        
    Returns:
        str: JWT access token
    """
    access_token = jwt.encode(
        payload={
            "sub": user_id,
            "exp": datetime.utcnow() + JWT_EXPIRATION,  # Change this value
            "iat": datetime.utcnow()
        },
        key=JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return access_token

def verify_access_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT access token.
    
    Args:
        token (str): JWT token to verify
        
    Returns:
        Optional[str]: User ID if token is valid, None otherwise
        
    Raises:
        Unauthorized: If token is invalid or expired
    """
    try:
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"require_exp": False})
        return payload["sub"]
    
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Signature has expired")
    except jwt.DecodeError:
        raise Unauthorized("Invalid token")
    except Exception as e:
        raise Unauthorized(f"Token verification failed: {str(e)}")
    
def get_current_user(token: str) -> str:
    """
    Get the current user ID from a JWT token.
    
    Args:
        token (str): JWT token
        
    Returns:
        str: User ID
        
    Raises:
        Unauthorized: If token is invalid or expired
    """
    user_id = verify_access_token(token)
    if user_id is None:
        raise Unauthorized("Could not validate credentials")
    return user_id

# --- Refresh Token Helpers ---
REFRESH_TOKEN_EXPIRATION = timedelta(days=7)

def create_refresh_token(user_id: str) -> str:
    """
    Create a JWT refresh token.
    Args:
        user_id (str): User ID to include in the token
    Returns:
        str: JWT refresh token
    """
    refresh_token = jwt.encode(
        payload={
            "sub": user_id,
            "exp": datetime.utcnow() + REFRESH_TOKEN_EXPIRATION,
            "iat": datetime.utcnow(),
            "type": "refresh"
        },
        key=JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )
    return refresh_token

def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT refresh token.
    Args:
        token (str): JWT token to verify
    Returns:
        Optional[str]: User ID if token is valid, None otherwise
    Raises:
        Unauthorized: If token is invalid or expired
    """
    try:
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise Unauthorized("Invalid refresh token type")
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Refresh token has expired")
    except jwt.DecodeError:
        raise Unauthorized("Invalid refresh token")
    except Exception as e:
        raise Unauthorized(f"Refresh token verification failed: {str(e)}")