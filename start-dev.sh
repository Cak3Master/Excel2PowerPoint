#!/bin/bash
# Development startup script

set -e

echo "Starting Excel to PowerPoint converter in development mode..."

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Create necessary directories
mkdir -p backend/uploads backend/temp

# Start services
docker-compose up --build --remove-orphans

echo "Development server started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "Health check: http://localhost:5000/api/health"