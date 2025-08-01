"""
Error monitoring and handling utilities
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from pogoapi.utils.mongodb_client import get_mongodb_client
import traceback
import hashlib

logger = logging.getLogger(__name__)

class ErrorMonitor:
    """Comprehensive error monitoring and handling"""
    
    def __init__(self):
        """Initialize error monitor"""
        self.mongodb_client = get_mongodb_client()
        self.error_collection = "error_logs"
        self.session_collection = "user_sessions"
        
    def capture_error(
        self,
        error_type: str,
        error_message: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        request_data: Optional[Dict[str, Any]] = None,
        stack_trace: Optional[str] = None,
        severity: str = "medium",
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Capture and log an error with full context
        
        Args:
            error_type: Type of error (e.g., 'processing_error', 'auth_error')
            error_message: Human-readable error message
            user_id: User ID if available
            session_id: Session ID if available
            request_data: Request data for context
            stack_trace: Full stack trace
            severity: Error severity (low, medium, high, critical)
            context: Additional context data
            
        Returns:
            Error ID for tracking
        """
        try:
            # Generate error ID
            error_id = hashlib.md5(
                f"{error_type}:{error_message}:{datetime.utcnow().isoformat()}".encode()
            ).hexdigest()
            
            # Create error document
            error_doc = {
                "_id": error_id,
                "error_type": error_type,
                "error_message": error_message,
                "user_id": user_id,
                "session_id": session_id,
                "request_data": request_data,
                "stack_trace": stack_trace,
                "severity": severity,
                "context": context or {},
                "timestamp": datetime.utcnow(),
                "resolved": False,
                "retry_count": 0
            }
            
            # Store in MongoDB
            self.mongodb_client.db[self.error_collection].insert_one(error_doc)
            
            # Log to file system
            logger.error(f"Error captured: {error_id} - {error_type}: {error_message}")
            
            return error_id
            
        except Exception as e:
            logger.error(f"Failed to capture error: {str(e)}")
            return ""
    
    def get_error_templates(self) -> Dict[str, str]:
        """Get predefined error message templates"""
        return {
            "processing_error": "Processing of {artifact_name} failed: {specific_error}. {retry_suggestion}",
            "authentication_error": "Unable to authenticate. Please log in again.",
            "permission_error": "You don't have permission to {action}. Contact the project owner.",
            "network_error": "Connection lost. Please check your internet connection and try again.",
            "file_size_error": "File size {file_size} exceeds the maximum limit of {max_size}.",
            "file_type_error": "File type {file_type} is not supported. Please use {supported_types}.",
            "processing_timeout": "Processing timed out. Please try again or contact support.",
            "storage_error": "Storage space is full. Please free up space and try again.",
            "api_rate_limit": "Rate limit exceeded. Please wait {wait_time} seconds before trying again.",
            "database_error": "Database connection error. Please try again in a moment."
        }
    
    def format_error_message(
        self,
        template_key: str,
        **kwargs
    ) -> str:
        """Format error message using template"""
        templates = self.get_error_templates()
        template = templates.get(template_key, "An error occurred: {error}")
        
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"Missing template parameter: {e}")
            return template
    
    def get_recovery_suggestions(self, error_type: str) -> List[str]:
        """Get recovery suggestions for error type"""
        suggestions = {
            "processing_error": [
                "Try processing the artifact again",
                "Check if the file format is supported",
                "Ensure the file is not corrupted",
                "Contact support if the issue persists"
            ],
            "authentication_error": [
                "Refresh the page and log in again",
                "Clear browser cookies and cache",
                "Check if your session has expired",
                "Contact support if login issues persist"
            ],
            "network_error": [
                "Check your internet connection",
                "Try refreshing the page",
                "Wait a few minutes and try again",
                "Contact support if connection issues persist"
            ],
            "file_size_error": [
                "Compress the file to reduce size",
                "Split the file into smaller parts",
                "Use a different file format",
                "Contact support for large file processing"
            ]
        }
        
        return suggestions.get(error_type, ["Please try again", "Contact support if the issue persists"])
    
    def retry_failed_operation(
        self,
        error_id: str,
        operation_type: str,
        operation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Retry a failed operation
        
        Args:
            error_id: ID of the error to retry
            operation_type: Type of operation to retry
            operation_data: Data needed for retry
            
        Returns:
            Retry result
        """
        try:
            # Get error details
            error = self.mongodb_client.db[self.error_collection].find_one({"_id": error_id})
            if not error:
                return {"success": False, "error": "Error not found"}
            
            # Check retry count
            if error.get("retry_count", 0) >= 3:
                return {"success": False, "error": "Maximum retry attempts exceeded"}
            
            # Perform retry based on operation type
            if operation_type == "artifact_processing":
                from pogoapi.services.artifact_service import ArtifactService
                artifact_service = ArtifactService()
                result = artifact_service.process_artifact_by_id(
                    operation_data["artifact_id"],
                    priority="high"
                )
            elif operation_type == "session_processing":
                from pogoapi.services.session_service import SessionService
                session_service = SessionService()
                result = session_service.process_session(operation_data["session_id"])
            else:
                return {"success": False, "error": f"Unknown operation type: {operation_type}"}
            
            # Update error document
            self.mongodb_client.db[self.error_collection].update_one(
                {"_id": error_id},
                {
                    "$inc": {"retry_count": 1},
                    "$set": {
                        "last_retry": datetime.utcnow(),
                        "resolved": result.get("success", False)
                    }
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in retry_failed_operation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_user_errors(
        self,
        user_id: str,
        days: int = 7,
        resolved: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get errors for a specific user"""
        try:
            query = {
                "user_id": user_id,
                "timestamp": {"$gte": datetime.utcnow() - timedelta(days=days)}
            }
            
            if resolved is not None:
                query["resolved"] = resolved
            
            errors = list(self.mongodb_client.db[self.error_collection].find(query))
            
            # Convert ObjectId to string
            for error in errors:
                error["_id"] = str(error["_id"])
            
            return errors
            
        except Exception as e:
            logger.error(f"Error getting user errors: {str(e)}")
            return []
    
    def get_error_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get error statistics for monitoring"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get error counts by type
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff_date}}},
                {"$group": {
                    "_id": "$error_type",
                    "count": {"$sum": 1},
                    "resolved_count": {"$sum": {"$cond": ["$resolved", 1, 0]}}
                }},
                {"$sort": {"count": -1}}
            ]
            
            error_stats = list(self.mongodb_client.db[self.error_collection].aggregate(pipeline))
            
            # Get severity distribution
            severity_pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff_date}}},
                {"$group": {
                    "_id": "$severity",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            severity_stats = list(self.mongodb_client.db[self.error_collection].aggregate(severity_pipeline))
            
            # Get total counts
            total_errors = self.mongodb_client.db[self.error_collection].count_documents({
                "timestamp": {"$gte": cutoff_date}
            })
            
            resolved_errors = self.mongodb_client.db[self.error_collection].count_documents({
                "timestamp": {"$gte": cutoff_date},
                "resolved": True
            })
            
            return {
                "total_errors": total_errors,
                "resolved_errors": resolved_errors,
                "resolution_rate": (resolved_errors / total_errors * 100) if total_errors > 0 else 0,
                "error_types": error_stats,
                "severity_distribution": severity_stats,
                "period_days": days
            }
            
        except Exception as e:
            logger.error(f"Error getting error statistics: {str(e)}")
            return {}
    
    def cleanup_old_errors(self, days: int = 90) -> int:
        """Clean up old error logs"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            result = self.mongodb_client.db[self.error_collection].delete_many({
                "timestamp": {"$lt": cutoff_date},
                "resolved": True
            })
            
            logger.info(f"Cleaned up {result.deleted_count} old error logs")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old errors: {str(e)}")
            return 0 