"""
Celery configuration for background task processing
"""

import os
from celery import Celery
from pogoapi.config import config

# Create Celery instance
celery_app = Celery(
    'pogoapi',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    include=['pogoapi.tasks.processing_tasks', 'pogoapi.tasks.export_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
    result_expires=3600,  # 1 hour
    task_routes={
        'tasks.processing_tasks.process_audio': {'queue': 'audio'},
        'tasks.processing_tasks.process_image': {'queue': 'image'},
        'tasks.processing_tasks.process_session': {'queue': 'session'},
        'tasks.export_tasks.export_document': {'queue': 'export'},
    },
    task_default_queue='default',
    task_default_exchange='default',
    task_default_routing_key='default',
)

# Priority levels
PRIORITY_LEVELS = {
    'high': 0,      # Manual single-artifact processing
    'medium': 1,    # Session batch processing  
    'low': 2,       # Background automated processing
}

# Concurrent processing limits
PROCESSING_LIMITS = {
    'free_tier': 2,    # 2 artifacts at once
    'pro_tier': 10,    # 10 artifacts at once
}

if __name__ == '__main__':
    celery_app.start() 