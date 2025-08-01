import multiprocessing
import os

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class
worker_class = 'sync'

# Timeout settings
timeout = 300  # Increased from 120 to 300 seconds
graceful_timeout = 300
keepalive = 65  # Increased from 5 to 65 seconds

# Worker settings
max_requests = 1000
max_requests_jitter = 50
worker_connections = 1000
worker_tmp_dir = '/dev/shm'  # Use RAM for temporary files

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'pogoapi'

# SSL (if needed)
# keyfile = 'path/to/keyfile'
# certfile = 'path/to/certfile'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Server hooks
def on_starting(server):
    """
    Log when the server starts
    """
    server.log.info("Starting Gunicorn server")

def on_exit(server):
    """
    Log when the server exits
    """
    server.log.info("Stopping Gunicorn server")

# Worker lifecycle
def worker_int(worker):
    """
    Log when a worker receives SIGINT or SIGQUIT
    """
    worker.log.info("Worker received SIGINT or SIGQUIT")

def worker_abort(worker):
    """
    Log when a worker receives SIGABRT
    """
    worker.log.info("Worker received SIGABRT") 