# Platform Deployments

This repo is the Kubernetes deployment source for the repo-ready NutriTrack split.

## Layout

- `values.yaml`: single global Helm values file for the full platform
- `microservices/`: per-service Helm charts
- `infrastructure/postgresql/`: shared PostgreSQL chart
- `infrastructure/envoy-gateway/`: Gateway API resources with backend refs driven from `values.yaml`
- `infrastructure/bootstrap/`: namespace bootstrap manifest reference
- `raw-k8s/`: plain manifest reference copies
- `scripts/deploy.sh`: installs the stack into a kubeadm or any CNCF Kubernetes cluster
- `scripts/build-images.sh`: optional helper that builds images from sibling repo-ready service folders

## Expected Repo Split

When you split `repo-ready/` into independent repositories, keep this repo as the place where:

- image repositories and tags are managed
- namespace, gateway, and shared infra are managed
- inter-service backend references stay consistent

## Deploy

1. Push service images to a registry and update `values.yaml`.
2. Replace every placeholder password and JWT secret in `values.yaml`.
3. Install Gateway API and Envoy Gateway in the cluster if they are not already present.
4. Run `./scripts/deploy.sh <namespace>`.

The deploy script creates the namespace, installs PostgreSQL, deploys all backend services, deploys the frontend, and then installs the Envoy Gateway routing resources.
