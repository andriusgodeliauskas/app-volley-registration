# app-volley-registration Analysis

## Overview
A full-stack web application for managing volleyball registrations, events, and payments. It features a separate frontend and backend architecture with a robust deployment workflow.

## Tech Stack
- **Frontend**: React (in `frontend/` directory).
- **Backend**: Native PHP (in `api/` directory).
- **Database**: MySQL.
- **Infrastructure**: PowerShell deployment scripts for Staging/Production.

## Structure
- `frontend/`: React client application.
- `api/`: PHP backend endpoints.
- `database.sql`: Database schema and initial data.
- `deploy/` & `deploy-staging/`: Deployment artifacts.
- `*.ps1`: Automated deployment scripts.

## Key Features
- **User Management**: Registration, Authentication, Roles (Admin, Group Admin, User).
- **Financials**: Wallet system with top-up and balance tracking.
- **Event Logic**: Game registration, waitlists, and cancellations.
- **DevOps**: Defined staging vs. production environments with automated deployment scripts.

## Setup & Run
1. **Database**: Import `database.sql` to MySQL.
2. **Backend**: Configure `api/secrets.php` (rename from example).
3. **Frontend**:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Development Workflow
**IMPORTANT**: Before starting any programming task, you must:
1. Prepare a detailed plan of the work to be done.
2. Present this plan to the user.
3. Wait for and obtain explicit confirmation from the user before proceeding with the code changes.
