# CareNet Web Application

CareNet is a full-stack care services web application for connecting clients with caregivers, managing bookings, tracking assignments and tasks, handling subscriptions and payments, and supporting admin reporting workflows.

This repository contains:

- A React + Vite frontend in `carenet-frontend`
- A Spring Boot backend in `carenet-backend`

## Overview

CareNet supports the core workflows of a caregiver marketplace and service management platform:

- Client and caregiver registration
- Email verification with OTP
- Caregiver discovery and profile browsing
- Booking and assignment creation
- Task and proof tracking during active care assignments
- Subscription-aware features
- Payment, billing history, and receipt flows
- Admin dashboards, reviews, reports, and management screens

## Repository Structure

```text
.
├── carenet-frontend/   # React/Vite application
├── carenet-backend/    # Spring Boot REST API
└── README.md
```

## Tech Stack

### Frontend

- React 19
- Vite 7
- React Router
- Tailwind CSS
- Lucide React
- Recharts

### Backend

- Java 17
- Spring Boot 3
- Spring Web
- Spring Data JPA
- MySQL
- Spring Mail
- PDFBox / iText
- ZXing

## Main Features

### Client Experience

- Register and verify account
- Browse caregivers by service type and pricing
- Create bookings
- View dashboard metrics and recent assignments
- Manage task verification for active assignments
- View billing and payment history
- Subscribe to premium features

### Caregiver Experience

- Register and create caregiver profile
- Upload caregiver-related documents
- View caregiver dashboard
- Track assignment activity
- Upload task proof
- View public caregiver profile

### Admin Experience

- Admin dashboard overview
- User and caregiver management
- Task and service request monitoring
- Payment management
- Reviews and reports
- Security and settings screens

## Applications

### Frontend

Location: `carenet-frontend`

Available scripts:

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build
- `npm run preview` previews the production build
- `npm run lint` runs ESLint

Default frontend URL:

- `http://localhost:5173`

### Backend

Location: `carenet-backend`

Common commands:

- `./mvnw spring-boot:run`
- `./mvnw test`
- `./mvnw clean package`

Default backend URL:

- `http://localhost:8091`

## Local Development Setup

### 1. Start the backend

The backend expects a MySQL database by default.

From `carenet-backend`:

```bash
./mvnw spring-boot:run
```

The backend development notes are in [carenet-backend/README-dev.md](/Users/sbwaxan/website/carenet-backend/README-dev.md).

### 2. Start the frontend

From `carenet-frontend`:

```bash
npm install
npm run dev
```

If needed, configure the frontend API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8091
```

## Configuration

### Frontend

The frontend reads the backend base URL from:

- `VITE_API_BASE_URL`

If not set, it defaults to:

- `http://localhost:8091`

### Backend

The backend configuration currently lives in:

- `carenet-backend/src/main/resources/application.properties`

Typical configuration areas:

- Server port
- Datasource URL and credentials
- JPA settings
- Mail settings
- Multipart upload limits

## API Areas

The backend is organized around these main endpoint groups:

- `/auth` for login, registration, OTP, and logout
- `/service` for caregiver search, profile access, and booking flows
- `/activity` for task and assignment activity
- `/dashboard` for user and caregiver dashboards
- `/profile` for user and caregiver profile management
- `/subscribe` for subscription operations
- `/api/payments` for payments, receipts, refunds, and payment history
- `/reports` for analytics and PDF report generation
- `/admin` for admin-facing operations

## Build Status

Current repository state based on local inspection:

- Frontend production build works
- Frontend linting currently reports existing issues that should be cleaned up
- Backend test execution depends on local Maven cache and environment access

## Known Project Notes

- The repository contains both frontend and backend applications in one workspace.
- There are some duplicate legacy UI files under `src/components/carnet/...` alongside the main `src/pages/...` structure in the frontend.
- The backend includes development-oriented defaults and sample data loader behavior.
- Before deploying or sharing outside local development, configuration and security hardening should be reviewed carefully.

## Recommended Development Workflow

1. Start MySQL and verify backend datasource settings
2. Start the Spring Boot backend
3. Start the Vite frontend
4. Use the frontend against the local backend on port `8091`
5. Run `npm run build` and backend tests before finalizing changes

## Deployment Readiness

Before treating this as production-ready, review:

- Secret management
- Authentication and authorization strategy
- Environment-specific configuration
- Database migration strategy
- Logging and monitoring
- Test coverage

## Contributing

Suggested contribution flow:

1. Make changes in the relevant app directory
2. Validate frontend build and lint status
3. Validate backend compilation and tests
4. Document any environment or API changes

## License

No license is currently defined in this repository.
