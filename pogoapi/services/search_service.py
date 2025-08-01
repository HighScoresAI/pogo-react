"""
Search service using Elasticsearch for enhanced search capabilities
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError, NotFoundError
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from pogoapi.utils.mongodb_client import get_mongodb_client

logger = logging.getLogger(__name__)

class SearchService:
    """Service for handling advanced search operations with Elasticsearch"""
    
    def __init__(self):
        """Initialize Elasticsearch client"""
        try:
            es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
            es_username = os.getenv('ELASTICSEARCH_USERNAME', 'elastic')
            es_password = os.getenv('ELASTICSEARCH_PASSWORD', '')

            self.es = Elasticsearch(
                [es_url],
                basic_auth=(es_username, es_password),
                verify_certs=False
            )
            
            self.mongodb_client = get_mongodb_client()
            self.index_name = 'pogo_artifacts'
            
            # Create index if it doesn't exist
            self._create_index()
            
            logger.info("SearchService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize SearchService: {str(e)}")
            self.es = None
    
    def _create_index(self):
        """Create Elasticsearch index with proper mapping"""
        if not self.es:
            return
            
        try:
            if not self.es.indices.exists(index=self.index_name):
                mapping = {
                    "mappings": {
                        "properties": {
                            "artifact_id": {"type": "keyword"},
                            "session_id": {"type": "keyword"},
                            "project_id": {"type": "keyword"},
                            "content": {
                                "type": "text",
                                "analyzer": "standard",
                                "search_analyzer": "standard"
                            },
                            "title": {
                                "type": "text",
                                "analyzer": "standard"
                            },
                            "type": {"type": "keyword"},
                            "status": {"type": "keyword"},
                            "creator": {"type": "keyword"},
                            "tags": {"type": "keyword"},
                            "created_at": {"type": "date"},
                            "updated_at": {"type": "date"},
                            "file_size": {"type": "long"},
                            "duration": {"type": "float"}
                        }
                    },
                    "settings": {
                        "analysis": {
                            "analyzer": {
                                "fuzzy_analyzer": {
                                    "type": "custom",
                                    "tokenizer": "standard",
                                    "filter": ["lowercase", "fuzzy_filter"]
                                }
                            },
                            "filter": {
                                "fuzzy_filter": {
                                    "type": "edge_ngram",
                                    "min_gram": 2,
                                    "max_gram": 20
                                }
                            }
                        }
                    }
                }
                
                self.es.indices.create(index=self.index_name, body=mapping)
                logger.info(f"Created Elasticsearch index: {self.index_name}")
        except Exception as e:
            logger.error(f"Error creating Elasticsearch index: {str(e)}")
    
    def index_artifact(self, artifact_data: Dict[str, Any]) -> bool:
        """Index an artifact in Elasticsearch"""
        if not self.es:
            return False
            
        try:
            # Prepare document for indexing
            doc = {
                "artifact_id": str(artifact_data.get("_id")),
                "session_id": str(artifact_data.get("sessionId")),
                "project_id": str(artifact_data.get("projectId", "")),
                "content": artifact_data.get("processedText", ""),
                "title": artifact_data.get("captureName", ""),
                "type": artifact_data.get("captureType", ""),
                "status": artifact_data.get("status", "pending"),
                "creator": artifact_data.get("createdBy", ""),
                "tags": artifact_data.get("tags", []),
                "created_at": artifact_data.get("createdAt"),
                "updated_at": artifact_data.get("updatedAt"),
                "file_size": artifact_data.get("fileSize", 0),
                "duration": artifact_data.get("duration", 0)
            }
            
            # Index the document
            self.es.index(
                index=self.index_name,
                id=str(artifact_data.get("_id")),
                body=doc
            )
            
            return True
        except Exception as e:
            logger.error(f"Error indexing artifact: {str(e)}")
            return False
    
    def search_artifacts(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "relevance",
        page: int = 1,
        size: int = 20,
        fuzzy: bool = True,
        highlight: bool = True
    ) -> Dict[str, Any]:
        """
        Search artifacts with advanced filtering and highlighting
        
        Args:
            query: Search query
            filters: Optional filters (project_id, session_id, type, status, creator, date_range)
            sort_by: Sort field (relevance, created_at, updated_at, title)
            page: Page number
            size: Results per page
            fuzzy: Enable fuzzy matching
            highlight: Enable result highlighting
            
        Returns:
            Search results with metadata
        """
        if not self.es:
            return {"hits": [], "total": 0, "page": page, "size": size}
        
        try:
            # Create search object
            s = Search(using=self.es, index=self.index_name)
            
            # Build query
            if query.strip():
                if fuzzy:
                    # Fuzzy search with multiple fields
                    q = MultiMatch(
                        query=query,
                        fields=["content^3", "title^2", "tags"],
                        type="best_fields",
                        fuzziness="AUTO",
                        prefix_length=2
                    )
                else:
                    # Exact search
                    q = MultiMatch(
                        query=query,
                        fields=["content^3", "title^2", "tags"],
                        type="best_fields"
                    )
                s = s.query(q)
            else:
                # Match all if no query
                s = s.query("match_all")
            
            # Apply filters
            if filters:
                filter_queries = []
                
                if filters.get("project_id"):
                    filter_queries.append(Terms(project_id=[filters["project_id"]]))
                
                if filters.get("session_id"):
                    filter_queries.append(Terms(session_id=[filters["session_id"]]))
                
                if filters.get("type"):
                    filter_queries.append(Terms(type=filters["type"]))
                
                if filters.get("status"):
                    filter_queries.append(Terms(status=filters["status"]))
                
                if filters.get("creator"):
                    filter_queries.append(Terms(creator=[filters["creator"]]))
                
                if filters.get("tags"):
                    filter_queries.append(Terms(tags=filters["tags"]))
                
                if filters.get("date_range"):
                    date_range = filters["date_range"]
                    if date_range.get("start") or date_range.get("end"):
                        range_query = Range(created_at={})
                        if date_range.get("start"):
                            range_query.created_at["gte"] = date_range["start"]
                        if date_range.get("end"):
                            range_query.created_at["lte"] = date_range["end"]
                        filter_queries.append(range_query)
                
                if filter_queries:
                    s = s.filter(Bool(must=filter_queries))
            
            # Apply sorting
            if sort_by == "created_at":
                s = s.sort("-created_at")
            elif sort_by == "updated_at":
                s = s.sort("-updated_at")
            elif sort_by == "title":
                s = s.sort("title.keyword")
            elif sort_by == "relevance":
                # Default relevance sorting
                pass
            
            # Apply pagination
            s = s[(page - 1) * size:page * size]
            
            # Add highlighting
            if highlight and query.strip():
                s = s.highlight_options(
                    pre_tag="<mark>",
                    post_tag="</mark>",
                    number_of_fragments=3,
                    fragment_size=150
                )
                s = s.highlight("content", "title")
            
            # Execute search
            response = s.execute()
            
            # Process results
            hits = []
            for hit in response:
                result = {
                    "artifact_id": hit.artifact_id,
                    "session_id": hit.session_id,
                    "project_id": hit.project_id,
                    "title": hit.title,
                    "type": hit.type,
                    "status": hit.status,
                    "creator": hit.creator,
                    "created_at": hit.created_at,
                    "score": hit.meta.score
                }
                
                # Add highlights if available
                if hasattr(hit.meta, 'highlight'):
                    result["highlights"] = {
                        "content": hit.meta.highlight.content if hasattr(hit.meta.highlight, 'content') else [],
                        "title": hit.meta.highlight.title if hasattr(hit.meta.highlight, 'title') else []
                    }
                
                hits.append(result)
            
            return {
                "hits": hits,
                "total": response.hits.total.value,
                "page": page,
                "size": size,
                "query": query,
                "filters": filters
            }
            
        except Exception as e:
            logger.error(f"Error searching artifacts: {str(e)}")
            return {"hits": [], "total": 0, "page": page, "size": size, "error": str(e)}
    
    def search_suggestions(self, query: str, size: int = 5) -> List[str]:
        """Get search suggestions based on query"""
        if not self.es or not query.strip():
            return []
        
        try:
            s = Search(using=self.es, index=self.index_name)
            s = s.suggest('suggestions', query, {
                'completion': {
                    'field': 'title',
                    'size': size,
                    'skip_duplicates': True
                }
            })
            
            response = s.execute()
            suggestions = []
            
            if hasattr(response, 'suggest') and 'suggestions' in response.suggest:
                for suggestion in response.suggest.suggestions[0].options:
                    suggestions.append(suggestion.text)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting search suggestions: {str(e)}")
            return []
    
    def delete_artifact(self, artifact_id: str) -> bool:
        """Delete artifact from search index"""
        if not self.es:
            return False
        
        try:
            self.es.delete(index=self.index_name, id=artifact_id)
            return True
        except Exception as e:
            logger.error(f"Error deleting artifact from search index: {str(e)}")
            return False
    
    def reindex_all(self) -> Dict[str, Any]:
        """Reindex all artifacts from MongoDB"""
        if not self.es:
            return {"status": "error", "message": "Elasticsearch not available"}
        
        try:
            # Get all artifacts from MongoDB
            artifacts = self.mongodb_client.db.artifacts.find()
            
            indexed_count = 0
            error_count = 0
            
            for artifact in artifacts:
                if self.index_artifact(artifact):
                    indexed_count += 1
                else:
                    error_count += 1
            
            return {
                "status": "success",
                "indexed_count": indexed_count,
                "error_count": error_count,
                "total_count": indexed_count + error_count
            }
            
        except Exception as e:
            logger.error(f"Error reindexing artifacts: {str(e)}")
            return {"status": "error", "message": str(e)} 