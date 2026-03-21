# BookStore — Cloud-Native Microservices Application

A simple bookstore built as four independent microservices with an API Gateway and Next.js frontend, deployed on **Azure Container Apps**.

---

## Architecture Overview

```
Frontend (Next.js)
       │
       ▼
  API Gateway :3000          ← single entry point, proxies all traffic
       │
  ┌────┼─────────────┬──────────────────┐
  ▼    ▼             ▼                  ▼
User  Book         Order          Notification
:3001 :3002        :3003              :3004
  │    │             │  ──calls──►      │
  │    └──calls──►   │                  │
  │                  └──calls──► Book   │
  └──calls──────────────────────────────┘
         (Order Service calls User via Notification)
```

### Service Responsibilities & Inter-Service Calls

| Service              | Port | Calls                                  |
|----------------------|------|----------------------------------------|
| **User Service**     | 3001 | → Order Service (fetch user's orders)  |
| **Book Service**     | 3002 | → User Service (get seller info)       |
| **Order Service**    | 3003 | → Book Service (check/reduce stock) → Notification Service (alert user) |
| **Notification Service** | 3004 | → User Service (enrich with user name) |
| **API Gateway**      | 3000 | Proxies all of the above               |

---

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Next.js 14 + Tailwind CSS
- **Containerisation**: Docker
- **Container Registry**: Azure Container Registry (ACR)
- **Deployment**: Azure Container Apps
- **CI/CD**: GitHub Actions
- **SAST**: SonarCloud (free tier)
- **Auth**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Non-root Docker user, IAM via Managed Identity

---

## Project Structure

```
bookstore/
├── api-gateway/                # Express proxy — routes to all services
│   ├── src/index.js
│   ├── Dockerfile
│   ├── .github/workflows/ci-cd.yml
│   └── sonar-project.properties
├── user-service/               # Auth, registration, profiles
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/auth.js
│   │   ├── routes/users.js
│   │   ├── middleware/auth.js
│   │   └── data/users.js
│   ├── openapi.yml
│   ├── Dockerfile
│   └── .github/workflows/ci-cd.yml
├── book-service/               # Book catalog + stock
│   ├── src/
│   ├── Dockerfile
│   └── .github/workflows/ci-cd.yml
├── order-service/              # Place & track orders
│   ├── src/
│   ├── Dockerfile
│   └── .github/workflows/ci-cd.yml
├── notification-service/       # In-app notifications
│   ├── src/
│   ├── Dockerfile
│   └── .github/workflows/ci-cd.yml
├── frontend/                   # Next.js UI
│   ├── src/app/
│   ├── Dockerfile
│   └── .github/workflows/ci-cd.yml
├── docker-compose.yml          # Local dev
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Run with Docker Compose

```bash
git clone <your-repo>
cd bookstore

# Start everything
docker compose up --build

# Services available at:
# Frontend:             http://localhost:4000
# API Gateway:          http://localhost:3000
# Health check:         http://localhost:3000/health
```

### Run each service individually

```bash
# In separate terminals:
cd user-service && cp .env.example .env && npm install && npm run dev
cd book-service && cp .env.example .env && npm install && npm run dev
cd order-service && cp .env.example .env && npm install && npm run dev
cd notification-service && cp .env.example .env && npm install && npm run dev
cd api-gateway && cp .env.example .env && npm install && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
```

---

## API Reference

### Authentication
```
POST /api/auth/register    { name, email, password }
POST /api/auth/login       { email, password }
POST /api/auth/verify      { token }
```

### Books (public read, admin write)
```
GET  /api/books             ?search=&category=
GET  /api/books/:id
POST /api/books             (admin JWT required)
POST /api/books/:id/reduce-stock  (internal API key)
```

### Orders (JWT required)
```
POST /api/orders            { bookId, quantity }
GET  /api/orders/my
GET  /api/orders/:id
```

### Notifications (JWT required)
```
GET   /api/notifications/my
PATCH /api/notifications/:id/read
```

### Demo credentials
```
Email:    admin@bookstore.com
Password: admin123
Role:     admin
```

---

## Azure Deployment Guide

### Step 1: Prerequisites

```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

az login
az account set --subscription "<your-subscription-id>"
```

### Step 2: Create Azure Resources

```bash
RESOURCE_GROUP="bookstore-rg"
LOCATION="eastus"
ACR_NAME="bookstoreacr"           # must be globally unique
ENVIRONMENT="bookstore-env"

# Resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Azure Container Registry (free tier: Basic)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Container Apps Environment
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 3: Build & Push Docker Images

```bash
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
az acr login --name $ACR_NAME

# Build and push each service
for SERVICE in user-service book-service order-service notification-service api-gateway; do
  docker build -t $ACR_LOGIN_SERVER/$SERVICE:latest ./$SERVICE
  docker push $ACR_LOGIN_SERVER/$SERVICE:latest
done
```

### Step 4: Deploy Container Apps

```bash
JWT_SECRET="your-strong-secret-here"
INTERNAL_KEY="your-internal-key-here"

# Deploy user-service
az containerapp create \
  --name user-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/user-service:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --target-port 3001 \
  --ingress internal \
  --env-vars JWT_SECRET=$JWT_SECRET INTERNAL_API_KEY=$INTERNAL_KEY \
  --min-replicas 1 --max-replicas 3

# Deploy book-service (internal)
az containerapp create \
  --name book-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/book-service:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --target-port 3002 \
  --ingress internal \
  --env-vars JWT_SECRET=$JWT_SECRET INTERNAL_API_KEY=$INTERNAL_KEY \
             USER_SERVICE_URL=http://user-service \
  --min-replicas 1 --max-replicas 3

# Deploy order-service (internal)
az containerapp create \
  --name order-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/order-service:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --target-port 3003 \
  --ingress internal \
  --env-vars JWT_SECRET=$JWT_SECRET INTERNAL_API_KEY=$INTERNAL_KEY \
             BOOK_SERVICE_URL=http://book-service \
             NOTIFICATION_SERVICE_URL=http://notification-service \
  --min-replicas 1 --max-replicas 3

# Deploy notification-service (internal)
az containerapp create \
  --name notification-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/notification-service:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --target-port 3004 \
  --ingress internal \
  --env-vars JWT_SECRET=$JWT_SECRET INTERNAL_API_KEY=$INTERNAL_KEY \
             USER_SERVICE_URL=http://user-service \
  --min-replicas 1 --max-replicas 3

# Deploy api-gateway (EXTERNAL — internet-facing)
az containerapp create \
  --name api-gateway \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/api-gateway:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --target-port 3000 \
  --ingress external \
  --env-vars USER_SERVICE_URL=http://user-service \
             BOOK_SERVICE_URL=http://book-service \
             ORDER_SERVICE_URL=http://order-service \
             NOTIFICATION_SERVICE_URL=http://notification-service \
  --min-replicas 1 --max-replicas 3

# Get the gateway URL
GATEWAY_URL=$(az containerapp show --name api-gateway --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "API Gateway: https://$GATEWAY_URL"
```

### Step 5: Deploy Frontend to Azure Static Web Apps

```bash
# In the Azure Portal, create a Static Web App and link it to your GitHub repo
# Set environment variable: NEXT_PUBLIC_API_URL=https://<your-gateway-fqdn>
# Or via CLI:

az staticwebapp create \
  --name bookstore-frontend \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/<your-org>/<your-repo> \
  --location eastus2 \
  --branch main \
  --app-location frontend \
  --output-location .next \
  --login-with-github
```

### Step 6: Configure GitHub Actions Secrets

In your GitHub repository, go to **Settings → Secrets → Actions** and add:

| Secret | Value |
|--------|-------|
| `REGISTRY_LOGIN_SERVER` | `bookstoreacr.azurecr.io` |
| `REGISTRY_USERNAME` | ACR admin username |
| `REGISTRY_PASSWORD` | ACR admin password |
| `AZURE_CREDENTIALS` | Output of `az ad sp create-for-rbac` |
| `AZURE_RESOURCE_GROUP` | `bookstore-rg` |
| `SONAR_TOKEN` | From SonarCloud project settings |
| `API_GATEWAY_URL` | `https://<gateway-fqdn>` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Azure portal |

```bash
# Generate AZURE_CREDENTIALS
az ad sp create-for-rbac \
  --name "bookstore-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/bookstore-rg \
  --sdk-auth
```

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| **JWT Authentication** | All user-facing endpoints require a signed JWT |
| **Internal API Key** | Service-to-service calls use a shared secret header `x-api-key` |
| **Helmet.js** | Sets security HTTP headers on all services |
| **CORS** | Restricted to known frontend origins |
| **Rate Limiting** | 100 req/15min globally, 20 req/15min on auth routes |
| **Input Validation** | express-validator on all POST endpoints |
| **Non-root Docker** | All containers run as a non-root `appuser` |
| **Least Privilege** | Internal services have `--ingress internal` (not internet-accessible) |
| **SAST** | SonarCloud scans on every push via GitHub Actions |
| **Secrets** | Stored as GitHub Actions secrets / Azure env vars, never in code |

---

## SonarCloud Setup

1. Sign up at [sonarcloud.io](https://sonarcloud.io) with your GitHub account (free)
2. Import your repository
3. Copy the **SONAR_TOKEN** to your GitHub secrets
4. Update `sonar.organization` in each `sonar-project.properties` file

---

## DevSecOps Flow

```
Push code
   │
   ▼
GitHub Actions
   ├── SonarCloud SAST scan  ← security vulnerabilities, code smells
   ├── npm ci + tests
   ├── Docker build
   ├── Push to ACR
   └── Deploy to Azure Container Apps
```
