#!/bin/bash

# Fix Docker Compose ContainerConfig error
# This script resolves the 'ContainerConfig' KeyError in Docker Compose 1.29.2

set -e

echo "🔧 Fixing Docker Compose ContainerConfig error..."

# Step 1: Stop and remove problematic containers
echo "📋 Step 1: Stopping and removing existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true
docker stop backlog_postgres backlog_backend backlog_frontend backlog_nginx backlog_certbot 2>/dev/null || true
docker rm backlog_postgres backlog_backend backlog_frontend backlog_nginx backlog_certbot 2>/dev/null || true

# Step 2: Clean up Docker system
echo "📋 Step 2: Cleaning Docker system..."
docker system prune -f
docker volume prune -f

# Step 3: Remove problematic images
echo "📋 Step 3: Removing potentially corrupted images..."
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true

# Step 4: Use fixed docker-compose file
echo "📋 Step 4: Using fixed docker-compose configuration..."
if [ -f "docker-compose.fixed.yml" ]; then
    echo "✅ Using docker-compose.fixed.yml"
    cp docker-compose.yml docker-compose.yml.backup
    cp docker-compose.fixed.yml docker-compose.yml
else
    echo "❌ docker-compose.fixed.yml not found"
    exit 1
fi

# Step 5: Build and start services step by step
echo "📋 Step 5: Building and starting services..."

echo "🗄️  Starting PostgreSQL..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

echo "🔧 Starting Backend..."
docker-compose up -d backend

echo "⏳ Waiting for Backend to be ready..."
sleep 10

echo "🌐 Starting Frontend..."
docker-compose up -d frontend

echo "⏳ Waiting for Frontend to be ready..."
sleep 10

echo "🔒 Starting Nginx..."
docker-compose up -d nginx

echo "📜 Starting Certbot..."
docker-compose up -d certbot

echo "✅ All services started successfully!"

# Step 6: Check status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Docker Compose ContainerConfig error fixed!"
echo "Your application should now be running properly."
echo ""
echo "🌐 Access your application at:"
echo "  HTTP:  http://unl-backlog.duckdns.org:8080"
echo "  HTTPS: https://unl-backlog.duckdns.org:8443" 