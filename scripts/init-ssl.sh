#!/bin/bash

# SSL initialization script for unl-backlog.duckdns.org
# This script will obtain SSL certificates using Let's Encrypt

set -e

DOMAIN="unl-backlog.duckdns.org"
EMAIL="admin@unl-backlog.duckdns.org"  # Change this to your email

echo "🔐 Initializing SSL certificates for $DOMAIN..."

# Create necessary directories
mkdir -p certbot/conf certbot/www certbot/logs

# Check if certificates already exist
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    echo "⚠️  SSL certificates already exist for $DOMAIN"
    echo "If you want to renew them, run: docker-compose exec certbot certbot renew"
    exit 0
fi

echo "📋 Step 1: Starting services with temporary HTTP configuration..."

# Start services with temporary configuration
docker-compose up -d postgres backend frontend nginx

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

echo "📋 Step 2: Obtaining SSL certificate..."

# Obtain SSL certificate
docker-compose run --rm certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    echo "📋 Step 3: Switching to SSL configuration..."
    
    # Rename temporary config and enable SSL config
    mv nginx/conf.d/backlog-init.conf nginx/conf.d/backlog-init.conf.disabled
    
    # Restart nginx to load SSL configuration
    docker-compose restart nginx
    
    echo "🎉 SSL setup complete!"
    echo "Your application is now available at: https://$DOMAIN"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your DNS to point $DOMAIN to this server's IP"
    echo "2. Make sure ports 8080 (HTTP) and 8443 (HTTPS) are open in your firewall"
    echo "3. Access your application at https://$DOMAIN"
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Please check:"
    echo "1. Domain $DOMAIN points to this server's IP"
    echo "2. Port 8080 is accessible from the internet"
    echo "3. No firewall is blocking the connection"
    exit 1
fi 