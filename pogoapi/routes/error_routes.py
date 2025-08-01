"""
Error monitoring and management routes
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest, NotFound
from bson import ObjectId
from pogoapi.utils.error_monitor import ErrorMonitor
from pogoapi.utils.mongodb_client import get_mongodb_client
import logging
import traceback
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

bp = Blueprint('errors', __name__)
error_monitor = ErrorMonitor()

@bp.route('/capture', methods=['POST'])
def capture_error():
    """Capture client-side error"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No error data provided"}), 400
        
        # Extract error data
        error_type = data.get('error_type', 'client_error')
        error_message = data.get('error_message', 'Unknown error')
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        stack_trace = data.get('stack_trace')
        severity = data.get('severity', 'medium')
        context = data.get('context', {})
        
        # Add request context
        request_data = {
            "url": request.url,
            "method": request.method,
            "headers": dict(request.headers),
            "user_agent": request.headers.get('User-Agent'),
            "ip": request.remote_addr
        }
        
        # Capture error
        error_id = error_monitor.capture_error(
            error_type=error_type,
            error_message=error_message,
            user_id=user_id,
            session_id=session_id,
            request_data=request_data,
            stack_trace=stack_trace,
            severity=severity,
            context=context
        )
        
        # Get recovery suggestions
        suggestions = error_monitor.get_recovery_suggestions(error_type)
        
        return jsonify({
            "error_id": error_id,
            "message": "Error captured successfully",
            "suggestions": suggestions
        })
        
    except Exception as e:
        logger.error(f"Error capturing client error: {str(e)}")
        return jsonify({"error": "Failed to capture error"}), 500

@bp.route('/retry/<error_id>', methods=['POST'])
def retry_operation(error_id):
    """Retry a failed operation"""
    try:
        data = request.get_json() or {}
        operation_type = data.get('operation_type')
        operation_data = data.get('operation_data', {})
        
        if not operation_type:
            return jsonify({"error": "Operation type is required"}), 400
        
        result = error_monitor.retry_failed_operation(
            error_id=error_id,
            operation_type=operation_type,
            operation_data=operation_data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error retrying operation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/user/<user_id>', methods=['GET'])
def get_user_errors(user_id):
    """Get errors for a specific user"""
    try:
        days = int(request.args.get('days', 7))
        resolved = request.args.get('resolved')
        
        if resolved is not None:
            resolved = resolved.lower() == 'true'
        
        errors = error_monitor.get_user_errors(
            user_id=user_id,
            days=days,
            resolved=resolved
        )
        
        return jsonify({
            "user_id": user_id,
            "errors": errors,
            "count": len(errors)
        })
        
    except Exception as e:
        logger.error(f"Error getting user errors: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/statistics', methods=['GET'])
def get_error_statistics():
    """Get error statistics for monitoring"""
    try:
        days = int(request.args.get('days', 30))
        stats = error_monitor.get_error_statistics(days=days)
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting error statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/templates', methods=['GET'])
def get_error_templates():
    """Get error message templates"""
    try:
        templates = error_monitor.get_error_templates()
        return jsonify({"templates": templates})
        
    except Exception as e:
        logger.error(f"Error getting error templates: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/suggestions/<error_type>', methods=['GET'])
def get_recovery_suggestions(error_type):
    """Get recovery suggestions for error type"""
    try:
        suggestions = error_monitor.get_recovery_suggestions(error_type)
        return jsonify({
            "error_type": error_type,
            "suggestions": suggestions
        })
        
    except Exception as e:
        logger.error(f"Error getting recovery suggestions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/cleanup', methods=['POST'])
def cleanup_old_errors():
    """Clean up old error logs"""
    try:
        data = request.get_json() or {}
        days = data.get('days', 90)
        
        deleted_count = error_monitor.cleanup_old_errors(days=days)
        
        return jsonify({
            "message": f"Cleaned up {deleted_count} old error logs",
            "deleted_count": deleted_count,
            "days_old": days
        })
        
    except Exception as e:
        logger.error(f"Error cleaning up old errors: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/health', methods=['GET'])
def error_monitor_health():
    """Check error monitoring system health"""
    try:
        mongodb_client = get_mongodb_client()
        
        # Check MongoDB connection
        mongodb_healthy = mongodb_client.db is not None
        
        # Get basic stats
        total_errors = mongodb_client.db.error_logs.count_documents({})
        recent_errors = mongodb_client.db.error_logs.count_documents({
            "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        })
        
        return jsonify({
            "status": "healthy" if mongodb_healthy else "unhealthy",
            "mongodb_connected": mongodb_healthy,
            "total_errors": total_errors,
            "recent_errors_24h": recent_errors
        })
        
    except Exception as e:
        logger.error(f"Error checking error monitor health: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500 