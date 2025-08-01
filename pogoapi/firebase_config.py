import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from typing import Optional, Dict, Any
import json

class FirebaseConfig:
    _instance = None
    _app = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseConfig, cls).__new__(cls)
            cls._instance._initialize_firebase()
        return cls._instance

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase credentials are provided via environment variable
            firebase_credentials = os.getenv('FIREBASE_CREDENTIALS')
            
            if firebase_credentials:
                # Parse JSON credentials from environment variable
                cred_dict = json.loads(firebase_credentials)
                cred = credentials.Certificate(cred_dict)
            else:
                # Try to load from service account file
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                else:
                    # For development, create a mock app if no credentials are available
                    print("⚠️ No Firebase credentials found. Creating mock Firebase app for development.")
                    print("   To use Firebase Authentication, please:")
                    print("   1. Download service account JSON from Firebase Console")
                    print("   2. Save as 'firebase-service-account.json' in the pogoapi folder")
                    print("   3. Or set FIREBASE_CREDENTIALS environment variable")
                    
                    # Create a mock app for development
                    self._app = None
                    self._db = None
                    return

            # Initialize Firebase app
            self._app = firebase_admin.initialize_app(cred)
            
            # Initialize Firestore (optional, for additional data storage)
            try:
                self._db = firestore.client()
            except Exception as e:
                print(f"Firestore initialization failed: {e}")
                self._db = None

        except Exception as e:
            print(f"Firebase initialization failed: {e}")
            print("⚠️ Firebase will not be available. Please check your credentials.")
            self._app = None
            self._db = None

    def get_app(self):
        """Get Firebase app instance"""
        return self._app

    def get_firestore(self):
        """Get Firestore client instance"""
        return self._db

    def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return user info"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'provider': decoded_token.get('firebase', {}).get('sign_in_provider', 'unknown')
            }
        except Exception as e:
            raise ValueError(f"Invalid Firebase token: {str(e)}")

    def get_user_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user information from Firebase by UID"""
        try:
            user_record = auth.get_user(uid)
            return {
                'uid': user_record.uid,
                'email': user_record.email,
                'email_verified': user_record.email_verified,
                'display_name': user_record.display_name,
                'photo_url': user_record.photo_url,
                'disabled': user_record.disabled,
                'provider_data': [
                    {
                        'provider_id': provider.provider_id,
                        'uid': provider.uid,
                        'display_name': provider.display_name,
                        'email': provider.email,
                        'photo_url': provider.photo_url
                    }
                    for provider in user_record.provider_data
                ]
            }
        except Exception as e:
            print(f"Error getting user by UID: {e}")
            return None

    def create_custom_token(self, uid: str, additional_claims: Optional[Dict] = None) -> str:
        """Create a custom token for a user"""
        try:
            return auth.create_custom_token(uid, additional_claims or {})
        except Exception as e:
            raise ValueError(f"Error creating custom token: {str(e)}")

    def delete_user(self, uid: str) -> bool:
        """Delete a user from Firebase"""
        try:
            auth.delete_user(uid)
            return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

    def update_user_profile(self, uid: str, **kwargs) -> bool:
        """Update user profile in Firebase"""
        try:
            auth.update_user(uid, **kwargs)
            return True
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return False

# Create a singleton instance
firebase_config = FirebaseConfig() 