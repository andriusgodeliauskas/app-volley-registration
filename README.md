# Volley Registration App

A web application to manage volleyball game registrations, groups, payments, and events.

## Features
- User Authentication (Login/Register)
- Group & Event Management
- Registration System (Register, Waitlist, Cancel)
- Wallet System (Top-up, Balance Tracking)
- Role-based Access (Super Admin, Group Admin, User)

## Setup & Installation

### 1. Database Setup
1. Create a MySQL database (e.g., `volley_db`).
2. Import the `database.sql` file into your database.
3. **Note**: The default super admin login is `admin@volleyapp.com` / `admin123`. Change this immediately in production.

### 2. Backend Configuration
1. Navigate to the `api/` directory.
2. Rename `secrets.example.php` to `secrets.php`.
3. Open `secrets.php` and update the database credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).
4. **Security Note**: `secrets.php` is git-ignored and should NEVER be committed to the repository.

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Repository Structure
- `api/`: PHP backend endpoints and logic.
- `frontend/`: React frontend application.
- `database.sql`: Database schema and seed data.
