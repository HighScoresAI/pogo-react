from flask import Blueprint, request, jsonify, current_app
from pogoapi.services.documentation_service import DocumentationService
from openai import OpenAI
import os
from pogoapi.config import config

bp = Blueprint('documentation', __name__)

@bp.route('/<artifact_id>', methods=['GET'])
def get_documentation(artifact_id):
    """Get documentation for an artifact"""
    try:
        # Get MongoDB client and OpenAI client
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        import os
        
        mongodb_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        service = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
        doc = service.get_artifact_documentation(artifact_id)
        if not doc:
            return jsonify({"error": "Documentation not found"}), 404
        return jsonify(doc)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/by-id/<documentation_id>', methods=['GET'])
def get_documentation_by_id(documentation_id):
    """Get documentation by its ID"""
    try:
        # Get MongoDB client and OpenAI client
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        import os
        
        mongodb_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        service = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
        doc = service.get_documentation_by_id(documentation_id)
        if not doc:
            return jsonify({"error": "Documentation not found"}), 404
        return jsonify(doc)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<sessionId>/generate', methods=['POST'])
def generate_documentation(sessionId: str):
    """Generate documentation for a session"""
    try:
        # Get MongoDB client and OpenAI client
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        import os
        
        mongodb_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        service = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
        result = service.generate_documentation(sessionId)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<documentation_id>', methods=['PUT'])
def update_documentation(documentation_id):
    """Update existing documentation"""
    try:
        content = request.json.get('content')
        # Get MongoDB client and OpenAI client
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        import os
        
        mongodb_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        service = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
        result = service.update_documentation(documentation_id, content)
        if not result:
            return jsonify({"error": "Documentation not found"}), 404
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<documentation_id>/status', methods=['PUT'])
def update_documentation_status(documentation_id):
    """Update documentation status"""
    try:
        status = request.json.get('status')
        # Get MongoDB client and OpenAI client
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        import os
        
        mongodb_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        service = DocumentationService(openai_client=openai_client, db_client=mongodb_client)
        result = service.update_status(documentation_id, status)
        if not result:
            return jsonify({"error": "Documentation not found"}), 404
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 