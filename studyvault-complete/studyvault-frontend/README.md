# StudyVault Frontend

## Run locally

```bash
cd studyvault-frontend
copy .env.example .env.local
npm install
npm start
```

App runs at `http://localhost:3000`.

## Deploy frontend to Vercel

1. Import this frontend folder in Vercel: `studyvault-complete/studyvault-frontend`.
2. Keep build settings as default CRA:
	- Build command: `npm run build`
	- Output directory: `build`
3. Add environment variable in Vercel project settings:
	- `REACT_APP_API_URL=https://<your-render-backend-domain>/api`
4. Deploy and note your Vercel domain (for backend CORS).

## Deploy backend + DB to Render

1. Create a **PostgreSQL** database in Render.
2. Create a **Web Service** from `studyvault-complete/studyvault-backend`.
3. Use these Render settings:
	- Language/runtime: `Docker`
	- Root Directory: `studyvault-complete/studyvault-backend`
	- Build/start commands: leave empty (Render uses `Dockerfile`)
4. Add backend environment variables in Render:
	- `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<render-db-host>:<render-db-port>/<render-db-name>?sslmode=require&prepareThreshold=0`
	- `SPRING_DATASOURCE_USERNAME` = `<render-db-user>`
	- `SPRING_DATASOURCE_PASSWORD` = `<render-db-password>`
	- `APP_JWT_SECRET` = `<long-random-secret-at-least-32-chars>`
	- `APP_JWT_EXPIRATION_MS` = `604800000`
	- `CLOUDINARY_CLOUD_NAME` = `<cloudinary-cloud-name>`
	- `CLOUDINARY_API_KEY` = `<cloudinary-api-key>`
	- `CLOUDINARY_API_SECRET` = `<cloudinary-api-secret>`
	- `APP_CORS_ALLOWED_ORIGINS` = `https://<your-vercel-domain>,http://localhost:3000`
	- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` = `https://*.vercel.app`
	- `APP_AUTH_SEED_ENABLED` = `false`
5. Deploy backend and copy the Render service URL.
6. Update Vercel `REACT_APP_API_URL` to that backend URL + `/api`.

## Notes

- Frontend API base URL is read from `REACT_APP_API_URL`.
- Backend runtime config is now env-driven through `application.properties`.

