#!/usr/bin/env python3
"""
Generate a secure JWT secret key for Firebase authentication
"""
import secrets
import string
import base64
import os

def generate_jwt_secret():
    """Generate a secure JWT secret key"""
    
    # Method 1: Using secrets module (recommended)
    print("🔐 Generating secure JWT secret key...")
    
    # Generate a 64-byte random key and encode as base64
    random_bytes = secrets.token_bytes(64)
    jwt_secret = base64.b64encode(random_bytes).decode('utf-8')
    
    print(f"\n✅ Generated JWT Secret Key:")
    print(f"JWT_SECRET_KEY={jwt_secret}")
    
    # Alternative method using string characters
    print(f"\n🔑 Alternative (if you prefer alphanumeric):")
    chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    alt_secret = ''.join(secrets.choice(chars) for _ in range(64))
    print(f"JWT_SECRET_KEY={alt_secret}")
    
    print(f"\n📝 Add this to your .env file or environment variables:")
    print(f"JWT_SECRET_KEY={jwt_secret}")
    
    return jwt_secret

if __name__ == "__main__":
    generate_jwt_secret() 