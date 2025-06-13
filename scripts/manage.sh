#!/bin/bash

# Management script for Student Backlog Planner
# Usage: ./scripts/manage.sh [command]

set -e

DOMAIN="unl-backlog.duckdns.org"

show_help() {
    echo "🛠️  Student Backlog Planner Management Script"
    echo ""
    echo "Usage: ./scripts/manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Show services status"
    echo "  logs        - Show logs (all services)"
    echo "  logs-nginx  - Show nginx logs"
    echo "  logs-api    - Show backend API logs"
    echo "  logs-app    - Show frontend app logs"
    echo "  build       - Rebuild all services"
    echo "  ssl-renew   - Renew SSL certificates"
    echo "  ssl-status  - Check SSL certificate status"
    echo "  backup-db   - Create database backup"
    echo "  restore-db  - Restore database from backup"
    echo "  update      - Update application (git pull + rebuild)"
    echo "  clean       - Clean unused Docker resources"
    echo "  health      - Check application health"
    echo ""
}

start_services() {
    echo "🚀 Starting services..."
    docker-compose up -d
    echo "✅ Services started"
    show_status
}

stop_services() {
    echo "🛑 Stopping services..."
    docker-compose down
    echo "✅ Services stopped"
}

restart_services() {
    echo "🔄 Restarting services..."
    docker-compose restart
    echo "✅ Services restarted"
    show_status
}

show_status() {
    echo "📊 Services Status:"
    docker-compose ps
}

show_logs() {
    echo "📋 Showing logs (press Ctrl+C to exit)..."
    docker-compose logs -f
}

show_nginx_logs() {
    echo "📋 Showing nginx logs (press Ctrl+C to exit)..."
    docker-compose logs -f nginx
}

show_api_logs() {
    echo "📋 Showing backend API logs (press Ctrl+C to exit)..."
    docker-compose logs -f backend
}

show_app_logs() {
    echo "📋 Showing frontend app logs (press Ctrl+C to exit)..."
    docker-compose logs -f frontend
}

build_services() {
    echo "🔨 Building services..."
    docker-compose build --no-cache
    echo "✅ Build complete"
}

renew_ssl() {
    echo "🔐 Renewing SSL certificates..."
    docker-compose exec certbot certbot renew
    docker-compose restart nginx
    echo "✅ SSL certificates renewed"
}

check_ssl_status() {
    echo "🔐 SSL Certificate Status:"
    docker-compose exec certbot certbot certificates
}

backup_database() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Creating database backup: $BACKUP_FILE"
    docker-compose exec postgres pg_dump -U backlog_user student_planner > "$BACKUP_FILE"
    echo "✅ Database backup created: $BACKUP_FILE"
}

restore_database() {
    echo "📂 Available backup files:"
    ls -la backup_*.sql 2>/dev/null || echo "No backup files found"
    echo ""
    read -p "Enter backup filename: " BACKUP_FILE
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "⚠️  This will overwrite the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restoring database from: $BACKUP_FILE"
        docker-compose exec -T postgres psql -U backlog_user student_planner < "$BACKUP_FILE"
        echo "✅ Database restored"
    else
        echo "❌ Restore cancelled"
    fi
}

update_application() {
    echo "🔄 Updating application..."
    
    echo "📥 Pulling latest code..."
    git pull
    
    echo "🛑 Stopping services..."
    docker-compose down
    
    echo "🔨 Building services..."
    docker-compose build --no-cache
    
    echo "🚀 Starting services..."
    docker-compose up -d
    
    echo "✅ Application updated"
    show_status
}

clean_docker() {
    echo "🧹 Cleaning unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Docker cleanup complete"
}

check_health() {
    echo "🏥 Checking application health..."
    echo ""
    
    echo "🔍 Checking services status..."
    docker-compose ps
    echo ""
    
    echo "🌐 Checking HTTP endpoint..."
    if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN:8080" | grep -q "200\|301\|302"; then
        echo "✅ HTTP endpoint is responding"
    else
        echo "❌ HTTP endpoint is not responding"
    fi
    
    echo "🔒 Checking HTTPS endpoint..."
    if curl -s -k -o /dev/null -w "%{http_code}" "https://$DOMAIN:8443" | grep -q "200"; then
        echo "✅ HTTPS endpoint is responding"
    else
        echo "❌ HTTPS endpoint is not responding"
    fi
    
    echo "🗄️  Checking database..."
    if docker-compose exec postgres pg_isready -U backlog_user >/dev/null 2>&1; then
        echo "✅ Database is ready"
    else
        echo "❌ Database is not ready"
    fi
    
    echo "📊 Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-nginx)
        show_nginx_logs
        ;;
    logs-api)
        show_api_logs
        ;;
    logs-app)
        show_app_logs
        ;;
    build)
        build_services
        ;;
    ssl-renew)
        renew_ssl
        ;;
    ssl-status)
        check_ssl_status
        ;;
    backup-db)
        backup_database
        ;;
    restore-db)
        restore_database
        ;;
    update)
        update_application
        ;;
    clean)
        clean_docker
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 