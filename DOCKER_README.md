# Docker Setup for Excel to PowerPoint Converter

This document explains how to run the Excel to PowerPoint converter application using Docker.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of available RAM
- At least 1GB of available disk space

## Quick Start

### Development Environment

1. **Clone and navigate to the project directory:**
   ```bash
   cd /root/excel2powerpoint
   ```

2. **Start the development environment:**
   ```bash
   ./start-dev.sh
   ```

   Or manually:
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

### Production Environment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Start production environment:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Services

### Backend Service
- **Container**: `excel2ppt-backend`
- **Port**: 5000
- **Technology**: FastAPI with Python 3.11
- **Features**: 
  - Multi-stage build for optimization
  - Non-root user for security
  - Health checks
  - File upload handling
  - Excel to PowerPoint conversion

### Frontend Service
- **Container**: `excel2ppt-frontend`
- **Port**: 3000
- **Technology**: React with TypeScript
- **Features**:
  - Multi-stage build with Nginx
  - API proxying to backend
  - Gzip compression
  - Static file serving
  - Health checks

## Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
# Backend Configuration
BACKEND_PORT=5000
MAX_UPLOAD_SIZE=100MB
CORS_ORIGINS=http://localhost:3000,http://frontend:3000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
NODE_ENV=production
```

### Docker Compose Profiles

- **Development**: `docker-compose.yml`
  - Exposed ports for direct access
  - Development-friendly settings
  - Live reload capabilities

- **Production**: `docker-compose.prod.yml`
  - Optimized for production
  - Resource limits
  - Additional nginx reverse proxy
  - SSL/TLS support

## Commands

### Building Images
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build with no cache
docker-compose build --no-cache
```

### Running Services
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend

# Start with rebuild
docker-compose up --build
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

### Viewing Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Scaling Services
```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

## File Structure

```
/root/excel2powerpoint/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore          # Backend build exclusions
│   ├── main.py                # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── ...
├── frontend/
│   ├── Dockerfile             # Frontend container definition
│   ├── .dockerignore         # Frontend build exclusions
│   ├── nginx.conf            # Nginx configuration
│   ├── package.json          # Node.js dependencies
│   └── ...
├── nginx/
│   └── nginx.prod.conf       # Production nginx config
├── docker-compose.yml        # Development compose file
├── docker-compose.prod.yml   # Production compose file
├── .env.example             # Environment template
├── build.sh                 # Build script
└── start-dev.sh            # Development startup script
```

## Health Checks

Both services include health checks:

- **Backend**: `GET /health` - Returns JSON health status
- **Frontend**: `GET /health` - Returns plain text health status

Check service health:
```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend health
curl http://localhost:3000/health

# Check docker health status
docker-compose ps
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :5000
   ```

2. **Permission issues:**
   ```bash
   # Fix Docker permissions
   sudo chown -R $USER:$USER /root/excel2powerpoint
   ```

3. **Out of disk space:**
   ```bash
   # Clean up Docker
   docker system prune -a
   docker volume prune
   ```

4. **Build failures:**
   ```bash
   # Clean build
   docker-compose down
   docker-compose build --no-cache
   ```

### Debugging

1. **Access container shell:**
   ```bash
   # Backend container
   docker-compose exec backend bash

   # Frontend container
   docker-compose exec frontend sh
   ```

2. **View container logs:**
   ```bash
   # Real-time logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

3. **Check container stats:**
   ```bash
   docker stats
   ```

## Security

- Both containers run as non-root users
- Minimal base images (Alpine Linux)
- Security headers in nginx
- Rate limiting configured
- CORS properly configured
- No sensitive data in images

## Performance

- Multi-stage builds for smaller images
- Nginx gzip compression
- Resource limits in production
- Health checks with appropriate timeouts
- Efficient caching strategies

## Maintenance

### Updates
```bash
# Update base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --pull --no-cache

# Update and restart
docker-compose down && docker-compose up -d --build
```

### Backups
```bash
# Backup volumes
docker run --rm -v excel2powerpoint_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz /data

# Restore volumes
docker run --rm -v excel2powerpoint_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads.tar.gz
```