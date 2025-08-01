# Implementation Guide

This document outlines the newly implemented features in the Pogo API.

## 1. Background Processing Queue

### Overview
The system now uses Celery with Redis for background task processing, providing:
- Priority-based processing (high, medium, low)
- Automatic retry with exponential backoff
- Concurrent processing limits
- Real-time task monitoring

### Components

#### Celery Configuration (`celery_app.py`)
- Configures Celery with Redis as broker
- Defines task routes for different processing types
- Sets up priority levels and processing limits

#### Processing Tasks (`tasks/processing_tasks.py`)
- `process_audio()`: Background audio transcription
- `process_image()`: Background image analysis
- `process_session()`: Complete session processing
- `cleanup_failed_tasks()`: Maintenance task

#### Export Tasks (`tasks/export_tasks.py`)
- `export_document()`: Session document export
- `export_project_summary()`: Project summary export
- `cleanup_old_exports()`: Export file cleanup

### Usage

#### Starting Services
```bash
# Start Redis (required for Celery)
redis-server

# Start Celery worker
python start_celery.py

# Start Flower monitoring (optional)
python start_flower.py
```

#### API Endpoints
```bash
# Process artifact with priority
POST /artifacts/{artifact_id}/process
{
  "priority": "high"  # high, medium, low
}

# Check task status
GET /artifacts/{artifact_id}/task-status

# Retry failed processing
POST /artifacts/{artifact_id}/retry
```

### Configuration
```yaml
# Background Processing
REDIS_URL: "redis://localhost:6379/0"
CELERY_WORKER_CONCURRENCY: 4
CELERY_TASK_TIMEOUT: 1800  # 30 minutes
CELERY_RETRY_ATTEMPTS: 3
CELERY_RETRY_DELAY: 60
```

## 2. Enhanced Search with Elasticsearch

### Overview
Elasticsearch integration provides:
- Full-text search with fuzzy matching
- Search highlighting
- Advanced filtering and sorting
- Global search across all content types

### Components

#### Search Service (`services/search_service.py`)
- Elasticsearch client management
- Index creation and management
- Advanced search queries
- Search suggestions

#### Search Routes (`routes/search_routes.py`)
- `/search/artifacts`: Artifact search with filters
- `/search/suggestions`: Search suggestions
- `/search/global`: Global search across all content
- `/search/reindex`: Reindex all artifacts
- `/search/stats`: Search statistics

### Usage

#### Search Artifacts
```bash
GET /search/artifacts?q=query&project_id=123&type=audio&fuzzy=true&highlight=true
```

#### Global Search
```bash
GET /search/global?q=query&page=1&size=20
```

#### Search Suggestions
```bash
GET /search/suggestions?q=partial&size=5
```

### Configuration
```yaml
# Search Configuration
ELASTICSEARCH_URL: "http://localhost:9200"
ELASTICSEARCH_USERNAME: ""
ELASTICSEARCH_PASSWORD: ""
SEARCH_INDEX_NAME: "pogo_artifacts"
SEARCH_MAX_RESULTS: 100
```

## 3. Error Monitoring and Handling

### Overview
Comprehensive error monitoring system providing:
- Client-side error capture
- Error categorization and templates
- Recovery suggestions
- Error statistics and monitoring

### Components

#### Error Monitor (`utils/error_monitor.py`)
- Error capture and logging
- Error message templates
- Recovery suggestions
- Error statistics

#### Error Routes (`routes/error_routes.py`)
- `/errors/capture`: Capture client-side errors
- `/errors/retry/{error_id}`: Retry failed operations
- `/errors/user/{user_id}`: Get user errors
- `/errors/statistics`: Error statistics
- `/errors/templates`: Error message templates
- `/errors/suggestions/{error_type}`: Recovery suggestions

### Usage

#### Capture Error
```bash
POST /errors/capture
{
  "error_type": "processing_error",
  "error_message": "File processing failed",
  "user_id": "user123",
  "session_id": "session456",
  "stack_trace": "...",
  "severity": "medium",
  "context": {
    "artifact_id": "artifact789",
    "file_size": 1024000
  }
}
```

#### Retry Operation
```bash
POST /errors/retry/{error_id}
{
  "operation_type": "artifact_processing",
  "operation_data": {
    "artifact_id": "artifact789"
  }
}
```

## 4. File Validation

### Overview
Enhanced file upload validation including:
- File size limits (500MB audio, 50MB images)
- Duration limits (3 hours for audio)
- Supported format validation
- Detailed error messages

### Supported Formats

#### Audio
- Formats: MP3, WAV, M4A, FLAC
- Max size: 500MB
- Max duration: 3 hours

#### Images
- Formats: JPG, JPEG, PNG, GIF, WEBP
- Max size: 50MB

### Error Messages
The system provides specific error messages for:
- File size exceeded
- Duration exceeded
- Unsupported format
- Processing failures

## 5. API Endpoints Summary

### Background Processing
- `POST /artifacts/{id}/process` - Queue artifact processing
- `GET /artifacts/{id}/task-status` - Check processing status
- `POST /artifacts/{id}/retry` - Retry failed processing

### Search
- `GET /search/artifacts` - Search artifacts with filters
- `GET /search/global` - Global search
- `GET /search/suggestions` - Search suggestions
- `POST /search/reindex` - Reindex all content
- `GET /search/stats` - Search statistics

### Error Monitoring
- `POST /errors/capture` - Capture client error
- `POST /errors/retry/{id}` - Retry failed operation
- `GET /errors/user/{id}` - Get user errors
- `GET /errors/statistics` - Error statistics
- `GET /errors/templates` - Error templates
- `GET /errors/suggestions/{type}` - Recovery suggestions

## 6. Deployment

### Prerequisites
- Redis server
- Elasticsearch server (optional, falls back to basic search)
- Python 3.8+

### Environment Variables
```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=your_username
ELASTICSEARCH_PASSWORD=your_password

# Processing
CELERY_WORKER_CONCURRENCY=4
CELERY_TASK_TIMEOUT=1800
```

### Startup Commands
```bash
# Start Redis
redis-server

# Start Celery worker
python start_celery.py

# Start Flower monitoring (optional)
python start_flower.py

# Start main API
python main.py
```

## 7. Monitoring

### Flower Dashboard
Access Flower at `http://localhost:5555` to monitor:
- Active tasks
- Task history
- Worker status
- Queue statistics

### Error Monitoring
Monitor errors through:
- `/errors/statistics` endpoint
- MongoDB `error_logs` collection
- Application logs

### Search Monitoring
Monitor search through:
- `/search/stats` endpoint
- Elasticsearch indices
- Search performance metrics

## 8. Troubleshooting

### Common Issues

#### Celery Worker Not Starting
- Check Redis connection
- Verify Redis URL in configuration
- Check worker concurrency settings

#### Elasticsearch Connection Issues
- Verify Elasticsearch is running
- Check connection URL and credentials
- System falls back to basic search if unavailable

#### File Upload Errors
- Check file size limits
- Verify supported formats
- Check storage space

#### Processing Failures
- Check task logs in Flower
- Verify API keys for external services
- Check file accessibility

### Logs
- Application logs: `api_requests.log`
- Error logs: `api_errors.log`
- Celery logs: Console output
- Elasticsearch logs: Elasticsearch server logs 