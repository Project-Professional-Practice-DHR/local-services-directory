# Local Services Directory

A comprehensive platform connecting users with verified local service professionals.

## Project Overview

The Local Services Directory facilitates finding, booking, and reviewing local service providers like plumbers, electricians, and other professionals. The platform features user authentication, service search, booking management, secure payments, and map integration.

## Team Structure

- Frontend Developer: [Deepak Pokhrel] - Responsible for UI/UX and client-side functionality
- Backend Developer: [Ritik Sah] - Responsible for API development and business logic
- Database Developer: [Hritik Kumar Sah] - Responsible for data modeling and database management

## Technology Stack

- Frontend: React.js, Redux, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL with Prisma ORM
- APIs: Google Maps, Stripe for payments

# Local Services Directory - Deployment & DevOps Guide

This documentation covers the deployment and DevOps setup for the Local Services Directory application.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Deployment Strategies](#deployment-strategies)
4. [Monitoring & Logging](#monitoring--logging)
5. [Database Backup Strategies](#database-backup-strategies)
6. [Error Handling & Reporting](#error-handling--reporting)

## Environment Setup

### Environment Variables

The application uses environment variables for configuration. Copy the `.env.example` file to create environment-specific configurations:

```bash
# Development
cp .env.example .env.development

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

### Environment-Specific Configuration

The application uses PM2's ecosystem configuration to manage environment-specific settings. See `ecosystem.config.js` for details.

### Docker Deployment

For containerized deployment:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions. The workflow is defined in `.github/workflows/ci-cd.yml`.

### Pipeline Stages

1. **Test**: Runs linting and tests against the codebase
2. **Build**: Creates a production build of the application
3. **Deploy to Staging**: Automatically deploys to staging when changes are pushed to the `develop` branch
4. **Deploy to Production**: Deploys to production when changes are pushed to the `main` branch (requires approval)

### Setting Up Secrets

The following secrets need to be configured in your GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
- `AWS_REGION`: AWS region for deployment
- `STAGING_INSTANCE_ID`: EC2 instance ID for staging server
- `PRODUCTION_INSTANCE_ID`: EC2 instance ID for production server

## Deployment Strategies

### Server Setup

1. Install Node.js, PM2, and Git on your server
2. Clone the repository
3. Install dependencies: `npm ci`
4. Build the application: `npm run build`
5. Start the application: `pm2 start ecosystem.config.js --env production`

### Using PM2

PM2 is used for process management:

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Monitor the application
pm2 monit

# View logs
pm2 logs

# Restart the application
pm2 restart local-services-api

# Reload with zero downtime
pm2 reload local-services-api
```

### Nginx Configuration

Nginx is used as a reverse proxy to the Node.js application. The configuration is in `nginx/conf.d/default.conf`.

## Monitoring & Logging

### Logging Setup

The application uses Winston for logging. Logs are stored in the `logs` directory.

- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only
- `logs/exceptions.log`: Uncaught exceptions
- `logs/rejections.log`: Unhandled promise rejections

### Metrics & Monitoring

Prometheus and Grafana are used for monitoring:

- Prometheus: Collects and stores metrics
- Grafana: Visualizes metrics and provides dashboards

Access the dashboards:
- Prometheus: `http://your-server-ip:9090`
- Grafana: `http://your-server-ip:3001`

### Health Checks

A health check endpoint is available at `/health`. It returns the status of the application and its dependencies.

## Database Backup Strategies

### Backup Schedule

Database backups are automated using cron jobs:

- Full backups: Daily at 2 AM
- Retention period: 14 days

### Backup Scripts

Two backup strategies are implemented:

1. **Standard PostgreSQL Backups**: Using `pg_dump` for full database backups (see `scripts/backup-database.sh`)
2. **Neon.tech Branch Backups**: For Neon.tech databases, using the API to create branch-based backups (see `scripts/neon-backup.js`)

### Backup Storage

Backups are stored:
- Locally in the `database_backups` directory
- Remotely in an S3 bucket (if AWS credentials are configured)

### Restore Process

To restore a backup:

```bash
# For standard PostgreSQL backups
gunzip -c database_backups/backup_filename.sql.gz | psql -h hostname -U username -d database_name

# For Neon.tech
# Use the Neon console to restore from a branch backup
```

## Error Handling & Reporting

### Error Middleware

The application uses a centralized error handling middleware that:
- Standardizes error responses
- Logs errors with appropriate severity
- Reports critical errors to Sentry (in production)

### Sentry Integration

In production, errors are tracked using Sentry:
- Automatically captures exceptions
- Provides error grouping and notification
- Tracks error frequency and impact

To configure Sentry, set the `SENTRY_DSN` environment variable.

### Alerting

Critical errors trigger alerts through:
- Sentry notifications
- Email alerts to administrators
- Custom alert scripts (see `scripts/alert.sh`)

## Security Considerations

### SSL/TLS

All production traffic is encrypted using SSL/TLS:
- Certificates are managed through Let's Encrypt
- HTTPS is enforced via Nginx redirects
- Modern cipher suites are used for maximum security

### Firewall Configuration

The server is protected by a firewall that allows only necessary ports:
- 80/443: HTTP/HTTPS
- 22: SSH (restricted to specific IP ranges)

### Regular Updates

Security updates are applied regularly:
- OS patches: Automated using unattended-upgrades
- Dependencies: Monitored and updated using npm audit

## Setup Instructions

[To be added]

local-services-directory/
├── backend/                  # Backend code (Node.js/Express)
│   ├── config/               # Configuration files
│   │   ├── app.config.js     # Application configuration
│   │   ├── database.js       # Database configuration (Sequelize)
│   ├── src/
│   │   ├── controllers/      # Controller functions
│   │   ├── middleware/       # Middleware (auth, validation, etc.)
│   │   │   └── security.middleware.js
│   │   ├── models/           # Database models
│   │   │   └── User.js
│   │   ├── routes/           # API routes
│   │   │   ├── admin/        # Admin routes
│   │   │   └── api/          # Public API routes
│   │   └── utils/            # Utility functions
│   │       └── logger.js
│   ├── .env                  # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Main server file
│
└── frontend/                 # Frontend code (React)
    ├── public/               # Static files
    ├── src/
    │   ├── api/              # API modules for backend communication
    │   │   ├── auth.js
    │   │   ├── axios.js
    │   │   ├── bookings.js
    │   │   ├── providers.js
    │   │   ├── reviews.js
    │   │   ├── services.js
    │   │   └── users.js
    │   ├── components/       # Reusable UI components
    │   │   ├── auth/         # Authentication components
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── ProviderRoute.jsx
    │   │   ├── bookings/     # Booking-related components
    │   │   │   ├── BookingCard.jsx
    │   │   │   ├── BookingForm.jsx
    │   │   │   └── BookingList.jsx
    │   │   ├── reviews/      # Review-related components
    │   │   │   ├── ReviewCard.jsx
    │   │   │   ├── ReviewForm.jsx
    │   │   │   └── ReviewList.jsx
    │   │   ├── services/     # Service-related components
    │   │   │   ├── ServiceCard.jsx
    │   │   │   ├── ServiceFilters.jsx
    │   │   │   └── ServiceGrid.jsx
    │   │   └── ui/           # UI elements
    │   │       ├── Alert.jsx
    │   │       ├── Button.jsx
    │   │       ├── Card.jsx
    │   │       ├── Input.jsx
    │   │       └── Select.jsx
    │   ├── contexts/         # React context providers
    │   │   └── AuthContext.jsx
    │   ├── layouts/          # Page layout components
    │   │   ├── AdminLayout.jsx
    │   │   └── MainLayout.jsx
    │   ├── pages/            # Page components
    │   │   ├── admin/        # Admin pages
    │   │   │   ├── AdminDashboardPage.jsx
    │   │   │   ├── AdminServicesPage.jsx
    │   │   │   ├── AdminUsersPage.jsx
    │   │   │   └── AdminReviewsPage.jsx
    │   │   ├── BookingConfirmationPage.jsx
    │   │   ├── BookingPage.jsx
    │   │   ├── ChangePasswordPage.jsx
    │   │   ├── EditProfilePage.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── ProviderBookingsPage.jsx
    │   │   ├── ProviderDashboardPage.jsx
    │   │   ├── ProviderServiceFormPage.jsx
    │   │   ├── ProviderServicesPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── SearchPage.jsx
    │   │   ├── ServiceDetailPage.jsx
    │   │   └── UserBookingsPage.jsx
    │   ├── utils/            # Utility functions
    │   │   └── formatters.js # Date, currency formatters, etc.
    │   ├── App.jsx           # Main App component with routing
    │   ├── index.css         # Global styles
    │   └── index.js          # Entry point
    ├── .env                  # Environment variables
    ├── .gitignore
    └── package.json
