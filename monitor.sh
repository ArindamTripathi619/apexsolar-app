#!/bin/bash

# ApexSolar Health Check Script
# This script monitors the application and restarts it if needed

# Configuration
APP_URL="https://localhost/api/health"
LOG_FILE="/var/log/apexsolar-monitor.log"
APP_DIR="/opt/apexsolar-app"
MAX_LOG_SIZE=10485760  # 10MB

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
}

# Function to rotate log file if it gets too large
rotate_log() {
    if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
        touch "$LOG_FILE"
        log_message "Log file rotated"
    fi
}

# Function to check application health
check_application() {
    local response=$(curl -k -s -w "%{http_code}" -o /dev/null --max-time 10 "$APP_URL" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        local health_status=$(curl -k -s --max-time 10 "$APP_URL" 2>/dev/null)
        if echo "$health_status" | grep -q "healthy"; then
            return 0  # Application is healthy
        fi
    fi
    
    return 1  # Application is not healthy
}

# Function to restart application
restart_application() {
    log_message "Application unhealthy - attempting restart"
    
    cd "$APP_DIR" || {
        log_message "ERROR: Cannot change to application directory $APP_DIR"
        return 1
    }
    
    if docker-compose -f docker-compose.prod.yml restart app; then
        log_message "Application restart initiated successfully"
        sleep 30  # Wait for application to start
        
        if check_application; then
            log_message "Application restart successful - service is healthy"
            return 0
        else
            log_message "WARNING: Application restart completed but health check still failing"
            return 1
        fi
    else
        log_message "ERROR: Failed to restart application"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    cd "$APP_DIR" || return 1
    
    local app_status=$(docker-compose -f docker-compose.prod.yml ps app --format "table {{.State}}" | tail -n1)
    local db_status=$(docker-compose -f docker-compose.prod.yml ps postgres --format "table {{.State}}" | tail -n1)
    
    if [ "$app_status" != "running" ] || [ "$db_status" != "running" ]; then
        log_message "Container status - App: $app_status, DB: $db_status"
        return 1
    fi
    
    return 0
}

# Main monitoring logic
main() {
    rotate_log
    
    # Check if containers are running
    if ! check_containers; then
        log_message "One or more containers are not running - attempting restart"
        cd "$APP_DIR"
        docker-compose -f docker-compose.prod.yml up -d
        sleep 30
    fi
    
    # Check application health
    if check_application; then
        # Application is healthy - log success every hour (12 * 5min checks)
        if [ $(($(date +%M) % 60)) -eq 0 ]; then
            log_message "Application health check: HEALTHY"
        fi
    else
        # Application is unhealthy - attempt restart
        restart_application
        
        # If restart fails, send additional notification
        if ! check_application; then
            log_message "CRITICAL: Application restart failed - manual intervention required"
        fi
    fi
}

# Run main function
main "$@"
