# main.py

"""
Main Flask application for the Pogo
Combines functionality from multiple services:
- Authentication and user management
- Organization and project management
- Session and artifact processing
- Chat widget integration
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import HTTPException
from openai import OpenAI
from logging.handlers import RotatingFileHandler
from flask_mail import Mail
from flask_jwt_extended import JWTManager
import json
import traceback
import atexit

# Import routes (these will be registered within the factory)
from pogoapi.routes import (
    auth_routes,
    org_routes,
    project_routes,
    session_routes,
    artifact_routes,
    websocket_routes,
    user_routes,
    chat
)
from pogoapi.routes.search_routes import bp as search_routes
from pogoapi.routes.error_routes import bp as error_routes
from pogoapi.routes.extension_routes import bp as extension_routes
from pogoapi.routes.documentation import bp as documentation_routes

# Import services (these will be initialized within the factory)
from pogoapi.services.documentation_service import DocumentationService
from pogoapi.services.audio_service import AudioService
from pogoapi.services.image_service import ImageService
from pogoapi.services.artifact_chain_service import ArtifactChainService
from pogoapi.services.vectorization_service import VectorizationService

# Import utilities (these will be used within the factory)
from pogoapi.utils.mongodb_client import get_mongodb_client, MongoDBClient # Keep get_mongodb_client for singleton
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.llm_processor_utils import LLMProcessorUtils
from pogoapi.utils.document_exporter import DocumentExporter
from pogoapi.utils.websocket_utils import WebSocketManager
from pogoapi.utils.image_utils import ImageProcessor
# Removed global service imports here, they will be initialized and accessed within the factory or via getters
# from pogoapi.utils.global_services import ...
from pogoapi.config import config # Assuming config is needed
    
# Configure logging (can be done outside the factory)
# Basic config is often sufficient here, more specific handlers can be added later
logging.basicConfig(level=logging.DEBUG) # Set to DEBUG to see all debug messages
logger = logging.getLogger(__name__)

# Add file handler for request logging (configure here, add to app in factory)
file_handler = RotatingFileHandler('api_requests.log', maxBytes=1024*1024, backupCount=10, delay=True)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
# logger.addHandler(file_handler) # Add handler in the factory after app is created

# Add error handler (configure here, add to app in factory)
error_handler = RotatingFileHandler('api_errors.log', maxBytes=1024*1024, backupCount=10)
error_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
error_logger = logging.getLogger('error_logger')
error_logger.addHandler(error_handler)
error_logger.setLevel(logging.ERROR)

# Load environment variables (can be done here as they are needed for config)
load_dotenv()
print("QDRANT_URL:", os.getenv("QDRANT_URL"))

# Define global service variables, but initialize them within the factory
mongodb_client = None
openai_client = None
documentation_service = None
audio_service = None
image_service = None
chain_service = None
vectorization_service = None
path_builder = None
image_processor = None
ws_manager = None # WebSocketManager also needs app context
mail = Mail()


def create_app():
    """
    Flask application factory function.
    Creates and configures the Flask application, initializes services, and registers routes.
    """
    global mongodb_client, openai_client, documentation_service, audio_service, image_service, chain_service, vectorization_service, path_builder, image_processor, ws_manager

    logger.info("Creating Flask application instance...")
    
    app = Flask(__name__)
    logger.debug("Flask application instance created.")

    
    # Load configuration (if you have a config.py or similar)
    # app.config.from_object('config.Config') # Example

    # Apply middleware
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    logger.debug("ProxyFix middleware applied.")

    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    logger.debug("CORS configured.")
    
    # Global OPTIONS handler for preflight requests
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        """Handle OPTIONS requests for CORS preflight"""
        response = app.make_default_options_response()
        return response

    # Initialize SocketIO (needs the app instance)
    socketio = SocketIO(app, cors_allowed_origins="*")
    ws_manager = WebSocketManager(socketio)
    logger.debug("SocketIO and WebSocketManager initialized.")

    # Flask app config
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'your-default-secret'),
        MAIL_SERVER='smtp.gmail.com',
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.getenv('EMAIL_USER'),
        MAIL_PASSWORD=os.getenv('EMAIL_PASS'),
        MAIL_DEFAULT_SENDER=os.getenv('EMAIL_USER', 'roshangehlot500@gmail.com')
    )

    mail.init_app(app)

    # Initialize JWT
    jwt = JWTManager(app)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-default-jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Set to False for development
    logger.debug("JWT configured.")

    # Add request logging middleware to the app instance
    # Note: @app.after_request and @app.errorhandler decorators
    # must be applied *after* the app instance is created.

    # Add file handler for request logging to the app's logger
    app.logger.addHandler(file_handler)
    logger.debug("File logging handler added to app.logger.")


    # Global error handler
    @app.errorhandler(Exception)
    def handle_error(e):
        # Log the error with full traceback
        error_data = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc(),
            'request_path': request.path,
            'request_method': request.method,
            'request_data': request.get_json(silent=True) or request.form.to_dict() or None
        }

        error_logger.error(json.dumps(error_data, default=str))
        logger.debug(f"Handled error: {type(e).__name__}")

        # Return a consistent error response
        if isinstance(e, HTTPException):
            response = jsonify({
                'error': e.name,
                'message': str(e),
                'status_code': e.code
            })
            response.status_code = e.code if e.code is not None else 500
        else:
            response = jsonify({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred',
                'status_code': 500
            })
            response.status_code = 500

        return response

    # Add request logging middleware
    @app.after_request
    def log_request(response):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_data = {
            'timestamp': timestamp,
            'method': request.method,
            'path': request.path,
            'status': response.status_code,
            'request_headers': dict(request.headers),
            'response_headers': dict(response.headers),
            'request_data': request.get_json(silent=True) or request.form.to_dict() or None,
            'response_data': response.get_json(silent=True) # Be cautious logging response data
        }

        # Use the app's logger which now has the file handler
        app.logger.info(json.dumps(log_data, default=str))
        logger.debug(f"Logged request: {request.method} {request.path} -> {response.status_code}")
        return response


    def initialize_services_internal():
        """Internal helper to initialize services within the factory"""
        logger.info("Initializing Pogo API services...")

        try:
            # Initialize MongoDB client first as it's required for most operations
            # Use the singleton getter
            logger.debug("Calling get_mongodb_client()...")
            mongo_client_instance = get_mongodb_client()
            logger.debug(f"get_mongodb_client() returned: {mongo_client_instance}")

            if not mongo_client_instance or not getattr(mongo_client_instance, 'client', None):
                 logger.error("MongoDB client not initialized or client object is None after get_mongodb_client()")
                 raise ValueError("Failed to initialize or connect MongoDB client")

            # Assign the initialized singleton instance to the global variable
            globals()['mongodb_client'] = mongo_client_instance
            logger.debug(f"Assigned mongodb_client global: {globals()['mongodb_client']}")

            # Test MongoDB connection
            # The initialize method in MongoDBClient handles the actual connection and test
            # If get_mongodb_client() didn't raise, the client should be initialized.
            # A ping here is a final check, but the client's internal retries should handle initial connection.
            try:
                 logger.debug("Performing final MongoDB ping test during service initialization...")
                 if mongodb_client is not None and getattr(mongodb_client, 'client', None) is not None:
                     mongodb_client.client.admin.command('ping')
                     logger.info("MongoDB ping successful during service initialization.")
                 else:
                     logger.error("MongoDB client or client.admin is None during service initialization ping test.")
                     raise ValueError("MongoDB client or client.admin is None during initialization ping.")
            except Exception as e:
                 logger.error(f"MongoDB ping failed during service initialization: {e}", exc_info=True)
                 raise ValueError(f"MongoDB not reachable during initialization ping: {e}")


            # Initialize OpenAI client
            logger.debug("Initializing OpenAI client...")
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.error("OPENAI_API_KEY environment variable is not set")
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            openai_client = OpenAI(api_key=api_key)
            globals()['openai_client'] = openai_client
            logger.debug("OpenAI client initialized.")


            # Initialize path builder
            logger.debug("Initializing PathBuilder...")
            storage_path = config.get('STORAGE_PATH')
            if not storage_path:
                logger.error("STORAGE_PATH not configured")
                raise ValueError("STORAGE_PATH not configured")
            path_builder = PathBuilder(mongodb_client, storage_path)
            globals()['path_builder'] = path_builder
            logger.debug("PathBuilder initialized.")


            # Initialize other services lazily when needed (assign to globals)
            logger.debug("Initializing other services (lazy)...")
            if openai_client is not None and mongodb_client is not None:
                globals()['documentation_service'] = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
                globals()['audio_service'] = AudioService(openai_client=openai_client, db_client=mongodb_client)
                globals()['image_service'] = ImageService(openai_client=openai_client, db_client=mongodb_client)
                globals()['chain_service'] = ArtifactChainService(openai_client=openai_client, db_client=mongodb_client)
                # Note: VectorizationService takes db, not db_client
                if mongodb_client.db is not None:
                    globals()['vectorization_service'] = VectorizationService(openai_client=openai_client, db=mongodb_client.db)
                else:
                    logger.error("MongoDB database is not initialized for VectorizationService.")
                    globals()['vectorization_service'] = None
            else:
                logger.error("OpenAI client or MongoDB client is not initialized for service construction.")
                globals()['documentation_service'] = None
                globals()['audio_service'] = None
                globals()['image_service'] = None
                globals()['chain_service'] = None
                globals()['vectorization_service'] = None
            globals()['image_processor'] = ImageProcessor() # ImageProcessor might not need other services
            logger.debug("Lazy services assigned to globals.")


            logger.info("All core services initialized successfully.")

        except Exception as e:
            logger.error(f"Critical error initializing services: {str(e)}", exc_info=True)
            # Clean up any initialized services on failure
            if mongodb_client:
                try:
                    mongodb_client.close()
                except:
                    pass
            # Re-raise the exception to indicate a critical startup failure
            raise


    # Initialize services when creating the app instance
    initialize_services_internal()
    logger.debug("Service initialization function called.")


    # Register routes with URL prefixes
    # Blueprints must be registered *after* services they depend on are initialized
    logger.debug("Registering blueprints...")
    app.register_blueprint(auth_routes.bp, url_prefix='/auth')
    app.register_blueprint(org_routes.bp, url_prefix='/organizations')
    app.register_blueprint(project_routes.bp, url_prefix='/projects')
    app.register_blueprint(session_routes.bp, url_prefix='/sessions')
    app.register_blueprint(artifact_routes.bp, url_prefix='/artifacts')
    # Note: WebSocket routes might need special handling with SocketIO
    # Ensure websocket_routes.bp is correctly integrated with your SocketIO setup
    app.register_blueprint(websocket_routes.bp, url_prefix='/ws')
    app.register_blueprint(user_routes.bp, url_prefix='/users')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    app.register_blueprint(search_routes, url_prefix='/search')
    app.register_blueprint(error_routes, url_prefix='/errors')
    app.register_blueprint(extension_routes, url_prefix='/api/extension')
    app.register_blueprint(documentation_routes, url_prefix='/api/documentation')
    logger.debug("Blueprints registered.");

    # Print all registered routes for debugging
    for rule in app.url_map.iter_rules():
        print(f"{rule} -> {rule.methods}")


    # Define the root endpoint directly on the app instance
    @app.route('/', methods=['GET'])
    def read_root():
        """Root endpoint"""
        logger.debug("Root endpoint ('/') called.")
        try:
            # Access the singleton MongoDB client instance via the getter
            logger.debug("Calling get_mongodb_client() in root endpoint...")
            mongo_client_instance = get_mongodb_client()
            logger.debug(f"get_mongodb_client() in root endpoint returned: {mongo_client_instance}")


            # Check if the client was initialized and has a connection
            if not mongo_client_instance or not getattr(mongo_client_instance, 'client', None):
                logger.error("MongoDB client not initialized or client object is None in root endpoint")
                return jsonify({
                    "message": "Welcome to Pogo API",
                    "status": "error",
                    "error": "MongoDB not connected or initialized"
                }), 503

            logger.debug("MongoDB client instance and client object are present.")

            # Test MongoDB connection with a ping
            try:
                logger.debug("Performing MongoDB ping test in root endpoint...")
                if mongo_client_instance is not None and getattr(mongo_client_instance, 'client', None) is not None:
                    mongo_client_instance.client.admin.command('ping')
                    logger.info("MongoDB ping successful from root endpoint.")
                    return jsonify({
                        "message": "Welcome to Pogo API",
                        "status": "healthy",
                        "mongodb": "connected"
                    })
                else:
                    logger.error("MongoDB client or client.admin is None in root endpoint ping test.")
                    return jsonify({
                        "message": "Welcome to Pogo API",
                        "status": "error",
                        "error": "MongoDB client or client.admin is None"
                    }), 503
            except Exception as e:
                logger.error(f"MongoDB connection test failed from root endpoint: {str(e)}", exc_info=True)
                return jsonify({
                    "message": "Welcome to Pogo API",
                    "status": "error",
                    "error": f"MongoDB connection error: {str(e)}"
                }), 503

        except Exception as e:
            logger.error(f"Unexpected error in root endpoint: {str(e)}", exc_info=True)
            return jsonify({
                "message": "Welcome to Pogo API",
                "status": "error",
                "error": str(e)
            }), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            from health_check import run_health_check
            health_status = run_health_check()
            return jsonify(health_status)
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}", exc_info=True)
            return jsonify({
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }), 500

    # Root-level auth routes for frontend compatibility
    @app.route('/signup', methods=['POST', 'OPTIONS'])
    def root_signup():
        """Root-level signup endpoint that redirects to auth blueprint"""
        if request.method == "OPTIONS":
            return "", 200
        # Import and call the auth blueprint signup function
        from pogoapi.routes.auth_routes import signup
        return signup()

    @app.route('/register', methods=['POST', 'OPTIONS'])
    def root_register():
        """Root-level register endpoint that redirects to auth blueprint"""
        if request.method == "OPTIONS":
            return "", 200
        # Import and call the auth blueprint register function
        from pogoapi.routes.auth_routes import register
        return register()

    @app.route('/login', methods=['POST', 'OPTIONS'])
    def root_login():
        """Root-level login endpoint that redirects to auth blueprint"""
        if request.method == "OPTIONS":
            return "", 200
        # Import and call the auth blueprint login function
        from pogoapi.routes.auth_routes import login
        return login()

    # Add atexit cleanup handler
    def cleanup_resources():
        logger.info("Cleaning up Pogo API resources...")
        mongo_client_instance = get_mongodb_client()
        if mongo_client_instance:
            try:
                mongo_client_instance.close()
            except Exception as e:
                logger.error(f"Error closing MongoDB connection during cleanup: {str(e)}", exc_info=True)
        else:
            logger.debug("MongoDB client not initialized, nothing to close during cleanup.")

    atexit.register(cleanup_resources)

    # Add media serving route at the app level
    @app.route('/media/<path:filename>', methods=['GET'])
    def serve_media(filename):
        storage_dir = os.path.join(os.getcwd(), 'storage')
        return send_from_directory(storage_dir, filename)

    logger.info("Flask application instance creation and configuration complete.")
    return app, socketio # Return the configured app instance


# The __main__ block is for running the development server directly
# This block is NOT executed by Gunicorn
if __name__ == "__main__":
    # When running main.py directly (e.g., for local development),
    # create the app using the factory and run it.
    logger.info("Running Flask development server...")
    app, socketio = create_app()
    # Note: SocketIO.run() should be used instead of app.run() if using SocketIO
    # For development, you might run with 'flask run' or a separate script
    # that calls socketio.run(app, ...)
    # If you must use this block, consider:
    # socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=True)
    # Ensure socketio is accessible here if needed
    try:
        # Access the socketio object created in the factory
        # This might require making socketio a global or finding another way to access it
        # if running directly via this block.
        # A simpler approach is to have a separate run.py for development.
        # For now, let's assume you handle development server running elsewhere
        # or adjust this block appropriately if you use it.
        logger.warning("Running directly via __main__ block. Ensure SocketIO is handled correctly.")
        # app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=True)
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=True)
    except Exception as e:
        logger.error(f"Error running development server: {e}", exc_info=True)

