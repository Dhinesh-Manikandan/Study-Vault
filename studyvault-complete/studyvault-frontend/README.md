# StudyVault — Setup Guide (Your Credentials)

## ✅ Already filled in for you
- Supabase Project URL
- Supabase Anon Key (Frontend)
- Database connection string (pooler for India region)

## ⚠️ Still needed — 2 things to collect

### 1. Database Password
Go to: https://supabase.com/dashboard/project/migeuxqmrcwhstifeysn/settings/database
→ Scroll to "Database password"
→ Click "Reset database password" if you forgot it
→ Copy and replace [YOUR-PASSWORD] in application.properties (2 places)

### 2. JWT Secret
Go to: https://supabase.com/dashboard/project/migeuxqmrcwhstifeysn/settings/api
→ Scroll down to "JWT Settings"
→ Copy "JWT Secret"
→ Replace YOUR_SUPABASE_JWT_SECRET in application.properties

### 3. Cloudinary (for file uploads)
Go to: https://cloudinary.com → Sign up free
→ Dashboard shows Cloud Name, API Key, API Secret
→ Replace the 3 cloudinary values in application.properties

---

## Run Locally (after filling credentials)

### Backend
```bash
cd studyvault-backend
mvn spring-boot:run
```
Runs at http://localhost:8080

### Frontend
```bash
cd studyvault-frontend
# Copy .env.example to .env.local (already filled with your Supabase values)
copy .env.example .env.local
npm install
npm start
```
Opens at http://localhost:3000

---

## Deploy to Vercel (Frontend)

```bash
cd studyvault-frontend
npm install -g vercel
vercel
```
In Vercel dashboard → add these env vars:
- REACT_APP_SUPABASE_URL = https://migeuxqmrcwhstifeysn.supabase.co
- REACT_APP_SUPABASE_ANON_KEY = eyJhbGci... (your anon key)
- REACT_APP_API_URL = https://your-railway-backend.up.railway.app/api

## Deploy to Railway (Backend)

1. Push studyvault-backend to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Add all application.properties values as env vars in Railway dashboard
4. Railway gives you a public URL — update REACT_APP_API_URL in Vercel

---

## Your Supabase Project
- Dashboard: https://supabase.com/dashboard/project/migeuxqmrcwhstifeysn
- Project ref: migeuxqmrcwhstifeysn
- Region: ap-south-1 (Mumbai — closest to India ✅)

