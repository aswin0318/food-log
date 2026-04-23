# Shared CI/CD Templates

This repo is scaffolded for reusable GitHub Actions templates.

Current structure:

- `.github/workflows/_ci-template.yml`
- `.github/workflows/_cd-template.yml`
- `.github/workflows/_docker-build.yml`
- `.github/workflows/_docker-publish.yml`
- `.github/workflows/_notify.yml`
- `.github/workflows/_sast.yml`
- `.github/workflows/_sca.yml`

Fill these templates with your organization-wide pipeline logic and call them from each microservice repository.
