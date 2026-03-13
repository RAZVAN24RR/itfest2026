#!/bin/bash

# ============================================
# Campaia - Start Backend with ngrok tunnel
# ============================================
# This script starts ngrok tunnel for the backend API
# and outputs the public URL for mobile app testing.
#
# Prerequisites:
#   - ngrok installed: https://ngrok.com/download
#   - ngrok account configured: ngrok config add-authtoken <token>
#
# Usage: ./scripts/start-ngrok.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Campaia - ngrok Tunnel Setup${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}Error: ngrok is not installed.${NC}"
    echo -e "Install it from: ${YELLOW}https://ngrok.com/download${NC}"
    echo -e "Then run: ${YELLOW}ngrok config add-authtoken <your-token>${NC}"
    exit 1
fi

# Backend port
BACKEND_PORT=8000

# Kill any existing ngrok processes
pkill -f "ngrok http" 2>/dev/null || true

# Start ngrok in background
echo -e "${YELLOW}Starting ngrok tunnel on port ${BACKEND_PORT}...${NC}"
ngrok http $BACKEND_PORT --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL from ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oP '"public_url":"https://[^"]+' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}Error: Could not get ngrok URL. Is ngrok running?${NC}"
    echo -e "Check logs: ${YELLOW}cat /tmp/ngrok.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ngrok Tunnel Started Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Backend URL: ${BLUE}${NGROK_URL}${NC}"
echo ""
echo -e "${YELLOW}To use this URL in your mobile app, update:${NC}"
echo -e "  campaia-platform/.env"
echo -e "  VITE_API_URL=${NGROK_URL}"
echo ""
echo -e "${YELLOW}Or update capacitor.config.ts server.url${NC}"
echo ""
echo -e "ngrok Dashboard: ${BLUE}http://localhost:4040${NC}"
echo -e "ngrok PID: ${NGROK_PID}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop ngrok and exit${NC}"

# Keep script running
wait $NGROK_PID
