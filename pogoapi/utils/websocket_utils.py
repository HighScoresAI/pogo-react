from flask_socketio import SocketIO, emit, join_room, leave_room
from typing import Dict, List
from werkzeug.exceptions import BadRequest

class WebSocketManager:
    """
    Manages WebSocket connections and room-based messaging.
    """
    
    def __init__(self, socketio: SocketIO):
        """
        Initialize with Flask-SocketIO instance.
        
        Args:
            socketio: Flask-SocketIO instance
        """
        self.socketio = socketio
        self.active_connections: Dict[str, List[str]] = {}  # project_id -> list of socket_ids
        
    def connect(self, project_id: str, socket_id: str):
        """
        Connect a client to a project room.
        
        Args:
            project_id (str): Project ID
            socket_id (str): Socket ID of the client
        """
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(socket_id)
        join_room(project_id)
        
    def disconnect(self, project_id: str, socket_id: str):
        """
        Disconnect a client from a project room.
        
        Args:
            project_id (str): Project ID
            socket_id (str): Socket ID of the client
        """
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(socket_id)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        leave_room(project_id)
        
    def send_message(self, project_id: str, event: str, data: dict):
        """
        Send a message to all clients in a project room.
        
        Args:
            project_id (str): Project ID
            event (str): Event name
            data (dict): Message data
            
        Raises:
            BadRequest: If project room doesn't exist
        """
        if project_id not in self.active_connections:
            raise BadRequest(f"Project {project_id} has no active connections")
            
        emit(event, data, room=project_id)
        
    def get_active_connections(self, project_id: str) -> List[str]:
        """
        Get list of active connections for a project.
        
        Args:
            project_id (str): Project ID
            
        Returns:
            List[str]: List of socket IDs
            
        Raises:
            BadRequest: If project room doesn't exist
        """
        if project_id not in self.active_connections:
            raise BadRequest(f"Project {project_id} has no active connections")
            
        return self.active_connections[project_id]
        
    def is_connected(self, project_id: str, socket_id: str) -> bool:
        """
        Check if a client is connected to a project room.
        
        Args:
            project_id (str): Project ID
            socket_id (str): Socket ID of the client
            
        Returns:
            bool: True if connected, False otherwise
        """
        return (project_id in self.active_connections and 
                socket_id in self.active_connections[project_id]) 