"""
Search routes for advanced search functionality
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest, NotFound
from bson import ObjectId
from pogoapi.services.search_service import SearchService
from pogoapi.utils.mongodb_client import get_mongodb_client
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('search', __name__)
search_service = SearchService()

@bp.route('/artifacts', methods=['GET'])
def search_artifacts():
    """Search artifacts with advanced filtering"""
    try:
        # Get query parameters
        query = request.args.get('q', '').strip()
        project_id = request.args.get('project_id')
        session_id = request.args.get('session_id')
        artifact_type = request.args.getlist('type')
        status = request.args.getlist('status')
        creator = request.args.get('creator')
        tags = request.args.getlist('tags')
        sort_by = request.args.get('sort_by', 'relevance')
        page = int(request.args.get('page', 1))
        size = min(int(request.args.get('size', 20)), 100)  # Max 100 results
        fuzzy = request.args.get('fuzzy', 'true').lower() == 'true'
        highlight = request.args.get('highlight', 'true').lower() == 'true'
        
        # Build filters
        filters = {}
        if project_id:
            filters['project_id'] = project_id
        if session_id:
            filters['session_id'] = session_id
        if artifact_type:
            filters['type'] = artifact_type
        if status:
            filters['status'] = status
        if creator:
            filters['creator'] = creator
        if tags:
            filters['tags'] = tags
        
        # Date range filter
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        if date_from or date_to:
            filters['date_range'] = {}
            if date_from:
                filters['date_range']['start'] = date_from
            if date_to:
                filters['date_range']['end'] = date_to
        
        # Perform search
        results = search_service.search_artifacts(
            query=query,
            filters=filters,
            sort_by=sort_by,
            page=page,
            size=size,
            fuzzy=fuzzy,
            highlight=highlight
        )
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error in search_artifacts: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/suggestions', methods=['GET'])
def get_search_suggestions():
    """Get search suggestions"""
    try:
        query = request.args.get('q', '').strip()
        size = min(int(request.args.get('size', 5)), 20)
        
        if not query:
            return jsonify({"suggestions": []})
        
        suggestions = search_service.search_suggestions(query, size)
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        logger.error(f"Error in get_search_suggestions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/global', methods=['GET'])
def global_search():
    """Global search across all content types"""
    try:
        query = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        size = min(int(request.args.get('size', 20)), 100)
        
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
        
        # Search artifacts
        artifact_results = search_service.search_artifacts(
            query=query,
            page=page,
            size=size,
            fuzzy=True,
            highlight=True
        )
        
        # Search projects (basic implementation)
        mongodb_client = get_mongodb_client()
        project_results = []
        
        # Simple text search in projects
        projects = mongodb_client.db.projects.find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }).limit(size)
        
        for project in projects:
            project_results.append({
                "type": "project",
                "id": str(project["_id"]),
                "name": project.get("name", ""),
                "description": project.get("description", ""),
                "created_at": project.get("createdAt"),
                "score": 1.0  # Simple scoring
            })
        
        # Search sessions (basic implementation)
        session_results = []
        sessions = mongodb_client.db.sessions.find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }).limit(size)
        
        for session in sessions:
            session_results.append({
                "type": "session",
                "id": str(session["_id"]),
                "name": session.get("name", ""),
                "description": session.get("description", ""),
                "project_id": str(session.get("projectId", "")),
                "created_at": session.get("createdAt"),
                "score": 1.0
            })
        
        # Combine and sort results
        all_results = []
        
        # Add artifacts with type
        for hit in artifact_results.get("hits", []):
            hit["type"] = "artifact"
            all_results.append(hit)
        
        # Add projects
        all_results.extend(project_results)
        
        # Add sessions
        all_results.extend(session_results)
        
        # Sort by score (descending)
        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # Apply pagination
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_results = all_results[start_idx:end_idx]
        
        return jsonify({
            "hits": paginated_results,
            "total": len(all_results),
            "page": page,
            "size": size,
            "query": query,
            "breakdown": {
                "artifacts": len(artifact_results.get("hits", [])),
                "projects": len(project_results),
                "sessions": len(session_results)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in global_search: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/reindex', methods=['POST'])
def reindex_all():
    """Reindex all artifacts in Elasticsearch"""
    try:
        result = search_service.reindex_all()
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in reindex_all: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/stats', methods=['GET'])
def get_search_stats():
    """Get search statistics"""
    try:
        if not search_service.es:
            return jsonify({"error": "Elasticsearch not available"}), 503
        
        # Get index stats
        stats = search_service.es.indices.stats(index=search_service.index_name)
        
        # Get document count
        count = search_service.es.count(index=search_service.index_name)
        
        return jsonify({
            "index_name": search_service.index_name,
            "document_count": count["count"],
            "index_size": stats["indices"][search_service.index_name]["total"]["store"]["size_in_bytes"],
            "status": "healthy" if search_service.es.ping() else "unhealthy"
        })
        
    except Exception as e:
        logger.error(f"Error in get_search_stats: {str(e)}")
        return jsonify({"error": str(e)}), 500 