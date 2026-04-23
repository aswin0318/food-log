#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Deploy All Services to Kubernetes via Helm
# Usage: ./deploy.sh [namespace]
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NAMESPACE="${1:-nutritrack}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HELM_DIR="${PROJECT_ROOT}/helm"
GLOBAL_VALUES="${HELM_DIR}/values.yaml"

echo "════════════════════════════════════════════════════════════"
echo "  Deploying NutriTrack to Kubernetes"
echo "  Namespace: ${NAMESPACE}"
echo "════════════════════════════════════════════════════════════"

# Step 1: Create namespace
echo ""
echo "── Step 1: Create namespace ──────────────────────────────────"
kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"
echo "✓ Namespace created"

# Step 2: Deploy PostgreSQL
echo ""
echo "── Step 2: Deploy PostgreSQL ─────────────────────────────────"
helm upgrade --install postgresql \
  "${HELM_DIR}/postgresql" \
  -f "${GLOBAL_VALUES}" \
  -n "${NAMESPACE}" \
  --wait --timeout 120s
echo "✓ PostgreSQL deployed"

# Step 3: Wait for PostgreSQL to be ready
echo ""
echo "── Step 3: Waiting for PostgreSQL... ─────────────────────────"
kubectl wait --for=condition=ready pod -l app=postgresql -n "${NAMESPACE}" --timeout=120s
echo "✓ PostgreSQL is ready"

# Step 4: Deploy backend services
echo ""
echo "── Step 4: Deploy backend services ───────────────────────────"

BACKEND_SERVICES=(
  "auth-service"
  "food-service"
  "macro-service"
  "compliance-service"
)

for SERVICE in "${BACKEND_SERVICES[@]}"; do
  echo "  Deploying ${SERVICE}..."
  helm upgrade --install "${SERVICE}" \
    "${HELM_DIR}/${SERVICE}" \
    -f "${GLOBAL_VALUES}" \
    -n "${NAMESPACE}" \
    --wait --timeout 90s
  echo "  ✓ ${SERVICE} deployed"
done

# Step 5: Deploy frontend
echo ""
echo "── Step 5: Deploy frontend ───────────────────────────────────"
helm upgrade --install frontend \
  "${HELM_DIR}/frontend" \
  -f "${GLOBAL_VALUES}" \
  -n "${NAMESPACE}" \
  --wait --timeout 90s
echo "✓ Frontend deployed"

# Step 6: Deploy Envoy Gateway resources
echo ""
echo "── Step 6: Deploy Envoy Gateway routes ───────────────────────"
kubectl apply -f "${PROJECT_ROOT}/envoy/gateway-class.yaml"
kubectl apply -f "${PROJECT_ROOT}/envoy/gateway.yaml"
kubectl apply -f "${PROJECT_ROOT}/envoy/httproutes.yaml"
echo "✓ Gateway routes configured"

# Step 7: Verify
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Deployment Complete! Verifying pods..."
echo "════════════════════════════════════════════════════════════"
echo ""
kubectl get pods -n "${NAMESPACE}" -o wide
echo ""
kubectl get svc -n "${NAMESPACE}"
echo ""
echo "To access the application, configure HAProxy to point to the Envoy Gateway service."
echo "Find the gateway service with:"
echo "  kubectl get svc -n ${NAMESPACE} -l gateway.envoyproxy.io/owning-gateway-name=nutritrack-gateway"
