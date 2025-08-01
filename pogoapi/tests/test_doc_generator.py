"""
Test script for document generation from processed artifacts.
Focuses on reading artifact_updates and creating professional Word documents.
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch
from datetime import datetime
from bson import ObjectId
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.document_exporter import DocumentExporter
from pogoapi.config import config

TEST_USER_ID = config.get_test_ids()['user_id']
TEST_PROJECT_ID = config.get_test_ids()['project_id']
TEST_SESSION_ID = config.get_test_ids()['session_id']

class TestDocGenerator(unittest.TestCase):
    """Test cases for document generation from processed artifacts"""
    
    def setUp(self):
        """Set up test environment"""
        self.db_client = get_mongodb_client()
        self.path_builder = PathBuilder(self.db_client)
        self.exporter = DocumentExporter(self.db_client, self.path_builder)
        
        # Print database info for debugging
        print("\nDatabase collections:")
        print(self.db_client.db.list_collection_names())
        
    def test_get_processed_artifacts(self):
        """Test retrieving processed artifacts for a session"""
        # Test session ID
        session_id = TEST_SESSION_ID
        print(f"\nTesting with session ID: {session_id}")
        
        # First get all artifacts for this session
        artifacts = list(self.db_client.db.artifacts.find({"sessionId": ObjectId(session_id)}))
        print(f"\nFound {len(artifacts)} total artifacts in session")
        for artifact in artifacts:
            print(f"Artifact ID: {artifact['_id']}, Type: {artifact.get('captureType')}")
        
        # Get all updates for this session
        all_updates = list(self.db_client.db.artifact_updates.find({"sessionId": ObjectId(session_id)}))
        print(f"\nFound {len(all_updates)} total updates in session")
        for update in all_updates:
            print(f"Update for artifact {update['artifactId']}:")
            print(f"Status: {update.get('status')}")
            print(f"Type: {update.get('update_type')}")
            print(f"Created at: {update.get('createdAt')}")
        
        # Get all processed image analyses for the session
        processed_updates = list(self.db_client.db.artifact_updates.find({
            "sessionId": ObjectId(session_id),
            "status": "processed",
            "update_type": "image_analysis"
        }))
        
        print(f"\nFound {len(processed_updates)} processed image analysis updates")
        for update in processed_updates:
            print(f"\nProcessed update for artifact {update['artifactId']}:")
            print(f"Status: {update['status']}")
            print(f"Type: {update['update_type']}")
            print(f"Created at: {update['createdAt']}")
            print(f"Content length: {len(update.get('content', ''))}")
        
        # Group updates by artifactId and get the latest for each
        latest_updates = {}
        for update in processed_updates:
            artifact_id = str(update["artifactId"])
            if artifact_id not in latest_updates or \
               update["createdAt"] > latest_updates[artifact_id]["createdAt"]:
                latest_updates[artifact_id] = update
                
        print(f"\nFound {len(latest_updates)} unique artifacts with latest updates")
        for artifact_id, update in latest_updates.items():
            print(f"\nLatest update for artifact {artifact_id}:")
            print(f"Created at: {update['createdAt']}")
            print(f"Content length: {len(update.get('content', ''))}")
        
        # Verify we have processed artifacts
        self.assertGreater(len(latest_updates), 0)
        
        # Verify each update has the required fields
        for update in latest_updates.values():
            self.assertEqual(update["status"], "processed")
            self.assertEqual(update["update_type"], "image_analysis")
            self.assertIn("content", update)
            self.assertIn("createdAt", update)
            
    def test_export_document(self):
        """Test exporting processed artifacts to a Word document"""
        # Test session ID
        session_id = TEST_SESSION_ID
        print(f"\nTesting export for session: {session_id}")
        
        # Export the document
        doc_path = self.exporter.export_session_document(session_id)
        
        # Verify the document was created
        self.assertIsNotNone(doc_path)
        print(f"\nDocument path: {doc_path}")
        print(f"File exists: {os.path.exists(doc_path)}")
        if os.path.exists(doc_path):
            print(f"File size: {os.path.getsize(doc_path)} bytes")
        
        self.assertTrue(os.path.exists(doc_path))
        
        # Print document path
        print(f"\nDocument exported to: {doc_path}")
        
        # Verify document content
        with open(doc_path, 'rb') as f:
            content = f.read()
            self.assertGreater(len(content), 0)
            print(f"Document size: {len(content)} bytes")
            
        # Don't clean up - leave the document for inspection
        print("\nDocument left in place for inspection")
        
    def test_document_structure(self):
        """Test the structure and formatting of the generated document"""
        # Test session ID
        session_id = TEST_SESSION_ID
        
        # Export the document
        doc_path = self.exporter.export_session_document(session_id)
        
        # Verify document structure
        self.assertIsNotNone(doc_path)
        self.assertTrue(os.path.exists(doc_path))
        
        # Print document path
        print(f"\nDocument exported to: {doc_path}")
        
        # Verify document content
        with open(doc_path, 'rb') as f:
            content = f.read()
            self.assertGreater(len(content), 0)
            print(f"Document size: {len(content)} bytes")
            
        # Clean up
        os.remove(doc_path)
        
if __name__ == '__main__':
    unittest.main() 