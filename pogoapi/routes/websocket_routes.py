from flask import Blueprint, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from pogoapi.utils.websocket_utils import WebSocketManager
from bson import ObjectId
from pogoapi.utils.mongodb_client import get_mongodb_client
from werkzeug.exceptions import BadRequest

bp = Blueprint('websocket', __name__)
socketio = SocketIO()

# Initialize WebSocket manager and MongoDB client
ws_manager = WebSocketManager(socketio)
mongodb_client = get_mongodb_client()

@socketio.on('connect')
def handle_connect(projectId):
    """
    Handle WebSocket connection.
    
    Args:
        projectId (str): Project ID
        
    Returns:
        bool: True if connection accepted, False if rejected
    """
    try:
        project_object_id = ObjectId(projectId)
    except:
        return False  # Reject connection

    # Verify project exists
    project = mongodb_client.db.projects.find_one({"_id": project_object_id})
    if not project:
        return False  # Reject connection

    # Connect to project room
    ws_manager.connect(projectId, request.sid)
    return True

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handle WebSocket disconnection.
    """
    projectId = request.args.get('projectId')
    if projectId:
        ws_manager.disconnect(projectId, request.sid)

@socketio.on('message')
def handle_message(data):
    """
    Handle incoming WebSocket message.
    
    Args:
        data: Message data
    """
    projectId = request.args.get('projectId')
    if projectId:
        try:
            # Send message to all clients in the project room
            ws_manager.send_message(projectId, 'message', data)
        except BadRequest as e:
            emit('error', str(e), room=request.sid)

@socketio.on('join')
def handle_join(projectId):
    """
    Handle joining a project room.
    
    Args:
        projectId (str): Project ID
    """
    try:
        project_object_id = ObjectId(projectId)
    except:
        emit('error', 'Invalid project ID', room=request.sid)
        return

    # Verify project exists
    project = mongodb_client.db.projects.find_one({"_id": project_object_id})
    if not project:
        emit('error', 'Project not found', room=request.sid)
        return

    # Join project room
    join_room(projectId)
    emit('joined', {'projectId': projectId}, room=request.sid)

@socketio.on('leave')
def handle_leave(projectId):
    """
    Handle leaving a project room.
    
    Args:
        projectId (str): Project ID
    """
    leave_room(projectId)
    emit('left', {'projectId': projectId}, room=request.sid)
