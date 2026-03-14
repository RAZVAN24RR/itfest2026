#!/bin/bash
# ============================================
# Campaia - Development Start Script
# ============================================
# Usage: ./scripts/dev-start.sh [options]
# 
# Options:
#   --build     Force rebuild of containers
#   --clean     Remove volumes and start fresh
#   --logs      Follow logs after starting
#   --stop      Stop all containers
#   --status    Show container status
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     🚀 CAMPAIA - Development Environment                  ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Check if .env exists, if not copy from .env.example
check_env() {
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            echo -e "${YELLOW}Creating .env from .env.example...${NC}"
            cp .env.example .env
            echo -e "${GREEN}Created .env file. Please review and update the values.${NC}"
        else
            echo -e "${RED}Error: .env.example not found!${NC}"
            exit 1
        fi
    fi
}

# Start containers
start() {
    local build_flag=""
    if [ "$1" == "--build" ]; then
        build_flag="--build"
        echo -e "${YELLOW}Rebuilding containers...${NC}"
    fi

    echo -e "${GREEN}Starting Campaia development environment...${NC}"
    docker-compose up -d $build_flag

    # Start Local Video AI service on host (GPU)
    if [ -f "$SCRIPT_DIR/local-video-env/bin/activate" ]; then
        if ! curl -s http://localhost:8001/health >/dev/null 2>&1; then
            echo -e "${YELLOW}Starting Local Video AI (GPU)...${NC}"
            nohup bash "$SCRIPT_DIR/start-video-ai.sh" > "$PROJECT_ROOT/logs/video-ai.log" 2>&1 &
            echo -e "${GREEN}Local Video AI starting in background (PID: $!)${NC}"
        else
            echo -e "${GREEN}Local Video AI already running on :8001${NC}"
        fi
    else
        echo -e "${YELLOW}Local Video AI venv not found — skipping (run scripts/start-video-ai.sh manually)${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ All services started!${NC}"
    echo ""
    echo -e "${BLUE}Services available at:${NC}"
    echo -e "  📱 Frontend:   ${GREEN}http://localhost:5173${NC}"
    echo -e "  🔌 Backend:    ${GREEN}http://localhost:8000${NC}"
    echo -e "  📚 API Docs:   ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  🗄️  Database:  ${GREEN}localhost:5432${NC}"
    echo -e "  💾 Redis:      ${GREEN}localhost:6379${NC}"
    echo -e "  ☁️  LocalStack: ${GREEN}http://localhost:4566${NC}"
    echo -e "  🎬 Video AI:   ${GREEN}http://localhost:8001${NC} (GPU)"
    echo ""
}

# Stop containers
stop() {
    echo -e "${YELLOW}Stopping all containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ All containers stopped.${NC}"
}

# Clean start (remove volumes)
clean() {
    echo -e "${RED}⚠️  This will remove all data (database, redis, etc.)!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing containers and volumes...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✅ Cleaned. Starting fresh...${NC}"
        start --build
    else
        echo -e "${BLUE}Cancelled.${NC}"
    fi
}

# Show logs
logs() {
    echo -e "${BLUE}Following logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Show status
status() {
    echo -e "${BLUE}Container Status:${NC}"
    echo ""
    docker-compose ps
    echo ""
    echo -e "${BLUE}Health Checks:${NC}"
    echo ""
    
    # Check each service
    services=("campaia-db" "campaia-redis" "campaia-backend" "campaia-frontend")
    for service in "${services[@]}"; do
        health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "not running")
        if [ "$health" == "healthy" ]; then
            echo -e "  $service: ${GREEN}$health${NC}"
        elif [ "$health" == "not running" ]; then
            echo -e "  $service: ${RED}$health${NC}"
        else
            echo -e "  $service: ${YELLOW}$health${NC}"
        fi
    done
    echo ""
}

# Main
print_banner
check_docker

case "${1:-}" in
    --stop)
        stop
        ;;
    --clean)
        check_env
        clean
        ;;
    --logs)
        logs
        ;;
    --status)
        status
        ;;
    --build)
        check_env
        start --build
        ;;
    --help|-h)
        echo "Usage: ./scripts/dev-start.sh [options]"
        echo ""
        echo "Options:"
        echo "  (no args)   Start all containers"
        echo "  --build     Force rebuild of containers"
        echo "  --clean     Remove volumes and start fresh"
        echo "  --logs      Follow logs"
        echo "  --stop      Stop all containers"
        echo "  --status    Show container status"
        echo "  --help      Show this help"
        ;;
    *)
        check_env
        start
        ;;
esac
