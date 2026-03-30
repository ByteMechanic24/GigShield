## Render Deployment

This repo is ready for a staged Render deployment with these services:

- `gigshield-backend`
- `gigshield-soft-hold-worker`
- `gigshield-ml-service`
- `gigshield-mock-apis`
- `gigshield-worker-app`
- `gigshield-admin-app`

### Recommended topology

- Keep MongoDB on Atlas
- Use a hosted Redis URL for background jobs and cache
- Deploy backend, ML service, and mock APIs as Render web services
- Deploy the soft-hold poller as a Render worker
- Deploy worker and admin frontends as Render static sites

### Before you create services

You need:

- GitHub repo connected to Render
- MongoDB Atlas URI
- Redis URL
- Google Weather API key
- admin API key

### Service env vars

#### Backend

- `NODE_ENV=production`
- `PORT=8000`
- `MONGODB_URI`
- `MONGODB_DB_NAME=gigshield_dev`
- `REDIS_URL`
- `ML_SERVICE_URL`
- `PLATFORM_API_URL`
- `ADMIN_API_KEY`
- `GOOGLE_WEATHER_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `ENABLE_SEED=false`
- `ALLOW_PRODUCTION_SEED=false`

#### Soft-hold worker

- `NODE_ENV=production`
- `MONGODB_URI`
- `MONGODB_DB_NAME=gigshield_dev`
- `REDIS_URL`
- `ML_SERVICE_URL`
- `PLATFORM_API_URL`
- `GOOGLE_WEATHER_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `ENABLE_SEED=false`
- `ALLOW_PRODUCTION_SEED=false`

#### Worker frontend

- `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api/v1`

#### Admin frontend

- `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api/v1`

### Deploy with Blueprint

1. Push this repo to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select the repo containing this project.
4. Render will read [render.yaml](/C:/Guidewire_Hackathon/gigshield/render.yaml).
5. Fill in all `sync: false` environment variables.
6. Create the stack.

### Important notes

- The frontends are now env-based and no longer require same-origin `/api`.
- The admin app and worker app should each get their own static-site URL.
- The backend uses open CORS right now, which is acceptable for staging/demo but should be restricted before a real public launch.
- The mock API service is still part of the demo architecture and is required for order verification in the current MVP.

### Suggested Render order

1. `gigshield-ml-service`
2. `gigshield-mock-apis`
3. `gigshield-backend`
4. `gigshield-soft-hold-worker`
5. `gigshield-worker-app`
6. `gigshield-admin-app`
