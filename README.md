# StudyVault

StudyVault is a full-stack learning and resource management app where users can:

- Organize content in nested folders
- Save notes, links, images, PDFs, and YouTube resources
- Tag important/confusing/revision items
- Track exam schedules and revision priorities
- Search quickly across all saved resources

This repository contains both frontend and backend projects.

## Project Structure

```text
Study-Vault/
	studyvault-complete/
		studyvault-frontend/   # React app (Vercel)
		studyvault-backend/    # Spring Boot API (Render)
```

## Tech Stack

- Frontend: React, React Router, Axios, CSS
- Backend: Spring Boot 3, Spring Security (JWT), Spring Data JPA
- Database: PostgreSQL (recommended: Supabase)
- File Storage: Cloudinary (for image/PDF uploads)
- Deployment:
	- Frontend -> Vercel
	- Backend -> Render (Docker runtime)
	- Database -> Supabase PostgreSQL (or Render Postgres)

## Key Features

- Auth with signup/login and JWT
- Nested folders and items
- Item types: YouTube, PDF, Image, Link, Note
- Starred items and revision items pages
- Search by query/type/tag
- Profile with credential updates and account data deletion
- Dedicated support page and support contact flow

## Local Development

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.9+
- PostgreSQL (local or cloud)
- Cloudinary account (required for image/PDF uploads)

### 1. Backend

```bash
cd studyvault-complete/studyvault-backend
mvn spring-boot:run
```

Backend default: `http://localhost:8080`

### 2. Frontend

```bash
cd studyvault-complete/studyvault-frontend
copy .env.example .env.local
npm install
npm start
```

Frontend default: `http://localhost:3000`

### Frontend Environment Variable

- `REACT_APP_API_URL=http://localhost:8080/api` (for local)

## Backend Configuration

Backend configuration is env-driven via:

- `studyvault-complete/studyvault-backend/src/main/resources/application.properties`

### Required Backend Environment Variables

#### Database

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

#### Auth

- `APP_JWT_SECRET` (use a strong random secret, 32+ chars)
- `APP_JWT_EXPIRATION_MS` (example: `604800000`)

#### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### CORS

- `APP_CORS_ALLOWED_ORIGINS`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` (recommended: `https://*.vercel.app`)

#### Optional Seed (normally disabled in production)

- `APP_AUTH_SEED_ENABLED=false`
- `APP_AUTH_SEED_USER_ID`
- `APP_AUTH_SEED_USERNAME`
- `APP_AUTH_SEED_PASSWORD`

## Deployment Guide (Detailed)

## 1. Deploy Backend on Render

Because this project is Java/Spring Boot and your Render account uses Docker runtime, deploy backend with Docker.

### Backend Service Settings (Render)

- Service type: Web Service
- Runtime: Docker
- Root Directory: `studyvault-complete/studyvault-backend`
- Build/Start commands: leave empty (Render uses Dockerfile)

The backend Dockerfile is in:

- `studyvault-complete/studyvault-backend/Dockerfile`

### Render Backend Environment Variables

Set the following in Render service -> Environment:

- `SPRING_DATASOURCE_URL` or Render's `DATABASE_URL` / `JDBC_DATABASE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `APP_JWT_EXPIRATION_MS=604800000`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.vercel.app`
- `APP_AUTH_SEED_ENABLED=false`

Then redeploy backend.

### Render Backend URL

After successful deploy, you'll have a URL like:

- `https://your-backend.onrender.com`

Use this later in Vercel as `REACT_APP_API_URL=https://your-backend.onrender.com/api`.

## 2. Database (Supabase Recommended)

You do not need Render Postgres if you already use Supabase.

### Supabase -> JDBC values

From Supabase connection details, convert to JDBC format:

```text
jdbc:postgresql://HOST:PORT/postgres?sslmode=require
```

Common direct-host pattern:

```text
jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

If direct host connectivity fails from Render, use Supabase pooler:

```text
jdbc:postgresql://aws-1-<region>.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
```

Pooler username format can be:

- `postgres.<project-ref>`

### Render DB env mapping

- `SPRING_DATASOURCE_URL=<jdbc-url>`
- or `DATABASE_URL=postgres://...` from Render Postgres / `JDBC_DATABASE_URL=jdbc:postgresql://...`
- `SPRING_DATASOURCE_USERNAME=<supabase-db-user>`
- `SPRING_DATASOURCE_PASSWORD=<supabase-db-password>`

## 3. Configure Cloudinary

Cloudinary is required for file uploads (images and PDFs).

Without Cloudinary, upload features will fail.

### Cloudinary steps

1. Create/login to Cloudinary
2. Open Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Set in Render backend env:
	 - `CLOUDINARY_CLOUD_NAME`
	 - `CLOUDINARY_API_KEY`
	 - `CLOUDINARY_API_SECRET`
5. Redeploy backend

## 4. Deploy Frontend on Vercel

### Vercel settings

- Root project/folder: `studyvault-complete/studyvault-frontend`
- Build command: `npm run build`
- Output directory: `build`

This repo includes:

- `studyvault-complete/studyvault-frontend/vercel.json`

### Vercel environment variable

Set for Production + Preview + Development:

- `REACT_APP_API_URL=https://your-backend.onrender.com/api`

Then redeploy frontend.

## 5. CORS Checklist

If browser shows CORS/preflight errors, verify Render backend env:

- `APP_CORS_ALLOWED_ORIGINS` includes your stable Vercel domain
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.vercel.app`

Example:

```text
APP_CORS_ALLOWED_ORIGINS=https://study-vault-rust.vercel.app,http://localhost:3000
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.vercel.app
```

## 6. Post-Deploy Verification

After deployment:

1. Open frontend URL
2. Login/signup works
3. Create folder/item works
4. Upload image/PDF works
5. Search and revision pages load
6. Browser network calls hit `https://your-backend.onrender.com/api/...`

## Common Deployment Issues

### 1. Old Railway URL still used

Symptom: frontend requests `*.up.railway.app`.

Fix: update Vercel `REACT_APP_API_URL`, then redeploy.

### 2. Backend fails with `YOUR_DB_HOST` / `YOUR_DB_PORT`

Cause: placeholder env values left in Render.

Fix: set real Supabase/Render DB values.

### 3. `Network is unreachable` to Supabase

Fix: switch to Supabase pooler URL and pooler username.

### 4. Upload fails

Fix: verify Cloudinary env vars and redeploy backend.

## Security Notes

- Never commit real secrets to git
- Rotate any secret that was exposed accidentally:
	- DB password
	- Cloudinary API secret
	- JWT secret
- Keep `APP_AUTH_SEED_ENABLED=false` in production

## Support

- Support email: `support.dhinesh@gmail.com`
- In-app support page: `/support`