from flask import Blueprint, request, jsonify, send_file
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest, NotFound
from bson import ObjectId
from pogoapi.utils.auth_utils import jwt_required_custom
from pogoapi.utils.mongodb_client import get_mongodb_client
import secrets
import time
import base64
from io import BytesIO

# Create Blueprint
bp = Blueprint('extension', __name__)

# In-memory stores for demo (replace with persistent storage in production)
pairing_codes = {}  # code: {user_id, expires_at}

# In-memory store for sessions (for demo)
extension_sessions = []  # Each session: {sessionId, user_id, projectId, name, created_at}

# In-memory store for artifacts (for demo)
extension_artifacts = []  # Each artifact: {artifactId, sessionId, user_id, name, type, content, metadata, created_at}

# In-memory store for extension settings (for demo)
extension_settings = {}  # user_id: {key: value}

PAIRING_CODE_EXPIRY = 300  # seconds

def get_user_id_from_token(ext_token):
    token_doc = get_mongodb_client().get_extension_token(ext_token)
    if not token_doc:
        return None
    return token_doc['user_id']

@bp.route('/auth/pair', methods=['POST'])
@jwt_required_custom
def generate_pairing_code(user_id=None):
    """
    Generate a pairing code for the logged-in user.
    """
    code = secrets.token_urlsafe(8)
    expires_at = time.time() + PAIRING_CODE_EXPIRY
    pairing_codes[code] = {'user_id': user_id, 'expires_at': expires_at}
    return jsonify({'pairingCode': code, 'expiresIn': PAIRING_CODE_EXPIRY})

@bp.route('/auth/verify', methods=['POST'])
def verify_pairing_code():
    """
    Extension submits code, receives extension token, and links to user.
    """
    data = request.get_json()
    code = data.get('pairingCode')
    if not code or code not in pairing_codes:
        return jsonify({'error': 'Invalid or expired pairing code'}), 400
    entry = pairing_codes[code]
    if time.time() > entry['expires_at']:
        del pairing_codes[code]
        return jsonify({'error': 'Pairing code expired'}), 400
    user_id = entry['user_id']
    # Generate extension token
    ext_token = secrets.token_urlsafe(32)
    token_data = {
        'token': ext_token,
        'user_id': user_id,
        'created_at': time.time(),
        'status': 'active',
        'pairing_code': code,
        'ip_address': request.remote_addr,
        'device_info': request.headers.get('User-Agent'),
        'metadata': {},
    }
    get_mongodb_client().store_extension_token(token_data)
    del pairing_codes[code]
    return jsonify({'extensionToken': ext_token})

@bp.route('/sessions', methods=['POST'])
def create_extension_session():
    ext_token = request.headers.get('Extension-Token')
    user_id = get_user_id_from_token(ext_token)
    if not ext_token or not user_id:
        return jsonify({'error': 'Invalid or missing Extension-Token'}), 401
    data = request.get_json()
    project_id = data.get('projectId')
    name = data.get('name')
    if not project_id or not name:
        return jsonify({'error': 'projectId and name are required'}), 400
    session_id = secrets.token_urlsafe(12)
    session = {
        'sessionId': session_id,
        'user_id': user_id,
        'projectId': project_id,
        'name': name,
        'created_at': time.time()
    }
    db = get_mongodb_client().db
    db.extension_sessions.insert_one(session)
    upload_urls = [f'https://dummy-upload-url/{session_id}/artifact/{i}' for i in range(1, 4)]
    return jsonify({'sessionId': session_id, 'uploadUrls': upload_urls})

@bp.route('/artifacts', methods=['POST'])
def upload_extension_artifact():
    ext_token = request.headers.get('Extension-Token')
    user_id = get_user_id_from_token(ext_token)
    if not ext_token or not user_id:
        return jsonify({'error': 'Invalid or missing Extension-Token'}), 401
    db = get_mongodb_client().db
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        files = request.files.getlist('file')
        session_id = request.form.get('sessionId')
        name = request.form.get('name')
        artifact_type = request.form.get('type')
        metadata = request.form.get('metadata', {})
        if not session_id or not name or not artifact_type or not files:
            return jsonify({'error': 'sessionId, name, type, and file(s) are required'}), 400
        artifact_ids = []
        for file in files:
            content = file.read()
            artifact_id = secrets.token_urlsafe(16)
            artifact = {
                'artifactId': artifact_id,
                'sessionId': session_id,
                'user_id': user_id,
                'name': name,
                'type': artifact_type,
                'content': content,
                'metadata': metadata,
                'created_at': time.time()
            }
            db.extension_artifacts.insert_one(artifact)
            artifact_ids.append(artifact_id)
        return jsonify({'artifactIds': artifact_ids, 'status': 'uploaded'})
    elif request.is_json:
        data = request.get_json()
        session_id = data.get('sessionId')
        name = data.get('name')
        artifact_type = data.get('type')
        content = data.get('content')
        metadata = data.get('metadata', {})
        if not session_id or not name or not artifact_type or not content:
            return jsonify({'error': 'sessionId, name, type, and content are required'}), 400
        artifact_id = secrets.token_urlsafe(16)
        artifact = {
            'artifactId': artifact_id,
            'sessionId': session_id,
            'user_id': user_id,
            'name': name,
            'type': artifact_type,
            'content': base64.b64decode(content) if isinstance(content, str) else content,
            'metadata': metadata,
            'created_at': time.time()
        }
        db.extension_artifacts.insert_one(artifact)
        return jsonify({'artifactId': artifact_id, 'status': 'uploaded'})
    else:
        return jsonify({'error': 'Unsupported Media Type: must be application/json or multipart/form-data'}), 415

