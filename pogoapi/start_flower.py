#!/usr/bin/env python3
"""
Startup script for Flower (Celery monitoring)
"""

import os
import sys
from celery_app import celery_app

if __name__ == '__main__':
    # Set environment variables if not already set
    if not os.getenv('REDIS_URL'):
        os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
    
    # Start Flower
    celery_app.start([
        'flower',
        '--port=5555',
        '--broker=redis://localhost:6379/0',
        '--result-backend=redis://localhost:6379/0',
        '--logging=info'
    ]) 