"""
Background export tasks for document generation
"""

import os
import logging
from typing import Dict, Any, Optional
from celery import current_task
from pogoapi.celery_app import celery_app
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.document_exporter import DocumentExporter
from pogoapi.utils.path_utils import PathBuilder
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize services
mongodb_client = get_mongodb_client()
path_builder = PathBuilder(mongodb_client)
document_exporter = DocumentExporter(mongodb_client, path_builder)

@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def export_document(self, session_id: str, format_type: str = 'docx', include_metadata: bool = True) -> Dict[str, Any]:
    """
    Export session document in background
    
    Args:
        session_id: Session ID to export
        format_type: Export format (docx, pdf, txt)
        include_metadata: Whether to include metadata
        
    Returns:
        Dict with export result
    """
    try:
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Starting document export...'}
        )
        
        # Get session details
        session = mongodb_client.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 20, 'total': 100, 'status': 'Gathering session data...'}
        )
        
        # Get session artifacts and updates
        artifacts = list(mongodb_client.db.artifacts.find({"sessionId": ObjectId(session_id)}))
        updates = list(mongodb_client.db.artifact_updates.find({"sessionId": ObjectId(session_id)}))
        
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 50, 'total': 100, 'status': 'Generating document...'}
        )
        
        # Generate document
        export_path = document_exporter.export_session(
            session_id=session_id,
            session_data=session,
            artifacts=artifacts,
            updates=updates,
            format_type=format_type,
            include_metadata=include_metadata
        )
        
        current_task.update_state(
            state='SUCCESS',
            meta={'current': 100, 'total': 100, 'status': 'Document export completed'}
        )
        
        return {
            "status": "success",
            "session_id": session_id,
            "export_path": export_path,
            "format": format_type,
            "file_size": os.path.getsize(export_path) if os.path.exists(export_path) else 0
        }
        
    except Exception as exc:
        logger.error(f"Error exporting document for session {session_id}: {str(exc)}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries), exc=exc)
        else:
            return {
                "status": "error",
                "session_id": session_id,
                "error": str(exc)
            }

@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def export_project_summary(self, project_id: str, format_type: str = 'docx') -> Dict[str, Any]:
    """
    Export project summary document in background
    
    Args:
        project_id: Project ID to export
        format_type: Export format (docx, pdf, txt)
        
    Returns:
        Dict with export result
    """
    try:
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Starting project export...'}
        )
        
        # Get project details
        project = mongodb_client.db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 30, 'total': 100, 'status': 'Gathering project data...'}
        )
        
        # Get all sessions for project
        sessions = list(mongodb_client.db.sessions.find({"projectId": ObjectId(project_id)}))
        
        current_task.update_state(
            state='PROGRESS',
            meta={'current': 60, 'total': 100, 'status': 'Generating project summary...'}
        )
        
        # Generate project summary
        export_path = document_exporter.export_project_summary(
            project_id=project_id,
            project_data=project,
            sessions=sessions,
            format_type=format_type
        )
        
        current_task.update_state(
            state='SUCCESS',
            meta={'current': 100, 'total': 100, 'status': 'Project export completed'}
        )
        
        return {
            "status": "success",
            "project_id": project_id,
            "export_path": export_path,
            "format": format_type,
            "sessions_count": len(sessions),
            "file_size": os.path.getsize(export_path) if os.path.exists(export_path) else 0
        }
        
    except Exception as exc:
        logger.error(f"Error exporting project {project_id}: {str(exc)}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries), exc=exc)
        else:
            return {
                "status": "error",
                "project_id": project_id,
                "error": str(exc)
            }

@celery_app.task
def cleanup_old_exports():
    """Clean up old export files"""
    try:
        # Remove export files older than 7 days
        export_dir = os.path.join(os.getcwd(), "exports")
        if os.path.exists(export_dir):
            cutoff_time = datetime.utcnow().timestamp() - (7 * 24 * 60 * 60)  # 7 days
            
            for filename in os.listdir(export_dir):
                file_path = os.path.join(export_dir, filename)
                if os.path.isfile(file_path):
                    file_time = os.path.getmtime(file_path)
                    if file_time < cutoff_time:
                        os.remove(file_path)
                        logger.info(f"Removed old export file: {filename}")
                        
    except Exception as exc:
        logger.error(f"Error in cleanup_old_exports: {str(exc)}") 