#!/bin/bash

# Production deployment script for unl-backlog.duckdns.org with SSL fix
set -e

echo "🚀 Starting deployment for Backlog App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Some commands will be executed directly."
    SUDO=""
else
    print_status "Running with sudo for privileged commands."
    SUDO="sudo"
fi

# 1. Create webroot directory for certbot
print_status "Creating webroot directory for certbot..."
$SUDO mkdir -p /var/www/certbot

# 2. Setup temporary nginx configuration (without SSL)
print_status "Setting up temporary nginx configuration..."
$SUDO cp nginx-temp.conf /etc/nginx/sites-available/unl-backlog.duckdns.org

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/unl-backlog.duckdns.org ]; then
    print_status "Creating nginx sites-enabled symlink..."
    $SUDO ln -s /etc/nginx/sites-available/unl-backlog.duckdns.org /etc/nginx/sites-enabled/
    print_success "Nginx symlink created"
else
    print_warning "Nginx symlink already exists"
fi

# 3. Test temporary nginx configuration
print_status "Testing temporary nginx configuration..."
if $SUDO nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# 4. Reload nginx with temporary config
print_status "Reloading nginx with temporary configuration..."
$SUDO nginx -s reload

# 5. Setup environment file
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
fi

# 6. Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose down || true

# 7. Build and start production containers
print_status "Building and starting production containers..."
docker-compose up --build -d

# 8. Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# 9. Check if services are running
print_status "Checking service health..."
if docker-compose ps | grep -q "Up"; then
    print_success "Docker containers are running"
else
    print_error "Some containers failed to start!"
    docker-compose logs
    exit 1
fi

# 10. Get SSL certificate
print_status "Getting SSL certificate..."
if [ ! -d "/etc/letsencrypt/live/unl-backlog.duckdns.org" ]; then
    print_status "Obtaining SSL certificate..."
    $SUDO certbot certonly --webroot -w /var/www/certbot -d unl-backlog.duckdns.org --non-interactive --agree-tos --email admin@unl-backlog.duckdns.org
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
else
    print_warning "SSL certificate already exists"
fi

# 11. Update nginx configuration with SSL
print_status "Updating nginx configuration with SSL..."
$SUDO cp nginx.conf /etc/nginx/sites-available/unl-backlog.duckdns.org

# 12. Test final nginx configuration
print_status "Testing final nginx configuration..."
if $SUDO nginx -t; then
    print_success "Final nginx configuration is valid"
else
    print_error "Final nginx configuration test failed!"
    exit 1
fi

# 13. Reload nginx with SSL configuration
print_status "Reloading nginx with SSL configuration..."
$SUDO nginx -s reload
print_success "Nginx reloaded with SSL"

# 14. Setup automatic certificate renewal
print_status "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null || true; echo "0 12 * * * /usr/bin/certbot renew --quiet && nginx -s reload") | crontab -
print_success "Certificate auto-renewal configured"

# 15. Final checks
print_status "Performing final health checks..."
sleep 10

# Check if backend is responding
if curl -f http://localhost:8010/api/v1/health > /dev/null 2>&1; then
    print_success "Backend is responding"
else
    print_warning "Backend health check failed"
fi

# Check if frontend is responding
if curl -f http://localhost:3010 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend health check failed"
fi

print_success "🎉 Deployment completed!"
print_status "Your app should be available at: https://unl-backlog.duckdns.org"
print_status "Logs can be viewed with: docker-compose logs -f"

echo ""
print_status "Next steps:"
echo "1. Update Google OAuth redirect URIs to include:"
echo "   https://unl-backlog.duckdns.org/auth/google/callback"
echo "2. Test the application thoroughly"
echo "3. Monitor logs: docker-compose logs -f"
echo "4. Setup monitoring and backups" 