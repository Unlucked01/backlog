#!/bin/bash

# Deployment script for Student Backlog Planner
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Deploying Student Backlog Planner..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before continuing"
    echo "Press Enter when ready..."
    read
fi

# Build and start services
echo "📦 Building and starting services..."
docker-compose build --no-cache
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Start backend and frontend
docker-compose up -d backend frontend

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Check if SSL certificates exist
if [ ! -d "certbot/conf/live/unl-backlog.duckdns.org" ]; then
    echo "🔐 SSL certificates not found. Running SSL initialization..."
    ./scripts/init-ssl.sh
else
    echo "✅ SSL certificates found. Starting nginx..."
    docker-compose up -d nginx certbot
fi

echo "🎉 Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Your application should be available at:"
echo "  HTTP:  http://unl-backlog.duckdns.org:8080"
echo "  HTTPS: https://unl-backlog.duckdns.org:8443"
echo ""
echo "📝 Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  SSL renewal:   docker-compose exec certbot certbot renew" 