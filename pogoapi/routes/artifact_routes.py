from flask import Blueprint, request, jsonify, send_file
from pogoapi.services.artifact_service import upload_audio, upload_image, delete_artifact_by_id, process_artifact_by_id, update_artifact_content_by_id, get_artifact_file_by_id, create_document_artifact
from bson import ObjectId
from pogoapi.utils.mongodb_client import get_mongodb_client

bp = Blueprint('artifacts', __name__)

# Move the specific route before the general routes to avoid conflicts
@bp.route('/artifact-updates/latest/<artifact_id>', methods=['GET'])
def get_latest_artifact_update(artifact_id):
    db = get_mongodb_client()
    update = db.db.artifact_updates.find_one(
        {"artifactId": artifact_id, "status": "processed"},
        sort=[("createdAt", -1)]
    )
    if not update:
        return jsonify({"content": ""}), 200
    return jsonify({"content": update.get("content", "")}), 200

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def get_all_artifacts():
    """Gets all artifacts for the authenticated user."""
    # For now, return empty array until we implement user-specific artifact fetching
    # TODO: Implement user authentication and fetch user's artifacts
    return jsonify([])

@bp.route('/upload/audio', methods=['POST'])
def upload_audio_api():
    """Uploads an audio artifact."""
    audio_file = request.files['file']
    session_id = request.form['sessionId']
    # Correct argument order for upload_audio if needed (assuming it's similar)
    result = upload_audio(session_id, audio_file) 
    return jsonify(result)

@bp.route('/upload/image', methods=['POST'])
def upload_image_api():
    """Uploads an image artifact."""
    image_file = request.files['file']
    session_id = request.form['sessionId']
    # Correct argument order for upload_image
    result = upload_image(session_id, image_file) 
    return jsonify(result)

@bp.route('/<artifactId>', methods=['DELETE'])
def delete_artifact_api(artifactId):
    from bson import ObjectId
    db = get_mongodb_client()
    artifact = None
    # Try ObjectId first
    try:
        artifact = db.db["testCollection"].find_one({"_id": ObjectId(artifactId)})
    except Exception:
        pass
    # If not found, try as string
    if not artifact:
        artifact = db.db["testCollection"].find_one({"_id": artifactId})
    if artifact:
        # Proceed with deletion logic for top-level artifact
        result = delete_artifact_by_id(artifactId)
        return jsonify(result)
    # If not found as top-level, try to find as embedded in session
    session = db.db["testCollection"].find_one({"artifacts._id": artifactId})
    if not session:
        return jsonify({"error": "Artifact not found"}), 404
    # Find the artifact object and its URL
    artifact_obj = next((a for a in session.get('artifacts', []) if a.get('_id') == artifactId), None)
    if not artifact_obj:
        return jsonify({"error": "Artifact not found in session"}), 404
    artifact_url = artifact_obj.get('url')
    # Remove artifact from artifacts array
    db.db["testCollection"].update_one(
        {"_id": session["_id"]},
        {"$pull": {"artifacts": {"_id": artifactId}}}
    )
    # Remove corresponding URL from screenshots array if present
    if artifact_url:
        db.db["testCollection"].update_one(
            {"_id": session["_id"]},
            {"$pull": {"screenshots": {"$regex": artifact_url.split('/')[-1]}}}
        )
    return jsonify({"success": True, "message": "Artifact removed from session."})

@bp.route('/<artifact_id>/process', methods=['POST'])
def process_artifact(artifact_id):
    """Process artifact with priority"""
    try:
        data = request.get_json() or {}
        priority = data.get('priority', 'medium')
        
        if priority not in ['high', 'medium', 'low']:
            return jsonify({"error": "Invalid priority level"}), 400
        
        result = process_artifact_by_id(artifact_id, priority)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<artifact_id>/task-status', methods=['GET'])
def get_task_status(artifact_id):
    """Get processing task status for artifact"""
    try:
        mongodb_client = get_mongodb_client()
        
        # Get latest artifact update with task_id
        update = mongodb_client.db.artifact_updates.find_one(
            {"artifactId": ObjectId(artifact_id)},
            sort=[("createdAt", -1)]
        )
        
        if not update or not update.get("task_id"):
            return jsonify({"error": "No processing task found for artifact"}), 404
        
        # Import Celery app to check task status
        from celery_app import celery_app
        
        task = celery_app.AsyncResult(update["task_id"])
        
        return jsonify({
            "artifact_id": artifact_id,
            "task_id": update["task_id"],
            "status": task.status,
            "result": task.result if task.ready() else None,
            "progress": task.info if task.info else None,
            "priority": update.get("priority", "medium")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<artifact_id>/retry', methods=['POST'])
def retry_artifact_processing(artifact_id):
    """Retry failed artifact processing"""
    try:
        mongodb_client = get_mongodb_client()
        
        # Get latest failed update
        update = mongodb_client.db.artifact_updates.find_one(
            {
                "artifactId": ObjectId(artifact_id),
                "status": "failed"
            },
            sort=[("createdAt", -1)]
        )
        
        if not update:
            return jsonify({"error": "No failed processing found for artifact"}), 404
        
        # Retry with same priority
        priority = update.get("priority", "medium")
        result = process_artifact_by_id(artifact_id, priority)
        
        return jsonify({
            "message": "Processing retried",
            "artifact_id": artifact_id,
            "task_id": result.get("task_id"),
            "priority": priority
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<artifactId>/content', methods=['PUT'])
def update_artifact_conetent(artifactId):
    """Update an artifact by its ID."""
    from datetime import datetime
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({"error": "Content is required"}), 400
    result = update_artifact_content_by_id(artifactId, content)
    # Also insert a new artifact_updates document with status 'processed'
    db = get_mongodb_client().db
    db.artifact_updates.insert_one({
        "artifactId": artifactId,
        "status": "processed",
        "content": content,
        "createdAt": datetime.utcnow()
    })
    return jsonify(result)

@bp.route('/<artifactId>/download', methods=['GET'])
def download_artifact_api(artifactId):
    """Download an artifact file by its ID."""
    # You need to implement this function in your service
    file_path, mime_type, filename = get_artifact_file_by_id(artifactId)
    return send_file(file_path, mimetype=mime_type, as_attachment=True, download_name=filename)

@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
def create_document_artifact_api():
    """Create a new document artifact (rich text, etc)."""
    data = request.get_json()
    capture_type = data.get('captureType', 'document')
    capture_name = data.get('captureName')
    content = data.get('content')
    session_id = data.get('sessionId')
    if not capture_name or not content:
        return jsonify({"error": "captureName and content are required"}), 400
    result = create_document_artifact(capture_name, content, session_id, capture_type)
    return jsonify(result), 201

