from flask import Blueprint, request, jsonify
from pogoapi.services.session_service import (
    create_session,
    get_session_by_id,
    list_sessions_by_project,
    update_session,
    delete_session,
    get_session_artifacts,
    process_session_artifacts,
    SessionService
)
from pogoapi.utils.storage_utils import get_storage_path
import os
from flask import url_for, send_from_directory
from pogoapi.utils.storage_utils import get_storage_path
from pogoapi.utils.mongodb_client import get_mongodb_client
from bson.objectid import ObjectId
from flask import current_app
from werkzeug.utils import secure_filename
from datetime import datetime, timezone
import uuid
from bson import ObjectId
from pogoapi.services.session_service import get_artifacts_by_session_id

bp = Blueprint('sessions', __name__)
session_service = SessionService()

def convert_objectids(obj):
    if isinstance(obj, dict):
        return {k: convert_objectids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(i) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def get_all_sessions():
    """Gets all sessions for the authenticated user."""
    db = get_mongodb_client()
    sessions = list(db.db.testCollection.find())
    sessions = [convert_objectids(session) for session in sessions]
    return jsonify(sessions)

@bp.route('/', methods=['POST'])
def create_new_session():
    """Creates a new session."""
    session_data = request.get_json()
    result = create_session(session_data)
    return jsonify(result)

@bp.route('/<sessionId>/storage-path', methods=['GET'])
def get_storage_path_route(sessionId):
    """Gets the storage path for a session."""
    result = get_storage_path(sessionId)
    return jsonify(result)

@bp.route('/project/<projectId>', methods=['GET'])
def list_project_sessions(projectId):
    """Lists all sessions for a project."""
    result = list_sessions_by_project(projectId)
    return jsonify(result)

@bp.route('/<sessionId>', methods=['DELETE'])
def delete_session_route(sessionId):
    """Deletes a session."""
    result = delete_session(sessionId)
    return jsonify(result)

# This route processes all artifacts in a session.
@bp.route('/<sessionId>/process', methods=['POST'])
def process_session_route(sessionId):
    """Process all artifacts in a session."""
    result = session_service.process_session(sessionId)
    return jsonify(result)

@bp.route('/<sessionId>', methods=['PUT'])
def update_session_route(sessionId):
    """Updates a session."""
    session_data = request.get_json()
    result = update_session(sessionId, session_data)
    return jsonify(result)

@bp.route('/media/<path:filename>', methods=['GET'])
def serve_media(filename):
    # Serve files from the storage directory
    storage_dir = os.path.join(os.getcwd(), 'storage')
    return send_from_directory(storage_dir, filename)

@bp.route('/<session_id>', methods=['GET'])
def get_session(session_id):
    db = get_mongodb_client()
    session = None
    try:
        session_obj_id = ObjectId(session_id)
        session = db.db.testCollection.find_one({'_id': session_obj_id})
    except Exception:
        pass
    if not session:
        session = db.db.testCollection.find_one({'_id': session_id})
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    # Convert ObjectId and datetime fields to strings
    session['sessionId'] = str(session['_id'])
    session.pop('_id', None)
    if 'projectId' in session:
        session['projectId'] = str(session['projectId'])
    if 'createdBy' in session:
        session['createdBy'] = str(session['createdBy'])
    if 'createdAt' in session and hasattr(session['createdAt'], 'isoformat'):
        session['createdAt'] = session['createdAt'].isoformat()
    # Get storage path for this session
    storage_rel_path = get_storage_path(session_id)
    storage_abs_path = os.path.join(os.getcwd(), 'storage', storage_rel_path)
    audio_exts = {'.mp3', '.wav', '.m4a', '.flac', '.webm'}
    image_exts = {'.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'}
    audio_files = []
    screenshots = []
    if os.path.exists(storage_abs_path):
        for fname in os.listdir(storage_abs_path):
            ext = os.path.splitext(fname)[1].lower()
            media_url = f'http://localhost:5000/media/{storage_rel_path}/{fname}'
            if ext in audio_exts:
                audio_files.append(media_url)
            elif ext in image_exts:
                screenshots.append(media_url)
    session['audioFiles'] = audio_files
    session['screenshots'] = screenshots
    return jsonify(session)

@bp.route('/<sessionId>/artifacts', methods=['GET'])
def get_artifacts_by_session_id_route(sessionId):
    """Gets all artifacts for a session by its ID."""
    result = get_artifacts_by_session_id(sessionId)
    return jsonify(result)

@bp.route('/<sessionId>/publish', methods=['POST'])
def publish_by_session_id_route(sessionId):
    """Push all artifacts for a session by its ID."""
    result = session_service.publish_by_session_id(sessionId)
    return jsonify(result)

@bp.route('/<sessionId>/upload/image', methods=['POST'])
def upload_session_image(sessionId):
    db = get_mongodb_client()
    print(f"[UPLOAD IMAGE] Looking for session: {sessionId}")
    print(f"[UPLOAD IMAGE] Type of sessionId: {type(sessionId)}")
    session = None
    try:
        session_obj_id = ObjectId(sessionId)
        print(f"[UPLOAD IMAGE] ObjectId lookup: {session_obj_id}")
        session = db.db.testCollection.find_one({'_id': session_obj_id})
        print(f"[UPLOAD IMAGE] ObjectId lookup result: {session}")
    except Exception as e:
        print(f"[UPLOAD IMAGE] ObjectId conversion failed: {e}")
    if not session:
        session = db.db.testCollection.find_one({'_id': sessionId})
        print(f"[UPLOAD IMAGE] String lookup result: {session}")
    if not session:
        print(f"[UPLOAD IMAGE] Session not found for id: {sessionId}")
        return jsonify({'error': 'Session not found'}), 404
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']:
        return jsonify({'error': 'Invalid image file type'}), 400
    unique_filename = f"{uuid.uuid4()}{ext}"
    storage_rel_path = get_storage_path(sessionId)
    storage_abs_path = os.path.join(os.getcwd(), 'storage', storage_rel_path)
    os.makedirs(storage_abs_path, exist_ok=True)
    file_path = os.path.join(storage_abs_path, unique_filename)
    file.save(file_path)
    file_url = f"/storage/{storage_rel_path}/{unique_filename}"

    # Store artifact in session's artifacts array
    artifact = {
        "_id": str(uuid.uuid4()),
        "captureName": filename,
        "captureType": "screenshot",
        "createdAt": datetime.now(timezone.utc),
        "url": file_url
    }
    db.db.testCollection.update_one(
        {"_id": session["_id"]},
        {"$push": {"artifacts": artifact}}
    )
    return jsonify({'message': 'Image uploaded', 'url': file_url, 'filename': unique_filename})

@bp.route('/<sessionId>/upload/audio', methods=['POST'])
def upload_session_audio(sessionId):
    db = get_mongodb_client()
    print(f"[UPLOAD AUDIO] Looking for session: {sessionId}")
    print(f"[UPLOAD AUDIO] Type of sessionId: {type(sessionId)}")
    session = None
    try:
        session_obj_id = ObjectId(sessionId)
        print(f"[UPLOAD AUDIO] ObjectId lookup: {session_obj_id}")
        session = db.db.testCollection.find_one({'_id': session_obj_id})
        print(f"[UPLOAD AUDIO] ObjectId lookup result: {session}")
    except Exception as e:
        print(f"[UPLOAD AUDIO] ObjectId conversion failed: {e}")
    if not session:
        session = db.db.testCollection.find_one({'_id': sessionId})
        print(f"[UPLOAD AUDIO] String lookup result: {session}")
    if not session:
        print(f"[UPLOAD AUDIO] Session not found for id: {sessionId}")
        return jsonify({'error': 'Session not found'}), 404
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.mp3', '.wav', '.m4a', '.flac', '.webm']:
        return jsonify({'error': 'Invalid audio file type'}), 400
    unique_filename = f"{uuid.uuid4()}{ext}"
    storage_rel_path = get_storage_path(sessionId)
    storage_abs_path = os.path.join(os.getcwd(), 'storage', storage_rel_path)
    os.makedirs(storage_abs_path, exist_ok=True)
    file_path = os.path.join(storage_abs_path, unique_filename)
    file.save(file_path)
    file_url = f"/storage/{storage_rel_path}/{unique_filename}"

    # Store artifact in session's artifacts array
    artifact = {
        "_id": str(uuid.uuid4()),
        "captureName": filename,
        "captureType": "audio",
        "createdAt": datetime.now(timezone.utc),
        "url": file_url
    }
    db.db.testCollection.update_one(
        {"_id": session["_id"]},
        {"$push": {"artifacts": artifact}}
    )
    return jsonify({'message': 'Audio uploaded', 'url': file_url, 'filename': unique_filename})

@bp.route('/<sessionId>/processed-texts', methods=['GET'])
def get_processed_texts_for_session(sessionId):
    db = get_mongodb_client()
    try:
        # Fetch the session document from testCollection
        session = None
        try:
            session = db.db.testCollection.find_one({'_id': ObjectId(sessionId)})
        except Exception:
            pass
        if not session:
            session = db.db.testCollection.find_one({'_id': sessionId})
        if not session or 'artifacts' not in session:
            return jsonify([])

        result = []
        for artifact in session['artifacts']:
            artifact_id = artifact.get('_id')
            capture_type = artifact.get('captureType', '')
            capture_name = artifact.get('captureName', '')
            # Find latest processed update
            update = db.db['artifact_updates'].find_one(
                {'artifactId': artifact_id, 'status': 'processed'},
                sort=[('createdAt', -1)]
            )
            processed_text = update.get('content', '') if update else None
            result.append({
                'artifactId': artifact_id,
                'captureType': capture_type,
                'captureName': capture_name,
                'processedText': processed_text
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<sessionId>/vectorize', methods=['POST'])
def vectorize_session_texts_route(sessionId):
    """Vectorize all processed texts for artifacts in a session."""
    try:
        result = session_service.vectorize_session_texts(sessionId)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


