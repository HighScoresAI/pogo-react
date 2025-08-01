# PogoAPI Backend

A comprehensive Flask-based backend API for the Pogo application, featuring authentication, artifact processing, and real-time communication.

## 🚀 Features

- **Authentication**: Firebase and traditional JWT-based authentication
- **Artifact Processing**: Audio, image, and document processing with AI
- **Real-time Communication**: WebSocket support for live updates
- **Search & Vectorization**: Advanced search with vector embeddings
- **Background Processing**: Celery-based task queue
- **File Storage**: Organized file management system
- **API Documentation**: Auto-generated API docs

## 📋 Prerequisites

- Python 3.8+
- MongoDB
- Redis (for Celery)
- Node.js (for development tools)

## 🛠️ Installation

### 1. Clone and Setup
```bash
cd pogoapi
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
python setup_env.py
```

### 3. Database Setup
```bash
# Start MongoDB
mongod

# Start Redis (for Celery)
redis-server
```

### 4. Run the Application
```bash
# Development
python main.py

# Production
gunicorn -c gunicorn.conf.py main:app
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db

# JWT
JWT_SECRET_KEY=your-secret-key

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json

# API Keys
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key

# Vector Store
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-key
```

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication
3. Download service account JSON
4. Save as `firebase-service-account.json`

## 📚 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/firebase` - Firebase authentication
- `GET /auth/verify` - Token verification

### Projects & Sessions
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /sessions` - List sessions
- `POST /sessions` - Create session

### Artifacts
- `POST /artifacts` - Upload artifact
- `GET /artifacts` - List artifacts
- `GET /artifacts/<id>` - Get artifact details

### Search
- `GET /search` - Search artifacts
- `POST /search/vector` - Vector search

## 🧪 Testing

```bash
# Test basic setup
python test_firebase_setup.py

# Run tests
python -m pytest tests/
```

## 📦 Project Structure

```
pogoapi/
├── main.py                 # Flask application entry point
├── config.py              # Configuration management
├── config.yaml            # Configuration file
├── requirements.txt       # Python dependencies
├── routes/               # API route handlers
├── services/             # Business logic services
├── models/               # Data models
├── utils/                # Utility functions
├── tasks/                # Celery background tasks
├── tests/                # Test files
└── storage/              # File storage
```

## 🔄 Background Tasks

Start Celery worker:
```bash
python start_celery.py
```

Start Flower (task monitoring):
```bash
python start_flower.py
```

## 📖 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Firebase Setup](FIREBASE_SETUP.md)
- [Email Setup](EMAIL_SETUP.md)
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.



