# Platform Deployments

This repo groups shared deployment assets:

- `microservices/`: Helm charts for application services
- `infrastructure/`: shared infra charts and manifests
- `argocd-apps/`: Argo CD application scaffolding for future use
- `raw-k8s/`: existing raw Kubernetes manifests
- `scripts/`: deployment helper scripts

Suggested future split inside this repo:

- keep reusable infra under `infrastructure/`
- keep service charts under `microservices/`
- add Argo CD apps, projects, and infra overlays under `argocd-apps/`
