from typing import Dict, Any, Optional, Tuple
from pymongo import MongoClient
from bson import ObjectId
import jwt
from datetime import datetime, timedelta
from pogoapi.firebase_config import firebase_config
from pogoapi.models.user_models import SignupRequest, LoginRequest
from pogoapi.config import config
import os

class FirebaseAuthService:
    def __init__(self):
        self.mongo_client = MongoClient(config.get_mongodb_url())
        self.db = self.mongo_client[config.get_database_name()]
        self.users_collection = self.db.users
        self.firebase_config = firebase_config

    def verify_firebase_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return user info"""
        if not self.firebase_config.get_app():
            raise ValueError("Firebase is not configured. Please set up Firebase credentials.")
        return self.firebase_config.verify_id_token(id_token)

    def create_or_update_user_in_mongodb(self, firebase_user: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user in MongoDB based on Firebase user data"""
        try:
            # Check if user already exists in MongoDB
            existing_user = self.users_collection.find_one({"firebase_uid": firebase_user['uid']})
            
            if existing_user:
                # Update existing user
                update_data = {
                    "email": firebase_user['email'],
                    "email_verified": firebase_user['email_verified'],
                    "updated_at": datetime.utcnow()
                }
                
                # Update name if available
                if firebase_user.get('name'):
                    name_parts = firebase_user['name'].split(' ', 1)
                    update_data["firstName"] = name_parts[0]
                    update_data["lastName"] = name_parts[1] if len(name_parts) > 1 else ""
                
                # Update profile picture if available
                if firebase_user.get('picture'):
                    update_data["profile_picture"] = firebase_user['picture']
                
                self.users_collection.update_one(
                    {"firebase_uid": firebase_user['uid']},
                    {"$set": update_data}
                )
                
                return existing_user
            else:
                # Create new user
                name_parts = firebase_user.get('name', '').split(' ', 1) if firebase_user.get('name') else ['', '']
                
                new_user = {
                    "firebase_uid": firebase_user['uid'],
                    "email": firebase_user['email'],
                    "firstName": name_parts[0] if name_parts[0] else "",
                    "lastName": name_parts[1] if len(name_parts) > 1 and name_parts[1] else "",
                    "email_verified": firebase_user['email_verified'],
                    "provider": firebase_user.get('provider', 'unknown'),
                    "profile_picture": firebase_user.get('picture'),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "is_active": True,
                    "organizations": [],
                    "preferences": {
                        "theme": "light",
                        "notifications": True
                    }
                }
                
                result = self.users_collection.insert_one(new_user)
                new_user['_id'] = result.inserted_id
                return new_user
                
        except Exception as e:
            print(f"Error creating/updating user in MongoDB: {e}")
            raise

    def authenticate_user(self, id_token: str) -> Tuple[Dict[str, Any], str]:
        """Authenticate user with Firebase token and return user data with JWT"""
        try:
            # Verify Firebase token
            firebase_user = self.verify_firebase_token(id_token)
            
            # Create or update user in MongoDB
            mongo_user = self.create_or_update_user_in_mongodb(firebase_user)
            
            # Create JWT token for your application
            jwt_token = self.create_jwt_token(str(mongo_user['_id']), firebase_user['uid'])
            
            return mongo_user, jwt_token
            
        except Exception as e:
            print(f"Authentication error: {e}")
            raise

    def create_jwt_token(self, user_id: str, firebase_uid: str) -> str:
        """Create JWT token for your application"""
        try:
            payload = {
                'user_id': user_id,
                'firebase_uid': firebase_uid,
                'exp': datetime.utcnow() + timedelta(hours=config.get_jwt_expiration_hours()),
                'iat': datetime.utcnow()
            }
            
            # Use a secret key from config
            secret_key = config.get_jwt_secret_key()
            return jwt.encode(payload, secret_key, algorithm='HS256')
            
        except Exception as e:
            print(f"Error creating JWT token: {e}")
            raise

    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return payload"""
        try:
            secret_key = config.get_jwt_secret_key()
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by MongoDB ID"""
        try:
            return self.users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None

    def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Get user by Firebase UID"""
        try:
            return self.users_collection.find_one({"firebase_uid": firebase_uid})
        except Exception as e:
            print(f"Error getting user by Firebase UID: {e}")
            return None

    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile in MongoDB"""
        try:
            profile_data['updated_at'] = datetime.utcnow()
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": profile_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return False

    def delete_user(self, user_id: str) -> bool:
        """Delete user from MongoDB"""
        try:
            # Get user to find Firebase UID
            user = self.get_user_by_id(user_id)
            if user and user.get('firebase_uid') and self.firebase_config.get_app():
                # Delete from Firebase
                self.firebase_config.delete_user(user['firebase_uid'])
            
            # Delete from MongoDB
            result = self.users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

    def create_user_with_email_password(self, signup_data: SignupRequest) -> Dict[str, Any]:
        """Create user with email/password in Firebase and MongoDB"""
        try:
            if not self.firebase_config.get_app():
                raise ValueError("Firebase is not configured. Please set up Firebase credentials.")
                
            # Create user in Firebase
            firebase_user = self.firebase_config.get_app().auth().create_user(
                email=signup_data.email,
                password=signup_data.password,
                display_name=f"{signup_data.firstName} {signup_data.lastName}"
            )
            
            # Get Firebase user data
            firebase_user_data = {
                'uid': firebase_user.uid,
                'email': firebase_user.email,
                'email_verified': firebase_user.email_verified,
                'name': f"{signup_data.firstName} {signup_data.lastName}",
                'provider': 'local'
            }
            
            # Create user in MongoDB
            mongo_user = self.create_or_update_user_in_mongodb(firebase_user_data)
            
            return {
                'userId': str(mongo_user['_id']),
                'firebase_uid': firebase_user.uid,
                'email': signup_data.email,
                'firstName': signup_data.firstName,
                'lastName': signup_data.lastName,
                'message': 'User created successfully'
            }
            
        except Exception as e:
            print(f"Error creating user with email/password: {e}")
            raise

    def sign_in_with_email_password(self, login_data: LoginRequest) -> Dict[str, Any]:
        """Sign in user with email/password"""
        try:
            # This would typically be handled by the frontend with Firebase Auth
            # For backend verification, we need the Firebase ID token
            # This method is a placeholder for when the frontend sends the Firebase token
            
            # For now, we'll return an error suggesting to use Firebase token
            raise ValueError("Please use Firebase ID token for authentication. Use the /auth/firebase endpoint.")
            
        except Exception as e:
            print(f"Error signing in with email/password: {e}")
            raise

# Create a singleton instance
firebase_auth_service = FirebaseAuthService() 