# app-volley-registration - Volleyball Event Management System

## Overview
A full-stack web application for managing volleyball game registrations, groups, payments, and events. Features separate frontend (React) and backend (PHP) with a two-stage deployment workflow.

## Tech Stack
- **Frontend**: React + Vite (in `frontend/`)
- **Backend**: Native PHP (in `api/`)
- **Database**: MySQL
- **Deployment**: PowerShell scripts for staging/production

## Project Structure
```
app-volley-registration/
├── frontend/              # React application
│   ├── src/               # Source code
│   ├── dist/              # Production build
│   └── package.json
├── api/                   # PHP backend
│   ├── config.php         # Configuration
│   ├── secrets.php        # Database credentials (gitignored)
│   ├── db.php             # Database connection
│   ├── auth.php           # Authentication logic
│   ├── login.php          # Login endpoint
│   ├── register.php       # Registration endpoint
│   ├── events.php         # Events CRUD
│   ├── groups.php         # Groups management
│   ├── register_event.php # Event registration logic
│   └── admin_*.php        # Admin endpoints
├── database.sql           # Database schema
├── *.sql                  # Migration scripts
├── deploy/                # Production deployment package
├── deploy-staging/        # Staging deployment package
├── prepare-deploy.ps1     # Production deploy script
└── prepare-deploy-staging.ps1  # Staging deploy script
```

## Environments
- **Production**: volley.godeliauskas.com
- **Staging**: staging.godeliauskas.com

## Commands
```bash
# Frontend
cd frontend
npm install
npm run dev              # Development server
npm run build            # Build for production

# Deployment
./prepare-deploy-staging.ps1   # Deploy to staging
./prepare-deploy.ps1           # Deploy to production
```

## Key Features
- **User Management**: Registration, login, role-based access (Super Admin, Group Admin, User)
- **Event System**: Create events, manage registrations, waitlists
- **Wallet System**: Balance top-up, payment tracking, deposits
- **Group Management**: Create/join groups, group-specific events
- **Admin Panel**: User management, event finalization, statistics

## Setup
1. **Database**: Import `database.sql` into MySQL
2. **Backend**: Copy `api/secrets.example.php` to `api/secrets.php` and configure
3. **Frontend**: Run `npm install && npm run dev` in `frontend/`

## Development Notes
- Default admin: `admin@volleyapp.com` / `admin123` (change in production!)
- API uses JWT-like session tokens
- All admin endpoints prefixed with `admin_`
- Staging environment has separate config (`config-staging.php`)
