#!/bin/bash

# Build and run the backend Docker container

echo "🐳 Building Matalk Operational Backend Docker image..."

# Build the Docker image
docker build -t matalk-operational-backend .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    
    echo "🚀 Starting the backend container..."
    
    # Run the container
    docker run -d \
        --name matalk-backend \
        -p 3001:3001 \
        --env-file .env \
        --restart unless-stopped \
        matalk-operational-backend
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend container started successfully!"
        echo "📊 Backend is running on http://localhost:3001"
        echo "🔍 Health check: http://localhost:3001/health"
        echo ""
        echo "To view logs: docker logs matalk-backend"
        echo "To stop: docker stop matalk-backend"
        echo "To remove: docker rm matalk-backend"
    else
        echo "❌ Failed to start the container"
    fi
else
    echo "❌ Failed to build Docker image"
    exit 1
fi 