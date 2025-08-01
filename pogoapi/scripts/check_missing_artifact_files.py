import os
from pogoapi.utils.mongodb_client import get_mongodb_client

def main():
    db = get_mongodb_client().db
    sessions = db.testCollection.find({})
    missing_files = []
    for session in sessions:
        session_id = session.get('_id')
        artifacts = session.get('artifacts', [])
        for artifact in artifacts:
            url = artifact.get('url')
            if not url:
                print(f"Session {session_id}: Artifact {artifact.get('_id')} has no url.")
                continue
            # Remove leading slash and split
            url_parts = url.lstrip('/').split('/')
            # Assume storage is in project_root/storage
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            file_path = os.path.join(project_root, *url_parts)
            if not os.path.exists(file_path):
                missing_files.append((session_id, artifact.get('_id'), file_path))
    if missing_files:
        print("Missing artifact files:")
        for session_id, artifact_id, file_path in missing_files:
            print(f"Session {session_id}, Artifact {artifact_id}: {file_path}")
    else:
        print("All artifact files found.")

if __name__ == "__main__":
    main() 