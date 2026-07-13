# 🌐 Google Cloud Platform Deployment Guide

**Vibe Coding Todo Manager - GCP Deployment**

This guide provides step-by-step instructions for deploying the Vibe Todo Manager on Google Cloud Platform with existing VM and databases.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup](#database-setup)
4. [VM Setup](#vm-setup)
5. [Deploy Backend](#deploy-backend)
6. [Deploy Frontend](#deploy-frontend)
7. [Configure Domain & SSL](#configure-domain--ssl)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Scaling & Optimization](#scaling--optimization)
11. [Troubleshooting](#troubleshooting)
12. [CI/CD with Cloud Build](#cicd-with-cloud-build)

---

## 📦 Prerequisites

### What You Already Have

- ✅ **GCP Project** with billing enabled
- ✅ **Compute Engine VM** (Virtual Machine)
- ✅ **Cloud SQL or MongoDB instance** (or MongoDB on VM)
- ✅ **PostgreSQL** (available but not used by this app)
- ✅ **Redis** (available, optional for future caching)

### What You Need

- [ ] **Domain name** (optional, but recommended)
- [ ] **SSH access** to your VM
- [ ] **gcloud CLI** installed locally (for management)
- [ ] **GitHub repository** (for code deployment)

### GCP Services Used

1. **Compute Engine** - VM for hosting backend & frontend
2. **Cloud SQL for MongoDB** - Managed MongoDB (or self-hosted on VM)
3. **Cloud Load Balancing** - SSL/HTTPS termination (optional)
4. **Cloud DNS** - Domain management (optional)
5. **Cloud Build** - CI/CD pipeline (optional)
6. **Cloud Logging** - Application logs
7. **Cloud Monitoring** - Uptime checks and alerts

---

## 🏗️ Architecture Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Cloud Load Balancer (Optional)              │
│                 - SSL Termination                        │
│                 - HTTPS → HTTP                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                 Compute Engine VM                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Nginx (Reverse Proxy)              │  │
│  │  - Serves frontend (static files)                │  │
│  │  - Proxies /api → Backend                        │  │
│  └──────────┬───────────────────┬───────────────────┘  │
│             │                   │                       │
│  ┌──────────┴─────────┐  ┌─────┴──────────────────┐   │
│  │   Frontend (dist/)  │  │  Backend (Node.js)     │   │
│  │   - React build     │  │  - Express API         │   │
│  │   - Static files    │  │  - Port 3001           │   │
│  └─────────────────────┘  │  - PM2 process mgr     │   │
│                           └─────┬──────────────────┘   │
└─────────────────────────────────┼────────────────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
          ┌──────────┴──────────┐   ┌─────────┴──────────┐
          │  MongoDB (Cloud SQL │   │  Redis (Optional)   │
          │   or Self-hosted)   │   │  - Future caching   │
          │  - Port 27017       │   │  - Session store    │
          └─────────────────────┘   └────────────────────┘
```

### Component Responsibilities

| Component | Purpose | Port |
|-----------|---------|------|
| **Nginx** | Reverse proxy, static file server, SSL termination | 80, 443 |
| **Backend (Node.js)** | REST API, business logic, auto-status algorithm | 3001 |
| **Frontend (React)** | Static files served by nginx | N/A |
| **MongoDB** | Primary database | 27017 |
| **Redis** | Optional: caching, sessions | 6379 |

---

## 🗄️ Database Setup

### Option 1: Cloud SQL for MongoDB (Recommended)

Google Cloud doesn't offer managed MongoDB, but you can use:
- **MongoDB Atlas** (recommended, free tier available)
- **Self-hosted MongoDB on VM** (below)

#### Using MongoDB Atlas with GCP

1. **Create MongoDB Atlas Cluster**
```bash
# Go to: https://www.mongodb.com/cloud/atlas
# Sign up / Log in
# Click "Build a Database"
# Choose "Shared" (Free tier)
# Select GCP as cloud provider
# Choose same region as your VM
```

2. **Configure Network Access**
```bash
# In Atlas dashboard:
# - Network Access → Add IP Address
# - Add your GCP VM's external IP
# - Or use "0.0.0.0/0" for testing (not recommended for production)
```

3. **Get Connection String**
```bash
# In Atlas dashboard:
# - Database → Connect → Connect your application
# - Copy connection string:
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/vibe_todo_manager?retryWrites=true&w=majority
```

4. **Test Connection from VM**
```bash
# SSH into your GCP VM
gcloud compute ssh your-vm-name --zone=your-zone

# Install MongoDB shell
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-mongosh

# Test connection
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net" --username <your-username>
```

### Option 2: Self-Hosted MongoDB on GCP VM

If you prefer to host MongoDB on your existing VM:

#### Install MongoDB on Ubuntu/Debian VM

```bash
# SSH into VM
gcloud compute ssh your-vm-name --zone=your-zone

# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Test connection
mongosh
```

#### Secure MongoDB

```bash
# Create admin user
mongosh

use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

exit

# Enable authentication
sudo nano /etc/mongod.conf

# Add these lines:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Create application user
mongosh -u admin -p --authenticationDatabase admin

use vibe_todo_manager
db.createUser({
  user: "vibe_todo_user",
  pwd: "APP_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "vibe_todo_manager" } ]
})

exit
```

#### Configure Firewall

```bash
# MongoDB should only be accessible from localhost
# Verify mongod.conf has:
sudo nano /etc/mongod.conf

# Ensure this line exists:
net:
  port: 27017
  bindIp: 127.0.0.1  # Only localhost, NOT 0.0.0.0
```

### Using PostgreSQL (Future)

Your GCP environment has PostgreSQL available. While this app uses MongoDB, you could migrate to PostgreSQL in the future:

**Pros:**
- ✅ Better for relational queries
- ✅ ACID compliance
- ✅ Strong typing
- ✅ Cloud SQL managed service available

**Cons:**
- ❌ Requires schema changes (no more dynamic collections)
- ❌ More complex queries for hierarchical data
- ❌ Significant code refactoring needed

**If you want to use PostgreSQL:** Create a GitHub issue and I'll help with migration!

### Using Redis (Optional)

Redis is available but not currently used. Future use cases:

1. **Session Storage** (instead of JWT in localStorage)
```javascript
// Future implementation
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

2. **API Caching**
```javascript
// Cache frequently accessed data
const cachedProjects = await redis.get('projects');
if (cachedProjects) {
  return JSON.parse(cachedProjects);
}
```

3. **Task Queue** (background jobs)
```javascript
// Queue auto-status updates
await queue.add('update-status', { epicId, projectName });
```

**To enable Redis in future:**
1. Install `redis` npm package
2. Update backend to use Redis client
3. Add `REDIS_URL` to environment variables

---

## 💻 VM Setup

### Check Your VM Configuration

```bash
# Get VM details
gcloud compute instances describe your-vm-name --zone=your-zone

# Recommended VM specs for small-medium usage:
# - Machine type: e2-medium (2 vCPU, 4 GB memory)
# - Boot disk: 20 GB SSD
# - OS: Ubuntu 22.04 LTS
```

### SSH into VM

```bash
# From your local machine
gcloud compute ssh your-vm-name --zone=your-zone

# Or add SSH key and use standard SSH
ssh -i ~/.ssh/your-key username@EXTERNAL_IP
```

### Update System

```bash
# Update package lists
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y git curl wget vim htop
```

### Install Node.js

```bash
# Install Node.js 18 LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Install Nginx

```bash
# Install nginx
sudo apt-get install -y nginx

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test: Visit http://YOUR_VM_EXTERNAL_IP
# You should see nginx welcome page
```

### Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Configure Firewall

```bash
# GCP firewall rules (from local machine)
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP traffic"

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTPS traffic"

# Verify rules
gcloud compute firewall-rules list
```

---

## 🚀 Deploy Backend

### 1. Clone Repository

```bash
# SSH into VM
gcloud compute ssh your-vm-name --zone=your-zone

# Create application directory
sudo mkdir -p /var/www/vibe-todo
sudo chown $USER:$USER /var/www/vibe-todo

# Clone repository
cd /var/www/vibe-todo
git clone https://github.com/your-username/claude-todo.git .

# Checkout correct branch
git checkout main
```

### 2. Install Backend Dependencies

```bash
cd /var/www/vibe-todo/backend
npm install --production
```

### 3. Configure Environment Variables

```bash
# Create production .env file
cd /var/www/vibe-todo/backend
nano .env
```

**Production .env configuration:**

```env
# MongoDB Configuration
# Option A: MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=vibe_todo_manager

# Option B: Self-hosted on VM
# MONGODB_URI=mongodb://vibe_todo_user:APP_PASSWORD_HERE@localhost:27017/vibe_todo_manager?authSource=vibe_todo_manager

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS - Set to your domain
CORS_ORIGIN=https://yourdomain.com

# Authentication
AUTH_ENABLED=true
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_EXPIRES_IN=7d
```

**Generate strong JWT secret:**
```bash
# Generate secure random string
openssl rand -hex 32
# Copy output to JWT_SECRET in .env
```

### 4. Test Backend

```bash
# Test backend starts correctly
cd /var/www/vibe-todo/backend
npm start

# You should see:
# 🚀 Vibe Todo API server running on port 3001
# 📍 API endpoint: http://localhost:3001
# 🏥 Health check: http://localhost:3001/health
# 🔐 Authentication: ENABLED

# Test health endpoint
curl http://localhost:3001/health

# Should return:
# {"success":true,"message":"Vibe Todo API is running","timestamp":"...","authEnabled":true}

# Press Ctrl+C to stop
```

### 5. Start with PM2

```bash
# Start backend with PM2
cd /var/www/vibe-todo/backend
pm2 start src/app.js --name vibe-todo-backend

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status

# View logs
pm2 logs vibe-todo-backend

# Monitor
pm2 monit
```

### 6. PM2 Configuration File (Optional)

Create `ecosystem.config.js` for advanced PM2 configuration:

```bash
cd /var/www/vibe-todo/backend
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'vibe-todo-backend',
    script: 'src/app.js',
    instances: 2,  // Run 2 instances (cluster mode)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/vibe-todo-error.log',
    out_file: '/var/log/pm2/vibe-todo-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

```bash
# Use configuration file
pm2 delete vibe-todo-backend
pm2 start ecosystem.config.js
pm2 save
```

---

## 🎨 Deploy Frontend

### 1. Build Frontend

```bash
# On VM, navigate to frontend directory
cd /var/www/vibe-todo/frontend

# Install dependencies
npm install

# Create production .env file
nano .env
```

**Frontend .env:**
```env
# API URL - use your domain or VM IP
VITE_API_URL=https://yourdomain.com/api
# Or for testing with IP:
# VITE_API_URL=http://YOUR_VM_EXTERNAL_IP/api
```

```bash
# Build for production
npm run build

# Build output will be in: frontend/dist/
```

### 2. Deploy to Nginx

```bash
# Create nginx web root
sudo mkdir -p /var/www/html/vibe-todo

# Copy build files
sudo cp -r /var/www/vibe-todo/frontend/dist/* /var/www/html/vibe-todo/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/html/vibe-todo
sudo chmod -R 755 /var/www/html/vibe-todo
```

### 3. Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/vibe-todo
```

**Nginx configuration:**

```nginx
# HTTP server (redirect to HTTPS)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Root directory for frontend
    root /var/www/html/vibe-todo;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logs
    access_log /var/log/nginx/vibe-todo-access.log;
    error_log /var/log/nginx/vibe-todo-error.log;
}
```

**For IP-based access (testing without domain):**

```nginx
server {
    listen 80;
    server_name _;  # Catch-all
    
    root /var/www/html/vibe-todo;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

### 4. Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vibe-todo /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### 5. Test Deployment

```bash
# Get your VM's external IP
gcloud compute instances describe your-vm-name --zone=your-zone --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Visit in browser:
# http://YOUR_EXTERNAL_IP

# You should see the Vibe Todo Manager!
```

---

## 🔒 Configure Domain & SSL

### 1. Point Domain to VM

**In your domain registrar (e.g., Google Domains, GoDaddy):**

```
A Record:
  Name: @ (or blank)
  Type: A
  Value: YOUR_VM_EXTERNAL_IP
  TTL: 3600

A Record:
  Name: www
  Type: A
  Value: YOUR_VM_EXTERNAL_IP
  TTL: 3600
```

**Or use Google Cloud DNS:**

```bash
# Create DNS zone
gcloud dns managed-zones create vibe-todo-zone \
  --dns-name="yourdomain.com." \
  --description="Vibe Todo DNS zone"

# Add A record
gcloud dns record-sets create yourdomain.com. \
  --zone="vibe-todo-zone" \
  --type="A" \
  --ttl="300" \
  --rrdatas="YOUR_VM_EXTERNAL_IP"

# Add www subdomain
gcloud dns record-sets create www.yourdomain.com. \
  --zone="vibe-todo-zone" \
  --type="A" \
  --ttl="300" \
  --rrdatas="YOUR_VM_EXTERNAL_IP"
```

### 2. Install SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Certbot will automatically:
# 1. Obtain SSL certificate
# 2. Update nginx configuration
# 3. Set up auto-renewal
```

### 3. Test SSL

```bash
# Visit your domain
https://yourdomain.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### 4. Auto-Renewal

```bash
# Certbot auto-renewal is configured by default
# Test renewal process
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

---

## 📊 Monitoring & Logging

### 1. Cloud Logging

**View application logs:**

```bash
# From local machine
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=YOUR_INSTANCE_ID" --limit 50 --format json

# Or use Cloud Console:
# https://console.cloud.google.com/logs
```

**Configure logging in backend:**

```bash
# Install Winston logger
cd /var/www/vibe-todo/backend
npm install winston winston-google-cloud
```

**Update backend to use Cloud Logging:**

```javascript
// backend/src/utils/logger.js
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    loggingWinston
  ]
});

export default logger;
```

### 2. Cloud Monitoring

**Set up uptime check:**

```bash
# From Cloud Console:
# 1. Go to Monitoring → Uptime checks
# 2. Click "Create Uptime Check"
# 3. Configure:
#    - Title: Vibe Todo Health Check
#    - Protocol: HTTPS
#    - Resource Type: URL
#    - Hostname: yourdomain.com
#    - Path: /health
#    - Check frequency: 5 minutes

# Or use gcloud:
gcloud monitoring uptime create vibe-todo-health \
  --display-name="Vibe Todo Health Check" \
  --resource-type="uptime-url" \
  --monitored-resource="https://yourdomain.com/health" \
  --check-interval=300s
```

**Set up alerts:**

```bash
# Create alerting policy
# From Cloud Console:
# 1. Go to Monitoring → Alerting
# 2. Click "Create Policy"
# 3. Add condition:
#    - Target: Uptime check
#    - Condition: Uptime check is failing
# 4. Configure notifications:
#    - Email, SMS, or Slack
```

### 3. PM2 Monitoring

```bash
# SSH into VM
gcloud compute ssh your-vm-name --zone=your-zone

# View real-time monitoring
pm2 monit

# View logs
pm2 logs vibe-todo-backend

# View logs for last hour
pm2 logs vibe-todo-backend --lines 100

# Clear logs
pm2 flush
```

### 4. Nginx Logs

```bash
# View access logs
sudo tail -f /var/log/nginx/vibe-todo-access.log

# View error logs
sudo tail -f /var/log/nginx/vibe-todo-error.log

# Analyze logs with GoAccess (optional)
sudo apt-get install -y goaccess
sudo goaccess /var/log/nginx/vibe-todo-access.log --log-format=COMBINED
```

---

## 💾 Backup Strategy

### 1. MongoDB Backups

**Option A: MongoDB Atlas Automated Backups**

MongoDB Atlas provides automated backups:
- Continuous backups (point-in-time recovery)
- Snapshot every 6 hours
- Retention: 2-7 days (configurable)

**Configure in Atlas Dashboard:**
```
Database → Backup → Configure
```

**Option B: Manual Backups (Self-hosted MongoDB)**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="vibe-todo-backup-$DATE"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump \
  --uri="mongodb://vibe_todo_user:APP_PASSWORD_HERE@localhost:27017/vibe_todo_manager?authSource=vibe_todo_manager" \
  --out="$BACKUP_DIR/$BACKUP_NAME" \
  --gzip

# Create archive
cd $BACKUP_DIR
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Upload to Google Cloud Storage
gsutil cp "$BACKUP_NAME.tar.gz" gs://your-bucket-name/mongodb-backups/

# Clean local backups older than retention period
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Test backup
sudo /usr/local/bin/backup-mongodb.sh

# Schedule with cron (daily at 2 AM)
sudo crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### 2. Application Code Backup

```bash
# Application code is in Git (already backed up)
# For production configs:

# Create backup script
sudo nano /usr/local/bin/backup-configs.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/configs"
DATE=$(date +"%Y-%m-%d")

mkdir -p $BACKUP_DIR

# Backup important configs
tar -czf "$BACKUP_DIR/configs-$DATE.tar.gz" \
  /var/www/vibe-todo/backend/.env \
  /var/www/vibe-todo/frontend/.env \
  /etc/nginx/sites-available/vibe-todo \
  /var/www/vibe-todo/backend/ecosystem.config.js

# Upload to Cloud Storage
gsutil cp "$BACKUP_DIR/configs-$DATE.tar.gz" gs://your-bucket-name/config-backups/

# Keep last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 3. Create Cloud Storage Bucket

```bash
# Create bucket for backups
gsutil mb -p your-project-id -c STANDARD -l us-central1 gs://vibe-todo-backups

# Set lifecycle policy (delete after 90 days)
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://vibe-todo-backups
```

### 4. Restore from Backup

**Restore MongoDB:**

```bash
# Download backup from Cloud Storage
gsutil cp gs://vibe-todo-backups/mongodb-backups/vibe-todo-backup-YYYY-MM-DD.tar.gz /tmp/

# Extract
cd /tmp
tar -xzf vibe-todo-backup-YYYY-MM-DD.tar.gz

# Restore
mongorestore \
  --uri="mongodb://vibe_todo_user:APP_PASSWORD_HERE@localhost:27017/vibe_todo_manager?authSource=vibe_todo_manager" \
  --gzip \
  vibe-todo-backup-YYYY-MM-DD/vibe_todo_manager
```

---

## 📈 Scaling & Optimization

### 1. Vertical Scaling (Increase VM Resources)

```bash
# Stop VM
gcloud compute instances stop your-vm-name --zone=your-zone

# Resize VM (e.g., to e2-standard-2)
gcloud compute instances set-machine-type your-vm-name \
  --machine-type=e2-standard-2 \
  --zone=your-zone

# Start VM
gcloud compute instances start your-vm-name --zone=your-zone
```

**Machine type recommendations:**

| Users | Machine Type | vCPU | Memory | Monthly Cost |
|-------|-------------|------|--------|--------------|
| 1-10 | e2-micro | 2 | 1 GB | ~$6 |
| 10-50 | e2-small | 2 | 2 GB | ~$12 |
| 50-200 | e2-medium | 2 | 4 GB | ~$24 |
| 200-500 | e2-standard-2 | 2 | 8 GB | ~$48 |
| 500+ | e2-standard-4 | 4 | 16 GB | ~$96 |

### 2. Horizontal Scaling (Load Balancer + Multiple VMs)

**When to scale horizontally:**
- More than 500 concurrent users
- Need high availability (99.9% uptime)
- Multi-region deployment

**Architecture:**
```
Load Balancer → [VM1, VM2, VM3] → Shared MongoDB
```

**Implementation:** (Advanced - create GitHub issue if needed)

### 3. Redis Caching

**Add Redis for performance:**

```bash
# Install Redis on VM
sudo apt-get install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Change:
# bind 127.0.0.1
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server

# Test
redis-cli ping  # Should return PONG
```

**Update backend to use Redis:**

```bash
cd /var/www/vibe-todo/backend
npm install redis
```

```javascript
// backend/src/config/redis.js
import { createClient } from 'redis';

const client = createClient({
  url: 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis() {
  await client.connect();
  console.log('✅ Redis connected');
}

export default client;
```

### 4. CDN for Static Assets

**Use Cloud CDN:**

```bash
# Enable Cloud CDN for your load balancer
# (Requires Cloud Load Balancer setup)
gcloud compute backend-services update your-backend-service \
  --enable-cdn \
  --global
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Backend Won't Start

**Check logs:**
```bash
pm2 logs vibe-todo-backend --lines 50
```

**Common causes:**
- MongoDB connection failed → Check MONGODB_URI in .env
- Port 3001 already in use → `sudo lsof -i :3001`
- Missing dependencies → `npm install`

#### 2. Frontend Shows Blank Page

**Check browser console:**
- Open DevTools (F12) → Console tab
- Look for errors

**Common causes:**
- VITE_API_URL incorrect → Check frontend/.env
- CORS error → Check backend CORS_ORIGIN
- API not responding → Check backend is running

#### 3. 502 Bad Gateway

**Nginx can't reach backend:**
```bash
# Check backend is running
pm2 status

# Check nginx error log
sudo tail -f /var/log/nginx/vibe-todo-error.log

# Test backend directly
curl http://localhost:3001/health
```

#### 4. SSL Certificate Issues

**Certificate not installing:**
```bash
# Check domain points to VM
dig yourdomain.com

# Check nginx config
sudo nginx -t

# Try again
sudo certbot --nginx -d yourdomain.com
```

#### 5. MongoDB Connection Failed

**Test connection:**
```bash
# For MongoDB Atlas
mongosh "your-connection-string"

# For self-hosted
mongosh -u vibe_todo_user -p --authenticationDatabase vibe_todo_manager

# Check MongoDB is running
sudo systemctl status mongod
```

### Debug Commands

```bash
# Check all services
sudo systemctl status nginx mongod

# Check PM2 processes
pm2 status

# Check ports in use
sudo netstat -tulpn | grep LISTEN

# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop

# Check recent logs
journalctl -xe

# Check nginx access
sudo tail -f /var/log/nginx/vibe-todo-access.log
```

---

## 🔄 CI/CD with Cloud Build

### Setup Automated Deployment

**1. Create cloudbuild.yaml:**

```bash
cd /var/www/vibe-todo
nano cloudbuild.yaml
```

```yaml
steps:
  # Install backend dependencies
  - name: 'node:18'
    dir: 'backend'
    args: ['npm', 'install']
  
  # Install frontend dependencies
  - name: 'node:18'
    dir: 'frontend'
    args: ['npm', 'install']
  
  # Build frontend
  - name: 'node:18'
    dir: 'frontend'
    args: ['npm', 'run', 'build']
  
  # Deploy to VM
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'compute'
      - 'scp'
      - '--recurse'
      - 'backend'
      - 'frontend/dist'
      - 'your-vm-name:/var/www/vibe-todo/'
      - '--zone=your-zone'
  
  # Restart backend
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'compute'
      - 'ssh'
      - 'your-vm-name'
      - '--zone=your-zone'
      - '--command=pm2 restart vibe-todo-backend'

timeout: '1200s'
```

**2. Create trigger:**

```bash
# Connect repository to Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Create automatic trigger on git push
gcloud builds triggers create github \
  --repo-name=claude-todo \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] VM created and running
- [ ] MongoDB configured (Atlas or self-hosted)
- [ ] Domain name registered (optional)
- [ ] SSL certificate ready (Let's Encrypt)
- [ ] Backup strategy planned

### Deployment

- [ ] Node.js installed on VM
- [ ] Nginx installed and configured
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] Backend .env configured with strong secrets
- [ ] Frontend .env configured with correct API URL
- [ ] Backend running via PM2
- [ ] Frontend built and served by nginx
- [ ] Firewall rules configured (80, 443)
- [ ] Domain pointing to VM IP
- [ ] SSL certificate installed

### Post-Deployment

- [ ] Application accessible via domain
- [ ] HTTPS working correctly
- [ ] Can create projects, epics, features, tasks
- [ ] Auto-status update working
- [ ] Authentication working (if enabled)
- [ ] Uptime monitoring configured
- [ ] Backup scripts scheduled
- [ ] Logs being collected
- [ ] PM2 auto-start on boot configured
- [ ] Team members can access

---

## 📝 Environment Summary

**Your GCP Setup:**

```
✅ Compute Engine VM
✅ MongoDB (Atlas or self-hosted)
✅ PostgreSQL (available, not used)
✅ Redis (available, optional)
✅ Nginx (reverse proxy)
✅ PM2 (process manager)
✅ SSL/HTTPS (Let's Encrypt)
✅ Cloud Logging & Monitoring
✅ Automated backups
```

**Application Stack:**

```
Frontend → Nginx → Backend → MongoDB
(React)   (Proxy)  (Node.js)  (Database)
```

**All working together on Google Cloud Platform!** 🎉

---

**Need help?** Check HANDOVER.md for complete project documentation or create a GitHub issue!
