# StudyVault Frontend

Frontend app for StudyVault.

## Local Run

```bash
cd studyvault-frontend
copy .env.example .env.local
npm install
npm start
```

Runs at `http://localhost:3000`.

## Environment Variable

- `REACT_APP_API_URL`:
  - Local: `http://localhost:8080/api`
  - Production: `https://<your-render-backend-domain>/api`

## Deployment

For complete deployment documentation (Vercel + Render + Supabase + Cloudinary), see:

- `../../README.md`

