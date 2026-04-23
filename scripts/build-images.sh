#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Build Docker Images for All Services
# Usage: ./build-images.sh [registry] [tag]
# Example: ./build-images.sh mydockerhubuser v1.0.0
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGISTRY="${1:-food-log}"
TAG="${2:-latest}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "════════════════════════════════════════════════════════════"
echo "  Building Docker Images"
echo "  Registry: ${REGISTRY}"
echo "  Tag: ${TAG}"
echo "════════════════════════════════════════════════════════════"

SERVICES=(
  "auth-service"
  "food-service"
  "macro-service"
  "compliance-service"
  "frontend"
)

for SERVICE in "${SERVICES[@]}"; do
  echo ""
  echo "── Building ${SERVICE} ──────────────────────────────────────"
  docker build \
    -t "${REGISTRY}/${SERVICE}:${TAG}" \
    -t "${REGISTRY}/${SERVICE}:latest" \
    "${PROJECT_ROOT}/services/${SERVICE}"
  echo "✓ ${SERVICE} built successfully"
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  All images built successfully!"
echo "════════════════════════════════════════════════════════════"
 
