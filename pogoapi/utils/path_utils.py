import os
from typing import Optional, Tuple, List
from werkzeug.exceptions import BadRequest
from pogoapi.utils.mongodb_client import MongoDBClient

# Get the absolute path to the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Get the parent directory of the project root
PARENT_DIR = os.path.dirname(PROJECT_ROOT)
# Define the base upload folder as an absolute path at the same level as project root
BASE_UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "hellopogo")

class PathBuilder:
    """
    Utility class for building and managing file paths.
    """
    
    def __init__(self, db_client: MongoDBClient, root_folder: str = BASE_UPLOAD_FOLDER):
        """
        Initialize with MongoDB client and path settings.
        
        Args:
            db_client: MongoDB client instance
            root_folder: Root folder path
            sessions_dir: Sessions directory name
        """
        self.db_client = db_client
        self.root_folder = root_folder
        self.sessions_path = os.path.join(root_folder)
        print(f"Root folder: {self.root_folder}")
        
    def get_relative_path(self, file_path: str) -> str:
        """
        Get relative path from root folder.
        
        Args:
            file_path: Absolute file path
            
        Returns:
            str: Relative path
            
        Raises:
            BadRequest: If path is not under root folder
        """
        try:
            return os.path.relpath(file_path, self.root_folder)
        except ValueError:
            raise BadRequest("File path is not under root folder")
            
    def build_session_path(self, artifact_url: str) -> str:
        """
        Build path for a session directory.
        
        Args:
            session_id: Session ID
            
        Returns:
            str: Session directory path
        """
        file_url = os.path.join(*artifact_url.split("/"))
        return os.path.join(self.sessions_path, file_url)
        
    def get_session_id_from_path(self, file_path: str) -> Optional[str]:
        """
        Extract session ID from a file path.
        
        Args:
            file_path: File path
            
        Returns:
            Optional[str]: Session ID if found, None otherwise
        """
        try:
            # Get relative path from sessions directory
            rel_path = os.path.relpath(file_path, self.sessions_path)
            # First component should be session ID
            session_id = rel_path.split(os.sep)[0]
            return session_id if session_id else None
        except:
            return None
            
    def ensure_directory(self, dir_path: str) -> Tuple[bool, Optional[str]]:
        """
        Ensure a directory exists, create if it doesn't.
        
        Args:
            dir_path: Directory path
            
        Returns:
            Tuple[bool, Optional[str]]: (Success, Error message if any)
        """
        try:
            os.makedirs(dir_path, exist_ok=True)
            return True, None
        except Exception as e:
            return False, str(e)
            
    def ensure_session_directory(self, session_id: str) -> Tuple[bool, Optional[str]]:
        """
        Ensure session directory exists.
        
        Args:
            session_id: Session ID
            
        Returns:
            Tuple[bool, Optional[str]]: (Success, Error message if any)
        """
        session_path = self.build_session_path(session_id)
        return self.ensure_directory(session_path)
        
    def get_session_files(self, session_id: str) -> List[str]:
        """
        Get list of files in a session directory.
        
        Args:
            session_id: Session ID
            
        Returns:
            List[str]: List of file paths
            
        Raises:
            BadRequest: If session directory doesn't exist
        """
        session_path = self.build_session_path(session_id)
        exists, error = self.file_exists(session_path)
        if not exists:
            raise BadRequest(f"Session directory not found: {error}")
            
        try:
            return [
                os.path.join(session_path, f)
                for f in os.listdir(session_path)
                if os.path.isfile(os.path.join(session_path, f))
            ]
        except Exception as e:
            raise BadRequest(f"Failed to list session files: {str(e)}")
            
    def file_exists(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """
        Check if a file exists.
        
        Args:
            file_path: File path to check
            
        Returns:
            Tuple[bool, Optional[str]]: (Exists, Error message if any)
        """
        try:
            return os.path.exists(file_path), None
        except Exception as e:
            return False, str(e)
            
    def clean_path(self, path: str) -> str:
        """
        Clean a path by removing redundant separators and resolving relative paths.
        
        Args:
            path: Path to clean
            
        Returns:
            str: Cleaned path
        """
        return os.path.normpath(path)
        
    def get_file_extension(self, file_path: str) -> str:
        """
        Get file extension in lowercase.
        
        Args:
            file_path: File path
            
        Returns:
            str: File extension
        """
        return os.path.splitext(file_path)[1].lower()
        
    def is_safe_path(self, path: str) -> bool:
        """
        Check if a path is safe (doesn't contain directory traversal).
        
        Args:
            path: Path to check
            
        Returns:
            bool: True if safe, False otherwise
        """
        try:
            # Get absolute paths
            abs_path = os.path.abspath(path)
            abs_root = os.path.abspath(self.root_folder)
            
            # Check if path is under root
            return abs_path.startswith(abs_root)
        except:
            return False 