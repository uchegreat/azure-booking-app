# Azure Booking App

A containerized booking application deployed on Azure Kubernetes Service (AKS) with automated CI/CD using GitHub Actions. The app uses PostgreSQL as its database and runs in Docker containers orchestrated by Kubernetes.

## Overview

This project demonstrates a full cloud-native stack:

- **Application**: Node.js/Express booking API + frontend
- **Containerization**: Docker image for the app
- **Container registry**: Azure Container Registry (ACR)
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Database**: Azure Database for PostgreSQL (Flexible Server)
- **CI/CD & Automation**: GitHub Actions workflow that builds, pushes, and deploys on every push to `main`

## Architecture

- **Frontend / API**: Single Node.js app serving the UI and REST endpoints.
- **Database**: PostgreSQL database (`bookingdb`) on Azure Database for PostgreSQL.
- **Container image**: Built from `Dockerfile` and stored in  
  `acrgreatbookingapp.azurecr.io/azure-booking-app`.
- **Kubernetes**:
  - `Deployment` for the app pods.
  - `Service` (LoadBalancer) to expose the app publicly.
  - `Secret` for the database connection string.
- **CI/CD**:
  - GitHub Actions workflow: `.github/workflows/deploy.yml`
  - On each push to `main`:
    - Builds the Docker image
    - Pushes it to ACR
    - Deploys the updated image to AKS

## Repository Structure

- `Dockerfile` – Docker image definition for the app  
- `server.js` – Node.js server (API + static frontend)  
- `aks-deployment.yaml` – Kubernetes Deployment and Service  
- `k8s/db-secret-fixed.yaml` – Kubernetes Secret with `CONNECTION_STRING` for PostgreSQL  
- `.github/workflows/deploy.yml` – CI/CD pipeline for automated build and deployment  

## Prerequisites

To run or modify this project locally, you need:

- Node.js (for local development)
- Docker
- Azure CLI
- `kubectl` (for interacting with AKS)

## Running Locally

### With Docker

```bash
docker build -t azure-booking-app .
docker run -e CONNECTION_STRING="your-postgres-connection-string" -p 3000:3000 azure-booking-app
```

Then open: `http://localhost:3000`

### Without Docker (Node.js only)

```bash
npm install
set CONNECTION_STRING=your-postgres-connection-string
node server.js
```

Then open: `http://localhost:3000`

## Azure Resources

All resources are in the same subscription and resource group:

- **Resource group**: `rg-booking-app`
- **AKS cluster**: `aks-booking-app`
- **Container registry**: `acrgreatbookingapp`  
  Login server: `acrgreatbookingapp.azurecr.io`
- **PostgreSQL server**: `pgbooking133.postgres.database.azure.com`
- **Database**: `bookingdb`

The app connects to PostgreSQL using the `CONNECTION_STRING` environment variable, which is provided via a Kubernetes Secret.

## Kubernetes Deployment

### Secret

The database connection string is stored in a Kubernetes Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  CONNECTION_STRING: "postgres://pgadmin:***@pgbooking133.postgres.database.azure.com:5432/bookingdb?sslmode=require"
```

### Deployment & Service

`aks-deployment.yaml` defines:

- A `Deployment` named `azure-booking-app`:
  - Pulls the image from ACR
  - Sets `CONNECTION_STRING` from the `db-secret`
  - Runs the app on port `3000`
- A `Service` of type `LoadBalancer`:
  - Exposes the app on port `80`
  - Routes traffic to the app pods

Apply manually (if not using CI/CD):

```bash
kubectl apply -f k8s/db-secret-fixed.yaml
kubectl apply -f aks-deployment.yaml
```

Check status:

```bash
kubectl get deployments
kubectl get pods
kubectl get svc
kubectl logs -l app=azure-booking-app
```

## CI/CD with GitHub Actions

The workflow in `.github/workflows/deploy.yml` runs on every push to the `main` branch.

### What the pipeline does

On each push to `main`:

1. Checks out the code.
2. Logs into Azure using the `AZURE_CREDENTIALS` secret.
3. Logs into ACR using `ACR_USERNAME` and `ACR_PASSWORD`.
4. Builds the Docker image tagged with the commit SHA.
5. Pushes the image to `acrgreatbookingapp.azurecr.io`.
6. Sets the AKS context for `aks-booking-app`.
7. Updates `aks-deployment.yaml` with the new image tag.
8. Applies the updated deployment to AKS.

### Required GitHub Secrets

In GitHub → Settings → Secrets and variables → Actions, configure:

- `AZURE_CREDENTIALS` – Service principal JSON for Azure login  
- `ACR_USERNAME` – ACR username  
- `ACR_PASSWORD` – ACR password  

These secrets enable fully automated build and deployment with no manual steps.

### Triggering a Deployment

Any push to `main` triggers a new deployment:

```bash
git add .
git commit -m "Your changes"
git push
```

GitHub Actions will automatically:

- Build a new Docker image
- Push it to ACR
- Deploy it to AKS

You can monitor runs under the **Actions** tab in your GitHub repository.

## Database

- **Engine**: PostgreSQL (Azure Database for PostgreSQL – Flexible Server)
- **Server**: `pgbooking133.postgres.database.azure.com`
- **Database**: `bookingdb`
- **Usage**: Stores booking records (name, email, date).

The app reads the connection string from the `CONNECTION_STRING` environment variable, which is injected via the Kubernetes Secret. No credentials are hardcoded in the repository.

## Automation Summary

- **Build automation**: Docker image built on every commit.
- **Deployment automation**: New image automatically rolled out to AKS.
- **Secrets management**: Database credentials stored in Kubernetes Secrets, not in code.
- **Infrastructure**: All Azure resources (AKS, ACR, PostgreSQL) are managed via Azure CLI/Portal and used by the automated pipeline.

- ## Screenshots

### Booking form

![Booking form](images/Screenshot%202026-07-30%20193338.png)

### Booking list

![Booking list](images/Screenshot%202026-07-30%20193406.png)





