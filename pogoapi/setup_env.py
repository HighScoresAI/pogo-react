#!/usr/bin/env python3
"""
Environment setup script for PogoAPI with Firebase.
This script helps you set up the required environment variables.
"""

import os
import json
from pathlib import Path

def setup_environment():
    """Set up environment variables for development"""
    print("🔧 Setting up PogoAPI environment...")
    
    # Check if .env file exists
    env_file = Path('.env')
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    # Create .env file with default values
    env_content = """# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Firebase Configuration (optional for development)
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
# FIREBASE_CREDENTIALS={"type":"service_account",...}

# Other API Keys (optional)
# OPENAI_API_KEY=your-openai-api-key
# GEMINI_API_KEY=your-gemini-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file with default configuration")
    print("📝 Please update the values in .env file as needed")

def check_mongodb():
    """Check MongoDB connection"""
    print("\n🗄️ Checking MongoDB configuration...")
    
    try:
        from pymongo import MongoClient
        from pogoapi.config import config
        
        mongo_url = config.get_mongodb_url()
        db_name = config.get_database_name()
        
        if not mongo_url:
            print("❌ MongoDB URL not configured")
            return False
        
        if not db_name:
            print("❌ Database name not configured")
            return False
        
        print(f"✅ MongoDB URL: {mongo_url}")
        print(f"✅ Database name: {db_name}")
        
        # Test connection
        client = MongoClient(mongo_url)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def check_firebase():
    """Check Firebase configuration"""
    print("\n🔥 Checking Firebase configuration...")
    
    # Check if firebase-admin is installed
    try:
        import firebase_admin
        print("✅ firebase-admin package is installed")
    except ImportError:
        print("❌ firebase-admin package is not installed")
        print("   Run: pip install firebase-admin")
        return False
    
    # Check service account file
    service_account_paths = [
        'firebase-service-account.json',
        os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
    ]
    
    service_account_found = False
    for path in service_account_paths:
        if os.path.exists(path):
            print(f"✅ Service account file found: {path}")
            service_account_found = True
            break
    
    if not service_account_found:
        print("⚠️ Service account file not found")
        print("   Firebase will work in mock mode for development")
        print("   To enable Firebase Authentication:")
        print("   1. Go to Firebase Console")
        print("   2. Download service account JSON")
        print("   3. Save as 'firebase-service-account.json'")
    
    return True

def main():
    """Main setup function"""
    print("=" * 50)
    print("🚀 PogoAPI Environment Setup")
    print("=" * 50)
    
    # Set up environment file
    setup_environment()
    
    # Check configurations
    mongodb_ok = check_mongodb()
    firebase_ok = check_firebase()
    
    print("\n" + "=" * 50)
    print("📊 Setup Summary")
    print("=" * 50)
    
    print(f"MongoDB: {'✅ Ready' if mongodb_ok else '❌ Needs configuration'}")
    print(f"Firebase: {'✅ Ready' if firebase_ok else '⚠️ Mock mode (development only)'}")
    
    if mongodb_ok:
        print("\n🎉 Basic setup complete! You can now run the server.")
        print("   Run: python -m pogoapi.main")
    else:
        print("\n⚠️ Please configure MongoDB before running the server.")
    
    if not firebase_ok:
        print("\n📝 To enable Firebase Authentication:")
        print("   1. Create a Firebase project at https://console.firebase.google.com")
        print("   2. Enable Authentication (Email/Password, Google)")
        print("   3. Download service account JSON")
        print("   4. Save as 'firebase-service-account.json' in the pogoapi folder")

if __name__ == "__main__":
    main() 