@bp.route('/artifacts', methods=['GET'])
def list_extension_artifacts():
    ext_token = request.headers.get('Extension-Token')
    user_id = get_user_id_from_token(ext_token)
    if not ext_token or not user_id:
        return jsonify({'error': 'Invalid or missing Extension-Token'}), 401
    session_id = request.args.get('sessionId')
    if not session_id:
        return jsonify({'error': 'sessionId is required'}), 400
    backend_url = request.host_url.rstrip('/')
    db = get_mongodb_client().db
    artifacts = list(db.extension_artifacts.find({'user_id': user_id, 'sessionId': session_id}))
    result = [
        {
            'artifactId': a['artifactId'],
            'name': a['name'],
            'type': a['type'],
            'created_at': a['created_at'],
            'preview': f"{backend_url}/api/extension/artifacts/{a['artifactId']}/file" if a['type'] in ('image', 'audio') else None
        }
        for a in artifacts
    ]
    return jsonify(result)

@bp.route('/artifacts/<artifact_id>/file', methods=['GET'])
def get_extension_artifact_file(artifact_id):
    db = get_mongodb_client().db
    artifact = db.extension_artifacts.find_one({'artifactId': artifact_id})
    if not artifact:
        return jsonify({'error': 'Artifact not found'}), 404
    content = artifact['content']
    artifact_type = artifact['type']
    if isinstance(content, str):
        import base64
        content = base64.b64decode(content)
    if artifact_type == 'image':
        mimetype = 'image/png'
        filename = f"{artifact['name']}.png"
    elif artifact_type == 'audio':
        mimetype = 'audio/webm'
        filename = f"{artifact['name']}.webm"
    else:
        mimetype = 'application/octet-stream'
        filename = artifact['name']
    return send_file(BytesIO(content), mimetype=mimetype, as_attachment=False, download_name=filename)

@bp.route('/sessions', methods=['GET'])
def list_extension_sessions():
    ext_token = request.headers.get('Extension-Token')
    user_id = get_user_id_from_token(ext_token)
    if not ext_token or not user_id:
        return jsonify({'error': 'Invalid or missing Extension-Token'}), 401
    db = get_mongodb_client().db
    sessions = list(db.extension_sessions.find({'user_id': user_id}))
    for s in sessions:
        s.pop('_id', None)  # Remove _id field to avoid ObjectId serialization error
    return jsonify({'sessions': sessions})

@bp.route('/devices', methods=['GET'])
@jwt_required_custom
def list_extension_devices(user_id=None):
    """
    List connected extensions/devices for the user.
    """
    db = get_mongodb_client()
    tokens = list(db.db.extension_tokens.find({'user_id': user_id, 'status': {'$ne': 'revoked'}}))
    for t in tokens:
        t['_id'] = str(t['_id'])
        # Ensure created_at is a number (timestamp)
        if isinstance(t['created_at'], (int, float)):
            t['created_at'] = int(t['created_at'])
        else:
            try:
                t['created_at'] = int(float(t['created_at']))
            except Exception:
                t['created_at'] = 0
    return jsonify({'devices': tokens})

@bp.route('/devices/<token>', methods=['DELETE'])
@jwt_required_custom
def revoke_extension_device(token, user_id=None):
    """
    Revoke extension access (only for user's own tokens).
    """
    db = get_mongodb_client().db
    result = db.extension_tokens.delete_one({'token': token, 'user_id': user_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Token not found or not owned by user'}), 404
    return jsonify({'message': 'Extension token revoked'})

@bp.route('/settings', methods=['GET'])
@jwt_required_custom
def get_extension_settings(user_id=None):
    """
    Get extension settings for the user.
    """
    settings = extension_settings.get(user_id, {})
    return jsonify({'settings': settings})

@bp.route('/settings', methods=['PUT'])
@jwt_required_custom
def update_extension_settings(user_id=None):
    """
    Update extension settings for the user.
    Request: { key, value }
    """
    data = request.get_json()
    key = data.get('key')
    value = data.get('value')
    if not key:
        return jsonify({'error': 'key is required'}), 400
    if user_id not in extension_settings:
        extension_settings[user_id] = {}
    extension_settings[user_id][key] = value
    return jsonify({'settings': extension_settings[user_id]}) 