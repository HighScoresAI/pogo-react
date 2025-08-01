#!/usr/bin/env python3
"""
Comprehensive setup script for PogoAPI backend.
This script will help you set up and configure the entire backend system.
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Optional

def print_header(title: str):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_step(step: str):
    """Print a step indicator"""
    print(f"\n🔧 {step}")

def print_success(message: str):
    """Print a success message"""
    print(f"✅ {message}")

def print_error(message: str):
    """Print an error message"""
    print(f"❌ {message}")

def print_warning(message: str):
    """Print a warning message"""
    print(f"⚠️  {message}")

def check_python_version():
    """Check if Python version is compatible"""
    print_step("Checking Python version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print_error(f"Python 3.8+ required. Current version: {version.major}.{version.minor}")
        return False
    
    print_success(f"Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print_step("Installing Python dependencies")
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print_success("Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install dependencies: {e}")
        print(f"Error output: {e.stderr}")
        return False

def setup_environment():
    """Set up environment configuration"""
    print_step("Setting up environment configuration")
    
    # Check if .env exists
    env_file = Path('.env')
    if env_file.exists():
        print_warning(".env file already exists")
        return True
    
    # Generate JWT secret
    try:
        from generate_jwt_secret import generate_jwt_secret
        jwt_secret = generate_jwt_secret()
    except Exception as e:
        print_warning(f"Could not generate JWT secret: {e}")
        jwt_secret = "your-super-secret-jwt-key-change-this-in-production"
    
    # Create .env file
    env_content = f"""# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db

# JWT Configuration
JWT_SECRET_KEY={jwt_secret}

# Firebase Configuration (optional for development)
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json

# API Keys (optional)
# OPENAI_API_KEY=your-openai-api-key
# GEMINI_API_KEY=your-gemini-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key

# Vector Store (optional)
# QDRANT_URL=your-qdrant-url
# QDRANT_API_KEY=your-qdrant-api-key

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print_success("Created .env file with default configuration")
    return True

def check_mongodb():
    """Check MongoDB connection"""
    print_step("Checking MongoDB connection")
    
    try:
        from pymongo import MongoClient
        from config import config
        
        mongo_url = config.get_mongodb_url()
        db_name = config.get_database_name()
        
        if not mongo_url:
            print_error("MongoDB URL not configured")
            return False
        
        print(f"Connecting to MongoDB: {mongo_url}")
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print_success("MongoDB connection successful")
        return True
        
    except Exception as e:
        print_error(f"MongoDB connection failed: {e}")
        print_warning("Make sure MongoDB is running: mongod")
        return False

def check_redis():
    """Check Redis connection"""
    print_step("Checking Redis connection")
    
    try:
        import redis
        from config import config
        
        redis_url = config.get('REDIS_URL', 'redis://localhost:6379/0')
        r = redis.from_url(redis_url, socket_connect_timeout=5)
        r.ping()
        print_success("Redis connection successful")
        return True
        
    except Exception as e:
        print_error(f"Redis connection failed: {e}")
        print_warning("Make sure Redis is running: redis-server")
        return False

def check_firebase():
    """Check Firebase configuration"""
    print_step("Checking Firebase configuration")
    
    try:
        import firebase_admin
        print_success("firebase-admin package is installed")
    except ImportError:
        print_warning("firebase-admin package is not installed")
        print("Firebase authentication will not be available")
        return False
    
    # Check service account file
    service_account_paths = [
        'firebase-service-account.json',
        os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
    ]
    
    for path in service_account_paths:
        if os.path.exists(path):
            print_success(f"Firebase service account found: {path}")
            return True
    
    print_warning("Firebase service account not found")
    print("Firebase authentication will not be available")
    return False

def create_directories():
    """Create necessary directories"""
    print_step("Creating necessary directories")
    
    directories = [
        'storage',
        'logs',
        'temp'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print_success(f"Created directory: {directory}")
    
    return True

def run_tests():
    """Run basic tests"""
    print_step("Running basic tests")
    
    try:
        # Test config loading
        from config import config
        print_success("Configuration loaded successfully")
        
        # Test basic imports
        from main import create_app
        print_success("Application factory imported successfully")
        
        return True
        
    except Exception as e:
        print_error(f"Tests failed: {e}")
        return False

def generate_startup_scripts():
    """Generate startup scripts"""
    print_step("Generating startup scripts")
    
    # Development startup script
    dev_script = """#!/bin/bash
# Development startup script for PogoAPI

echo "Starting PogoAPI in development mode..."

# Start MongoDB (if not running)
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mongod --fork --logpath /dev/null
fi

# Start Redis (if not running)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Start Celery worker (in background)
echo "Starting Celery worker..."
python start_celery.py &

# Start the Flask application
echo "Starting Flask application..."
python main.py
"""
    
    with open('start_dev.sh', 'w') as f:
        f.write(dev_script)
    
    # Make executable on Unix systems
    try:
        os.chmod('start_dev.sh', 0o755)
    except:
        pass
    
    print_success("Created start_dev.sh script")
    
    # Windows batch file
    win_script = """@echo off
REM Development startup script for PogoAPI (Windows)

echo Starting PogoAPI in development mode...

REM Start MongoDB (if not running)
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting MongoDB...
    start /B mongod
)

REM Start Redis (if not running)
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Redis...
    start /B redis-server
)

REM Start Celery worker (in background)
echo Starting Celery worker...
start /B python start_celery.py

REM Start the Flask application
echo Starting Flask application...
python main.py
"""
    
    with open('start_dev.bat', 'w') as f:
        f.write(win_script)
    
    print_success("Created start_dev.bat script")
    return True

def main():
    """Main setup function"""
    print_header("PogoAPI Backend Setup")
    
    steps = [
        ("Python Version Check", check_python_version),
        ("Install Dependencies", install_dependencies),
        ("Setup Environment", setup_environment),
        ("Create Directories", create_directories),
        ("MongoDB Check", check_mongodb),
        ("Redis Check", check_redis),
        ("Firebase Check", check_firebase),
        ("Run Tests", run_tests),
        ("Generate Startup Scripts", generate_startup_scripts)
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                failed_steps.append(step_name)
        except Exception as e:
            print_error(f"Step '{step_name}' failed with exception: {e}")
            failed_steps.append(step_name)
    
    # Summary
    print_header("Setup Summary")
    
    if failed_steps:
        print_error(f"Setup completed with {len(failed_steps)} failed steps:")
        for step in failed_steps:
            print(f"  - {step}")
        print("\nPlease address the failed steps before running the application.")
    else:
        print_success("Setup completed successfully!")
    
    print("\n🚀 Next Steps:")
    print("1. Update .env file with your API keys")
    print("2. Start the application:")
    print("   - Linux/Mac: ./start_dev.sh")
    print("   - Windows: start_dev.bat")
    print("   - Manual: python main.py")
    print("3. Access the API at: http://localhost:5000")
    print("4. Check API docs at: http://localhost:5000/docs")

if __name__ == "__main__":
    main() 