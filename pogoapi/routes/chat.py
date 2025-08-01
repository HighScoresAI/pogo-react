"""
Chat endpoints for the API.
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest, NotFound
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging
import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from openai import OpenAI
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.llm_processor_utils import LLMProcessorUtils
from pogoapi.utils.global_services import get_llm_processor
from pydantic import BaseModel

# Configure logger
logger = logging.getLogger(__name__)

bp = Blueprint('chat', __name__)

# Initialize MongoDB client
mongodb_client = get_mongodb_client()

class MessageRequest(BaseModel):
    message: str
    userId: str
    sessionId: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    sessionId: str

@bp.route('/<project_id>/message', methods=['POST'])
def send_message(project_id):
    """
    Send a message and get a response
    """
    try:
        request_data = request.get_json()
        message_request = MessageRequest(**request_data)
        
        # Validate project_id format
        try:
            project_object_id = ObjectId(project_id)
        except Exception:
            return jsonify({"error": f"Invalid project ID format: {project_id}"}), 400
        
        # Get project details
        project = mongodb_client.db.testCollection.find_one({"_id": project_object_id})
        if not project:
            return jsonify({"error": "Project not found"}), 404
        project_name = project.get("name", f"Project {project_id}")

        # Get or create session
        session_id = message_request.sessionId
        if not session_id:
            # Create new session
            session_data = {
                "projectId": project_id,
                "userId": message_request.userId,
                "title": "New Chat",
                "status": "active"
            }
            result = mongodb_client.db.chat_sessions.insert_one(session_data)
            session_id = str(result.inserted_id)
            logger.info(f"Created new chat session: {session_id}")
        else:
            # Verify session exists and validate format
            try:
                session_object_id = ObjectId(session_id)
                session = mongodb_client.db.chat_sessions.find_one({"_id": session_object_id})
                if not session:
                    return jsonify({"error": "Chat session not found"}), 404
            except Exception:
                return jsonify({"error": f"Invalid session ID format: {session_id}"}), 400

        # Store user message
        user_message = {
            "sessionId": ObjectId(session_id),
            "role": "user",
            "content": message_request.message,
            "timestamp": datetime.now()
        }
        mongodb_client.db.chat_messages.insert_one(user_message)

        # Get relevant context from vector store
        try:
            # Use the LLM processor's generate_response method which handles context internally
            response = get_llm_processor().generate_response(
                message=message_request.message,
                context="",  # Let the processor find relevant context
                project_id=project_id
            )
            
        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}")
            response = "I'm sorry, I couldn't find any relevant information to help with your question."

        # Store assistant message
        assistant_message = {
            "sessionId": ObjectId(session_id),
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now()
        }
        mongodb_client.db.chat_messages.insert_one(assistant_message)

        return jsonify(MessageResponse(response=response, sessionId=session_id).dict())

    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    """
    Get chat history for a session
    """
    try:
        # Validate session_id format
        try:
            session_object_id = ObjectId(session_id)
        except Exception:
            return jsonify({"error": f"Invalid session ID format: {session_id}"}), 400

        # Verify session exists
        session = mongodb_client.db.chat_sessions.find_one({"_id": session_object_id})
        if not session:
            return jsonify({"error": "Chat session not found"}), 404

        # Get messages
        messages = list(mongodb_client.db.chat_messages.find({"sessionId": session_object_id}).sort("timestamp", 1))
        
        # Convert ObjectId fields to strings for JSON serialization
        for message in messages:
            message["_id"] = str(message["_id"])
            message["sessionId"] = str(message["sessionId"])
        
        return jsonify({
            "session": {
                "_id": str(session["_id"]),
                "projectId": str(session.get("projectId", "")),
                "userId": session.get("userId", ""),
                "title": session.get("title", ""),
                "status": session.get("status", ""),
                "createdAt": session.get("createdAt", "")
            },
            "messages": messages
        })

    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/message', methods=['POST'])
def send_general_message():
    """
    Send a general message (for landing page or when no specific project context)
    """
    try:
        request_data = request.get_json()
        message_request = MessageRequest(**request_data)
        
        # Get or create session
        session_id = message_request.sessionId
        if not session_id:
            # Create new session
            session_data = {
                "projectId": "general",
                "userId": message_request.userId,
                "title": "General Chat",
                "status": "active"
            }
            result = mongodb_client.db.chat_sessions.insert_one(session_data)
            session_id = str(result.inserted_id)
            logger.info(f"Created new general chat session: {session_id}")
        else:
            # Verify session exists and validate format
            try:
                session_object_id = ObjectId(session_id)
                session = mongodb_client.db.chat_sessions.find_one({"_id": session_object_id})
                if not session:
                    return jsonify({"error": "Chat session not found"}), 404
            except Exception:
                return jsonify({"error": f"Invalid session ID format: {session_id}"}), 400

        # Store user message
        user_message = {
            "sessionId": ObjectId(session_id),
            "role": "user",
            "content": message_request.message,
            "timestamp": datetime.now()
        }
        mongodb_client.db.chat_messages.insert_one(user_message)

        # Generate response using the LLM without project-specific context
        try:
            response = get_llm_processor().generate_response(
                message=message_request.message,
                context="",
                project_id="HelloPogo Assistant"
            )
        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}")
            response = "Hello! I'm your HelloPogo assistant. I can help you with questions about our platform, features, and how to get started. What would you like to know?"

        # Store assistant message
        assistant_message = {
            "sessionId": ObjectId(session_id),
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now()
        }
        mongodb_client.db.chat_messages.insert_one(assistant_message)

        return jsonify(MessageResponse(response=response, sessionId=session_id).dict())

    except Exception as e:
        logger.error(f"Error sending general message: {str(e)}")
        return jsonify({"error": str(e)}), 500 