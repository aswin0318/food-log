# Deployment Guide

## Overview

This guide walks through deploying the NutriTrack Diet & Macro Compliance Tracker system.

### Architecture

```
Internet → HAProxy (EC2) → Envoy Gateway → K8s Services
```

### Traffic Flow

| Path | Service | Port |
|------|---------|------|
| `/` | frontend | 3000 |
| `/api/auth/*` | auth-service | 8000 |
| `/api/food/*` | food-service | 8001 |
| `/api/macro/*` | macro-service | 8002 |
| `/api/compliance/*` | compliance-service | 8003 |

---

## Step 1: Build Docker Images

```bash
# From the project root
./scripts/build-images.sh <your-registry> <tag>

# Example:
./scripts/build-images.sh ghcr.io/yourusername v1.0.0

# Push images
docker push ghcr.io/yourusername/auth-service:v1.0.0
docker push ghcr.io/yourusername/food-service:v1.0.0
docker push ghcr.io/yourusername/macro-service:v1.0.0
docker push ghcr.io/yourusername/compliance-service:v1.0.0
docker push ghcr.io/yourusername/frontend:v1.0.0
```

## Step 2: Update Helm Values

Edit `helm/values.yaml`:

```yaml
global:
  imageRegistry: "ghcr.io/yourusername"
  jwtSecret: "<generate-a-strong-secret>"  # openssl rand -hex 32

authService:
  image:
    repository: "ghcr.io/yourusername/auth-service"
    tag: "v1.0.0"
# ... repeat for all services
```

## Step 3: Deploy to Kubernetes

```bash
# Option A: Use the deploy script
./scripts/deploy.sh nutritrack

# Option B: Manual deployment

# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy PostgreSQL
helm upgrade --install postgresql helm/postgresql \
  -f helm/values.yaml -n nutritrack --wait

# 3. Deploy backend services
helm upgrade --install auth-service helm/auth-service \
  -f helm/values.yaml -n nutritrack --wait
helm upgrade --install food-service helm/food-service \
  -f helm/values.yaml -n nutritrack --wait
helm upgrade --install macro-service helm/macro-service \
  -f helm/values.yaml -n nutritrack --wait
helm upgrade --install compliance-service helm/compliance-service \
  -f helm/values.yaml -n nutritrack --wait

# 4. Deploy frontend
helm upgrade --install frontend helm/frontend \
  -f helm/values.yaml -n nutritrack --wait

# 5. Configure Envoy Gateway
kubectl apply -f envoy/gateway-class.yaml
kubectl apply -f envoy/gateway.yaml
kubectl apply -f envoy/httproutes.yaml
```

## Step 4: Verify Deployment

```bash
# Check all pods
kubectl get pods -n nutritrack

# Expected output:
# NAME                                  READY   STATUS    RESTARTS
# postgresql-0                          1/1     Running   0
# auth-service-xxxx-xxxxx               1/1     Running   0
# food-service-xxxx-xxxxx               1/1     Running   0
# macro-service-xxxx-xxxxx              1/1     Running   0
# compliance-service-xxxx-xxxxx         1/1     Running   0
# frontend-xxxx-xxxxx                   1/1     Running   0
# frontend-xxxx-yyyyy                   1/1     Running   0

# Check services
kubectl get svc -n nutritrack

# Check HPA
kubectl get hpa -n nutritrack

# Test health endpoints
kubectl port-forward svc/auth-service 8000:8000 -n nutritrack &
curl http://localhost:8000/api/auth/health
```

## Step 5: Configure HAProxy

1. Find the Envoy Gateway service:
   ```bash
   kubectl get svc -n nutritrack \
     -l gateway.envoyproxy.io/owning-gateway-name=nutritrack-gateway
   ```

2. Update `haproxy/haproxy.cfg` with the NodePort details

3. Copy to HAProxy EC2 instance:
   ```bash
   scp haproxy/haproxy.cfg ec2-user@<HAPROXY_IP>:/tmp/
   ssh ec2-user@<HAPROXY_IP> "sudo cp /tmp/haproxy.cfg /etc/haproxy/ && sudo systemctl restart haproxy"
   ```

## Step 6: Verify End-to-End

```bash
# Test from HAProxy
curl http://<HAPROXY_IP>/api/auth/health
curl http://<HAPROXY_IP>/api/food/health
curl http://<HAPROXY_IP>/api/macro/health
curl http://<HAPROXY_IP>/api/compliance/health

# Access frontend
# Open http://<HAPROXY_IP> in browser
```

---

## Updating Services

```bash
# Build new image
docker build -t ghcr.io/yourusername/auth-service:v1.1.0 services/auth-service/
docker push ghcr.io/yourusername/auth-service:v1.1.0

# Update Helm
helm upgrade auth-service helm/auth-service \
  --set image.tag=v1.1.0 \
  -f helm/values.yaml \
  -n nutritrack
```

## Troubleshooting

```bash
# View pod logs
kubectl logs -f deployment/auth-service -n nutritrack

# Describe pod for events
kubectl describe pod <pod-name> -n nutritrack

# Check PostgreSQL
kubectl exec -it postgresql-0 -n nutritrack -- psql -U postgres -l

# Check Envoy Gateway
kubectl get gatewayclass
kubectl get gateway -n nutritrack
kubectl get httproute -n nutritrack
```
