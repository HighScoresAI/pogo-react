#!/usr/bin/env python3
"""
Startup script for Celery workers
"""

import os
import sys
from celery_app import celery_app

if __name__ == '__main__':
    # Set environment variables if not already set
    if not os.getenv('REDIS_URL'):
        os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
    
    # Start Celery worker
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=4',  # Number of worker processes
        '--queues=default,audio,image,session,export',  # All queues
        '--hostname=worker@%h'  # Worker hostname
    ]) 