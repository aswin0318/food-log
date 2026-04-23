# EC2 Setup Guide

## HAProxy EC2 Instance (Public Entry Point)

### Instance Requirements
- **Instance Type**: t3.small (minimum)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20GB gp3
- **Network**: Public subnet with Elastic IP

### Security Groups

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 8404 | TCP | Your IP | HAProxy Stats |

### Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install HAProxy
sudo apt install -y haproxy

# Enable HAProxy on boot
sudo systemctl enable haproxy

# Copy configuration
sudo cp haproxy.cfg /etc/haproxy/haproxy.cfg

# Validate config
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Start HAProxy
sudo systemctl restart haproxy

# Check status
sudo systemctl status haproxy
```

### TLS Certificate Setup

```bash
# Install certbot for Let's Encrypt
sudo apt install -y certbot

# Obtain certificate
sudo certbot certonly --standalone -d diet-tracker.example.com

# Combine cert + key for HAProxy
sudo cat /etc/letsencrypt/live/diet-tracker.example.com/fullchain.pem \
  /etc/letsencrypt/live/diet-tracker.example.com/privkey.pem \
  | sudo tee /etc/haproxy/certs/diet-tracker.example.com.pem

# Update haproxy.cfg to enable HTTPS frontend
# Uncomment the https-in frontend section and redirect in http-in

# Restart HAProxy
sudo systemctl restart haproxy
```

### Configure Backend

After the Kubernetes cluster is set up, update the `haproxy.cfg` file:

1. Find the Envoy Gateway NodePort:
   ```bash
   kubectl get svc -n nutritrack -l gateway.envoyproxy.io/owning-gateway-name=nutritrack-gateway
   ```

2. Replace `<ENVOY_GATEWAY_NODE_IP>` and `<ENVOY_GATEWAY_NODEPORT>` in `haproxy.cfg`

3. Restart HAProxy:
   ```bash
   sudo systemctl restart haproxy
   ```

---

## Docker Compose Testing (Single EC2)

Before deploying to Kubernetes, test the entire stack on a single EC2 instance using Docker Compose.

### Instance Requirements
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB gp3

### Security Groups

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HAProxy (HTTP) |
| 8404 | TCP | Your IP | HAProxy Stats |

### Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose (if not bundled)
sudo apt install -y docker-compose-plugin

# Clone repo
git clone <your-repo-url> ~/food-log
cd ~/food-log

# Copy and update environment file
cp .env .env.local
nano .env  # Update passwords and JWT_SECRET

# Build and start all services
docker compose build
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Test health endpoints
curl http://localhost/api/auth/health
curl http://localhost/api/food/health
curl http://localhost/api/macro/health
curl http://localhost/api/compliance/health

# View HAProxy stats
# Open http://<EC2_IP>:8404/stats in browser

# Stop all services
docker compose down

# Stop and delete all data
docker compose down -v
```

### Verify Database Init

```bash
# Connect to PostgreSQL
docker compose exec postgresql psql -U postgres -c "\l"

# Expected output should show:
#  auth_db
#  food_db
#  macro_db
#  compliance_db

# Verify users
docker compose exec postgresql psql -U postgres -c "\du"

# Expected users:
#  auth_user, food_user, macro_user, compliance_user
```

---

## Kubernetes EC2 Instances

### Master Node
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB gp3

### Worker Nodes (2+)
- **Instance Type**: t3.medium
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB gp3

### Security Groups (Internal)

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Management CIDR | SSH |
| 6443 | TCP | All nodes | K8s API |
| 2379-2380 | TCP | Master only | etcd |
| 10250-10252 | TCP | All nodes | Kubelet, Controller, Scheduler |
| 30000-32767 | TCP | HAProxy IP | NodePort services |
| 6783-6784 | TCP/UDP | All nodes | Weave CNI |
| 8472 | UDP | All nodes | Flannel VXLAN |
