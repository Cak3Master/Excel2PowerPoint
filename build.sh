#!/bin/bash
# Build script for Excel to PowerPoint converter

set -e

echo "Building Excel to PowerPoint converter..."

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build images
echo "Building Docker images..."
docker-compose build --parallel

# Tag images with version
VERSION=${VERSION:-latest}
docker tag excel2powerpoint_backend:latest excel2powerpoint_backend:$VERSION
docker tag excel2powerpoint_frontend:latest excel2powerpoint_frontend:$VERSION

echo "Build complete!"
echo "To run the application:"
echo "  Development: docker-compose up"
echo "  Production: docker-compose -f docker-compose.prod.yml up"