#!/usr/bin/env python3
"""
Health check script for PogoAPI backend services.
This script checks the status of all required services.
"""

import requests
import redis
import pymongo
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

def check_mongodb() -> Dict[str, Any]:
    """Check MongoDB connection"""
    try:
        from config import config
        client = pymongo.MongoClient(config.get_mongodb_url(), serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        
        # Get database info
        db = client[config.get_database_name()]
        collections = db.list_collection_names()
        
        return {
            "status": "healthy",
            "collections": len(collections),
            "database": config.get_database_name()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_redis() -> Dict[str, Any]:
    """Check Redis connection"""
    try:
        from config import config
        redis_url = config.get('REDIS_URL', 'redis://localhost:6379/0')
        r = redis.from_url(redis_url, socket_connect_timeout=5)
        r.ping()
        
        # Get Redis info
        info = r.info()
        
        return {
            "status": "healthy",
            "version": info.get('redis_version'),
            "connected_clients": info.get('connected_clients'),
            "used_memory_human": info.get('used_memory_human')
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_elasticsearch() -> Dict[str, Any]:
    """Check Elasticsearch connection"""
    try:
        from config import config
        es_url = config.get('ELASTICSEARCH_URL', 'http://localhost:9200')
        response = requests.get(f"{es_url}/_cluster/health", timeout=5)
        response.raise_for_status()
        
        data = response.json()
        return {
            "status": "healthy" if data.get('status') in ['green', 'yellow'] else "unhealthy",
            "cluster_status": data.get('status'),
            "number_of_nodes": data.get('number_of_nodes'),
            "active_shards": data.get('active_shards')
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_api_endpoint() -> Dict[str, Any]:
    """Check API endpoint"""
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        response.raise_for_status()
        
        return {
            "status": "healthy",
            "response_time": response.elapsed.total_seconds(),
            "status_code": response.status_code
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_celery() -> Dict[str, Any]:
    """Check Celery worker status"""
    try:
        from celery_app import celery_app
        inspect = celery_app.control.inspect()
        
        # Get active workers
        active_workers = inspect.active()
        registered_workers = inspect.registered()
        
        if active_workers:
            return {
                "status": "healthy",
                "active_workers": len(active_workers),
                "registered_workers": len(registered_workers) if registered_workers else 0
            }
        else:
            return {
                "status": "unhealthy",
                "error": "No active Celery workers found"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_storage() -> Dict[str, Any]:
    """Check storage directories"""
    import os
    from pathlib import Path
    
    storage_path = Path("storage")
    logs_path = Path("logs")
    
    checks = {}
    
    # Check storage directory
    if storage_path.exists() and storage_path.is_dir():
        checks["storage"] = {
            "status": "healthy",
            "path": str(storage_path.absolute()),
            "writable": os.access(storage_path, os.W_OK)
        }
    else:
        checks["storage"] = {
            "status": "unhealthy",
            "error": "Storage directory not found or not accessible"
        }
    
    # Check logs directory
    if logs_path.exists() and logs_path.is_dir():
        checks["logs"] = {
            "status": "healthy",
            "path": str(logs_path.absolute()),
            "writable": os.access(logs_path, os.W_OK)
        }
    else:
        checks["logs"] = {
            "status": "unhealthy",
            "error": "Logs directory not found or not accessible"
        }
    
    return checks

def run_health_check() -> Dict[str, Any]:
    """Run comprehensive health check"""
    print("🔍 Running PogoAPI Health Check...")
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    
    health_status = {
        "timestamp": datetime.now().isoformat(),
        "services": {
            "mongodb": check_mongodb(),
            "redis": check_redis(),
            "elasticsearch": check_elasticsearch(),
            "api": check_api_endpoint(),
            "celery": check_celery(),
            "storage": check_storage()
        }
    }
    
    # Calculate overall status
    all_healthy = all(
        service.get("status") == "healthy" 
        for service in health_status["services"].values()
        if isinstance(service, dict) and "status" in service
    )
    
    health_status["overall_status"] = "healthy" if all_healthy else "unhealthy"
    
    return health_status

def print_health_report(health_status: Dict[str, Any]):
    """Print formatted health report"""
    print(f"\n📊 Health Check Report")
    print(f"{'='*50}")
    print(f"Overall Status: {health_status['overall_status'].upper()}")
    print(f"Timestamp: {health_status['timestamp']}")
    
    print(f"\n🔧 Service Status:")
    for service_name, service_status in health_status["services"].items():
        if isinstance(service_status, dict):
            status = service_status.get("status", "unknown")
            status_icon = "✅" if status == "healthy" else "❌"
            print(f"  {status_icon} {service_name}: {status}")
            
            if status != "healthy" and "error" in service_status:
                print(f"    Error: {service_status['error']}")
        elif isinstance(service_status, dict):
            # Handle nested storage checks
            for sub_service, sub_status in service_status.items():
                status = sub_status.get("status", "unknown")
                status_icon = "✅" if status == "healthy" else "❌"
                print(f"  {status_icon} {service_name}.{sub_service}: {status}")
                
                if status != "healthy" and "error" in sub_status:
                    print(f"    Error: {sub_status['error']}")

def main():
    """Main function"""
    try:
        health_status = run_health_check()
        print_health_report(health_status)
        
        # Exit with appropriate code
        if health_status["overall_status"] == "healthy":
            print(f"\n🎉 All services are healthy!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Some services are unhealthy. Please check the errors above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 