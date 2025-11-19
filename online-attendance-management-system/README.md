# Online Attendance Management System

This is a Node.js + Express + PostgreSQL web application for managing classes, students, teachers, sessions, and attendance.

## Project structure

- `server.js` – Express server and API routes
- `db.js` / `schema.sql` – PostgreSQL database connection and schema
- `public/` – Frontend (HTML, CSS, JavaScript)

## Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL (v12+ recommended)

## Install and run locally

1. Install PostgreSQL and create a database:
```bash
createdb attendance
# Or using psql:
# psql -U postgres
# CREATE DATABASE attendance;
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional, defaults provided):
```bash
# For local development, you can set these or use defaults:
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=attendance
export DB_USER=postgres
export DB_PASSWORD=postgres
```

4. Start the server:
```bash
npm start
```

The database schema will be automatically initialized on first run.

Then open `http://localhost:3000` in your browser.

## Render Deployment

For Render deployment, the `DATABASE_URL` environment variable is automatically provided when you create a PostgreSQL database service. No additional configuration is needed.

## GitHub usage

1. Initialize a git repository (if not already):

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub.
3. Add the GitHub remote and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

The `.gitignore` file is configured to exclude `node_modules` from the repository.
