"""
Integration tests for MongoDB client functionality.
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.config import config

TEST_USER_ID = config.get_test_ids()['user_id']
TEST_PROJECT_ID = config.get_test_ids()['project_id']
TEST_SESSION_ID = config.get_test_ids()['session_id']

class TestMongoDBClient(pytest.TestCase):
    """Integration test cases for MongoDB client operations."""
    
    def setUp(self):
        """Set up test environment with database connection."""
        self.client = get_mongodb_client()
        self.path_builder = PathBuilder(self.client)
        
        # Print sample artifacts for debugging
        print("\nSample artifacts in database:")
        sample_artifacts = list(self.client.db.artifacts.find().limit(5))
        for artifact in sample_artifacts:
            print(f"Artifact: {artifact}")
            print(f"Session ID type: {type(artifact.get('sessionId'))}")
            print(f"Session ID value: {artifact.get('sessionId')}")
            print("---")
        
    def test_get_session_artifacts(self):
        """Test retrieving artifacts for a session."""
        # Get artifacts for test session
        artifacts = self.client.get_session_artifacts(TEST_SESSION_ID)
        
        # Assertions
        self.assertEqual(len(artifacts), 6)  # 5 images + 1 audio file
        
        # Count artifacts by type
        image_count = sum(1 for artifact in artifacts if artifact["captureType"] == "image")
        audio_count = sum(1 for artifact in artifacts if artifact["captureType"] == "audio")
        
        self.assertEqual(image_count, 5)
        self.assertEqual(audio_count, 1)
        
    def test_get_session_artifacts_empty(self):
        """Test retrieving artifacts for a non-existent session."""
        # Use a non-existent session ID
        non_existent_session = str(ObjectId())
        artifacts = self.client.get_session_artifacts(non_existent_session)
        
        # Assertions
        self.assertEqual(len(artifacts), 0)
        
    def test_get_session_artifacts_error(self):
        """Test error handling when retrieving artifacts."""
        # Test with invalid session ID format
        with self.assertRaises(Exception):
            self.client.get_session_artifacts("invalid_session_id")
            
    def test_artifact_files_exist(self):
        """Test that all artifact files exist in their expected locations."""
        # Get artifacts for test session
        artifacts = self.client.get_session_artifacts(TEST_SESSION_ID)
        self.assertTrue(len(artifacts) > 0, "No artifacts found for testing")
        
        # Check each artifact file
        for artifact in artifacts:
            # Build the full file path using PathBuilder
            file_path = self.path_builder.build_artifact_path(artifact["url"])
            
            print(f"\nChecking file: {file_path}")
            print(f"File exists: {os.path.exists(file_path)}")
            if os.path.exists(file_path):
                print(f"File size: {os.path.getsize(file_path)} bytes")
            
            # Check file existence
            exists, error_msg = self.path_builder.file_exists(file_path)
            self.assertTrue(exists, error_msg)
            
            # Additional checks based on capture type
            if artifact["captureType"] == "image":
                self.assertTrue(
                    file_path.lower().endswith(('.png', '.jpg', '.jpeg')),
                    f"Invalid image file extension: {file_path}"
                )
            elif artifact["captureType"] == "audio":
                self.assertTrue(
                    file_path.lower().endswith(('.wav', '.mp3')),
                    f"Invalid audio file extension: {file_path}"
                )

if __name__ == '__main__':
    unittest.main() 