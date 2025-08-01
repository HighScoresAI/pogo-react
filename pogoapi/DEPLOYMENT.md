# PogoAPI Deployment Guide

This guide covers different deployment options for the PogoAPI backend.

## 🚀 Quick Start

### Option 1: Local Development Setup
```bash
# 1. Run the setup script
python setup_backend.py

# 2. Start the application
python main.py
```

### Option 2: Docker Compose (Recommended)
```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps
```

## 📋 Prerequisites

### For Local Development
- Python 3.8+
- MongoDB
- Redis
- Node.js (for development tools)

### For Docker Deployment
- Docker
- Docker Compose

### For Production
- Linux server (Ubuntu 20.04+ recommended)
- Nginx
- SSL certificate
- Domain name

## 🔧 Environment Configuration

### Required Environment Variables
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db

# JWT
JWT_SECRET_KEY=your-secret-key

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Optional: API Keys
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional: Vector Store
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-key

# Optional: Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

## 🐳 Docker Deployment

### Development with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f pogoapi

# Stop services
docker-compose down
```

### Production Docker Setup
```bash
# Build production image
docker build -t pogoapi:latest .

# Run with production settings
docker run -d \
  --name pogoapi \
  -p 5000:5000 \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  pogoapi:latest
```

## 🌐 Production Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-pip python3-venv nginx redis-server

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Application Setup
```bash
# Clone repository
git clone <your-repo-url>
cd pogoapi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
python setup_backend.py

# Create systemd service
sudo nano /etc/systemd/system/pogoapi.service
```

### 3. Systemd Service Configuration
```ini
[Unit]
Description=PogoAPI Backend
After=network.target mongod.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/path/to/pogoapi
Environment=PATH=/path/to/pogoapi/venv/bin
ExecStart=/path/to/pogoapi/venv/bin/gunicorn -c gunicorn.conf.py main:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /path/to/pogoapi/static/;
    }
    
    location /media/ {
        alias /path/to/pogoapi/storage/;
    }
}
```

### 5. SSL Setup with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔄 Background Tasks

### Celery Worker Setup
```bash
# Start Celery worker
python start_celery.py

# Or with systemd
sudo nano /etc/systemd/system/pogoapi-celery.service
```

```ini
[Unit]
Description=PogoAPI Celery Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/path/to/pogoapi
Environment=PATH=/path/to/pogoapi/venv/bin
ExecStart=/path/to/pogoapi/venv/bin/python start_celery.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Flower Monitoring
```bash
# Start Flower
python start_flower.py

# Access at: http://your-domain.com:5555
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Manual health check
python health_check.py

# API health endpoint
curl http://localhost:5000/health
```

### Log Management
```bash
# View application logs
tail -f logs/api_requests.log
tail -f logs/api_errors.log

# View system logs
sudo journalctl -u pogoapi -f
```

### Performance Monitoring
```bash
# Monitor system resources
htop
iotop
nethogs

# Monitor application
curl http://localhost:5000/health | jq
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Rotate API keys regularly

### 2. Database Security
```bash
# MongoDB authentication
use admin
db.createUser({
  user: "admin",
  pwd: "secure-password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})
```

### 3. Firewall Configuration
```bash
# UFW firewall setup
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 4. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Python packages
pip install --upgrade -r requirements.txt
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check MongoDB logs
   sudo journalctl -u mongod -f
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test Redis connection
   redis-cli ping
   ```

3. **Application Won't Start**
   ```bash
   # Check logs
   tail -f logs/api_errors.log
   
   # Check environment
   python -c "from config import config; print(config.get_mongodb_url())"
   ```

4. **Celery Tasks Not Processing**
   ```bash
   # Check Celery worker
   celery -A celery_app inspect active
   
   # Restart Celery
   sudo systemctl restart pogoapi-celery
   ```

### Performance Optimization

1. **Database Indexing**
   ```javascript
   // MongoDB indexes
   db.users.createIndex({"email": 1})
   db.projects.createIndex({"user_id": 1})
   db.artifacts.createIndex({"session_id": 1})
   ```

2. **Caching**
   ```python
   # Redis caching
   import redis
   r = redis.Redis()
   r.setex("key", 3600, "value")  # Cache for 1 hour
   ```

3. **Load Balancing**
   ```nginx
   # Nginx load balancer
   upstream pogoapi {
       server 127.0.0.1:5000;
       server 127.0.0.1:5001;
       server 127.0.0.1:5002;
   }
   ```

## 📈 Scaling

### Horizontal Scaling
1. Deploy multiple application instances
2. Use load balancer (Nginx/HAProxy)
3. Implement session sharing (Redis)
4. Use database clustering

### Vertical Scaling
1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static files

## 🔄 Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --db pogo_db --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db pogo_db /backup/20231201/pogo_db/
```

### File Backup
```bash
# Backup storage directory
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf /backup/storage_$DATE.tar.gz /path/to/pogoapi/storage/
find /backup -name "storage_*.tar.gz" -mtime +7 -delete
```

## 📞 Support

For deployment issues:
1. Check the logs: `tail -f logs/api_errors.log`
2. Run health check: `python health_check.py`
3. Review this documentation
4. Check GitHub issues
5. Contact the development team 