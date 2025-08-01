#!/usr/bin/env python3
"""
Test script to verify Firebase setup and configuration.
Run this script to check if Firebase is properly configured.
"""

import os
import sys
import json
from pathlib import Path

def test_firebase_config():
    """Test Firebase configuration"""
    print("🔍 Testing Firebase Configuration...")
    
    # Check if firebase-admin is installed
    try:
        import firebase_admin
        print("✅ firebase-admin package is installed")
    except ImportError:
        print("❌ firebase-admin package is not installed")
        print("   Run: pip install firebase-admin")
        return False
    
    # Check environment variables
    required_env_vars = [
        'FIREBASE_PROJECT_ID',
        'JWT_SECRET_KEY'
    ]
    
    print("\n📋 Environment Variables:")
    for var in required_env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * len(value)} (set)")
        else:
            print(f"❌ {var}: Not set")
    
    # Check service account file
    service_account_paths = [
        'firebase-service-account.json',
        os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
    ]
    
    print("\n📁 Service Account File:")
    service_account_found = False
    for path in service_account_paths:
        if os.path.exists(path):
            print(f"✅ Service account file found: {path}")
            service_account_found = True
            break
    
    if not service_account_found:
        print("❌ Service account file not found")
        print("   Please download from Firebase Console and save as firebase-service-account.json")
    
    # Check FIREBASE_CREDENTIALS environment variable
    firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
    if firebase_creds:
        try:
            json.loads(firebase_creds)
            print("✅ FIREBASE_CREDENTIALS environment variable is valid JSON")
            service_account_found = True
        except json.JSONDecodeError:
            print("❌ FIREBASE_CREDENTIALS environment variable is not valid JSON")
    
    return service_account_found

def test_firebase_initialization():
    """Test Firebase initialization"""
    print("\n🚀 Testing Firebase Initialization...")
    
    try:
        from pogoapi.firebase_config import firebase_config
        app = firebase_config.get_app()
        if app:
            print("✅ Firebase app initialized successfully")
            return True
        else:
            print("❌ Firebase app initialization failed")
            return False
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return False

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n🗄️ Testing MongoDB Connection...")
    
    try:
        from pogoapi.config import config
        from pymongo import MongoClient
        
        mongo_url = config.get_mongodb_url()
        if not mongo_url:
            print("❌ MongoDB URL not configured")
            return False
        
        client = MongoClient(mongo_url)
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        return False

def test_firebase_auth_service():
    """Test Firebase Auth Service"""
    print("\n🔐 Testing Firebase Auth Service...")
    
    try:
        from pogoapi.services.firebase_auth_service import firebase_auth_service
        print("✅ Firebase Auth Service imported successfully")
        return True
    except Exception as e:
        print(f"❌ Firebase Auth Service error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 50)
    print("🔥 Firebase Setup Test")
    print("=" * 50)
    
    tests = [
        ("Configuration", test_firebase_config),
        ("Initialization", test_firebase_initialization),
        ("MongoDB Connection", test_mongodb_connection),
        ("Auth Service", test_firebase_auth_service)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Firebase is ready to use.")
        return 0
    else:
        print("⚠️ Some tests failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 