#!/bin/bash
# Mirage — Quick Start Script

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        MIRAGE DETECTION ENGINE            ║"
echo "║   Behavioral Financial Manipulation AI    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Copy env if not present
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from template"
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for backend
until curl -sf http://localhost:8000/api/health > /dev/null 2>&1; do
  echo "   Backend starting..."
  sleep 5
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          MIRAGE IS RUNNING! 🚀            ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000         ║"
echo "║  API Docs:  http://localhost:8000/api/docs║"
echo "║                                          ║"
echo "║  Login: alex@mirage.demo                 ║"
echo "║  Pass:  Demo1234!                        ║"
echo "╚══════════════════════════════════════════╝"
echo ""
