#!/bin/bash

# DiscreetOpinions — Start with ngrok tunnel
# Builds frontend, serves everything through Express, one tunnel

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  DiscreetOpinions — Tunnel Mode"
echo "============================================"
echo ""

# Kill any existing process on port 3001
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true

# Step 1: Build frontend
echo "[1/3] Building frontend..."
cd "$ROOT/client"
npx vite build --quiet
echo "   Build complete."

# Step 2: Start backend (serves API + built frontend)
echo "[2/3] Starting server on port 3001..."
cd "$ROOT/server"
node index.js &
SERVER_PID=$!
sleep 2

# Step 3: Start ngrok
echo "[3/3] Starting ngrok tunnel..."
ngrok http 3001 --log=stdout --log-level=warn > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

# Get public URL
PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    if t.get('public_url', '').startswith('https'):
        print(t['public_url'])
        break
" 2>/dev/null)

if [ -z "$PUBLIC_URL" ]; then
  echo ""
  echo "ERROR: Could not get ngrok URL."
  echo "Make sure ngrok is authenticated: ngrok config add-authtoken <token>"
  kill $SERVER_PID 2>/dev/null
  kill $NGROK_PID 2>/dev/null
  exit 1
fi

echo ""
echo "============================================"
echo "  App is live!"
echo "============================================"
echo ""
echo "  Public URL:  $PUBLIC_URL"
echo ""
echo "  Share this link with anyone!"
echo ""
echo "  Press Ctrl+C to stop"
echo "============================================"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $SERVER_PID 2>/dev/null
  kill $NGROK_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT

wait
