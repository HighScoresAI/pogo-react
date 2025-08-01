"""
Routes package initialization.
This file marks the routes directory as a Python package.
"""

from flask import Blueprint

# Import all route blueprints
from pogoapi.routes import auth_routes
from pogoapi.routes import org_routes
from pogoapi.routes import project_routes
from pogoapi.routes import session_routes
from pogoapi.routes import artifact_routes
from pogoapi.routes import websocket_routes
from pogoapi.routes import user_routes
from pogoapi.routes import extension_routes

# Import chat routes
from pogoapi.routes.chat import bp as chat_routes

# Export all route modules
__all__ = [
    'auth_routes',
    'org_routes',
    'project_routes',
    'session_routes',
    'artifact_routes',
    'websocket_routes',
    'user_routes',
    'chat_routes',
    'extension_routes'
]
