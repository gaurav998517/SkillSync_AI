# SkillSync AI — Deployment Guide

## Stack
- **Backend**: Node.js + Express on **Render** or **Railway**
- **Database**: PostgreSQL on **NeonDB** (serverless, free tier available)
- **Frontend**: React/Vite on **Vercel**

---

## Step 1 — NeonDB Setup

### Create Account & Database
1. Go to [https://console.neon.tech](https://console.neon.tech) → **Sign up** (GitHub login works)
2. Click **"New Project"** → Name it `skillsync-ai` → Region: nearest to your server
3. A default database `neondb` is created automatically
4. Go to **Connection Details** → toggle **Pooled connection**

### Get Your Connection Strings

From the Neon dashboard:
- **Pooled URL** (for `DATABASE_URL` — used by your app queries):
  ```
  postgresql://USER:PASS@ep-XXX-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
  ```
- **Direct URL** (for `DIRECT_URL` — used by Prisma migrations only):
  ```
  postgresql://USER:PASS@ep-XXX.REGION.aws.neon.tech/neondb?sslmode=require
  ```

> [!IMPORTANT]
> The `DIRECT_URL` bypasses PgBouncer connection pooling. Prisma migrations **must** use the direct URL or they will fail.

### For Tests — Create a Second Database
In the Neon console → **Databases** → **New Database** → name it `skillsync_test`  
Get its direct URL and set it as `DATABASE_TEST_URL`.

---

## Step 2 — Run Prisma Migrations

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client from schema
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Optional: open Prisma Studio to browse your data
npx prisma studio
```

---

## Step 3 — Run Migration Script (Firestore → PostgreSQL)

> Only needed if you have existing data in Firestore.

```bash
# Dry run first — prints what would be migrated without writing anything
node backend/scripts/migrateFirestoreToPostgres.js --dry-run

# If dry run looks correct, run the real migration
node backend/scripts/migrateFirestoreToPostgres.js
```

The script is **idempotent** — safe to re-run after failures. It saves a `migration_checkpoint.json` to resume from where it stopped.

---

## Step 4 — Deploy Backend on Render

> [!IMPORTANT]
> `package.json` lives at the **repo root**, not inside `backend/`. Setting Root Directory to `backend` makes `npm install` fail with `ENOENT: package.json` on every deploy. Leave Root Directory blank/root.

A `render.yaml` Blueprint is included at the repo root with the correct settings below — see "Deploy via Blueprint" underneath. To configure manually instead:

1. Go to [https://render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo (`SkillSync_Ai`)
3. Configure:
   - **Root Directory**: *(leave blank — repo root)*
   - **Build Command**: `npm install && npx prisma generate --schema=backend/prisma/schema.prisma && npx prisma migrate deploy --schema=backend/prisma/schema.prisma`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. Add Environment Variables (from the Render dashboard):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default) |
| `DATABASE_URL` | Your NeonDB **pooled** connection string |
| `DIRECT_URL` | Your NeonDB **direct** connection string |
| `JWT_SECRET` | Generate: `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | `24h` |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | Your Groq API key |
| `FRONTEND_URL` | Your Vercel frontend URL |

5. Click **Deploy** — Render runs `prisma migrate deploy` on every deploy automatically via the build command.

### Deploy via Blueprint (recommended)

The repo root includes `render.yaml`. In Render, choose **New → Blueprint**, point it at this repo, and it will create the web service with the correct Root Directory/Build/Start commands pre-filled — you only need to fill in the secret env vars (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_URL`) marked `sync: false`.

> If you already have an existing manually-configured service, Blueprint sync only applies to services created *from* the Blueprint — update the existing service's settings by hand to match Step 4 above, or delete and recreate it via Blueprint.

---

## Step 5 — Deploy Backend on Railway (Alternative)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Add the same environment variables in the Railway dashboard.

Railway auto-detects Node.js and runs `npm start` from root package.json.

---

## Step 6 — Deploy Frontend on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-render-service.onrender.com/api
```

---

## Production Checklist

### Environment Variables
- [ ] `DATABASE_URL` is the **pooled** NeonDB URL with `?pgbouncer=true`
- [ ] `DIRECT_URL` is the **direct** NeonDB URL (no pgbouncer)
- [ ] `JWT_SECRET` is at least 64 chars (use `openssl rand -hex 64`)
- [ ] `NODE_ENV=production`
- [ ] Remove old Firebase env vars after migration is complete

### Database
- [ ] `npx prisma migrate deploy` ran successfully in CI/CD
- [ ] Prisma Studio shows all tables populated
- [ ] `ai_suggestions` entries have correct `expiresAt` timestamps

### Connection Pooling
NeonDB's built-in PgBouncer handles pooling automatically via the `?pgbouncer=true` query parameter. No additional pgBouncer setup required.

For high-traffic production, set `connection_limit` in the Prisma schema:
```prisma
datasource db {
  url = env("DATABASE_URL")
  // Add for Vercel/serverless environments:
  // url = "postgresql://...?sslmode=require&pgbouncer=true&connection_limit=1"
}
```

### Monitoring
- Neon dashboard: query metrics, connection count, storage usage
- Render: live logs, health checks at `/api/health`
- Add [Sentry](https://sentry.io) for error tracking in `src/middlewares/errorHandler.js`

### Backups
NeonDB **automatically takes point-in-time backups** on paid plans. On the free tier, export manually:
```bash
pg_dump "$(DATABASE_URL)" > backup_$(date +%Y%m%d).sql
```

## Troubleshooting Connection/TLS Errors

### Neon/Render Database Connection Issues
If you encounter database timeouts, DNS resolution errors, or the following error during deployment on Render:
```text
[DATABASE] Failed to connect to PostgreSQL: Error opening a TLS connection: OpenSSL error
```

This is caused by a combination of Render's DNS resolution bottlenecks and Prisma's strict hostname certificate validation (which is performed in Rust).

#### The Fix:
1. **Use direct IP routing:** Replace the Neon hostname (e.g. `ep-XXX.REGION.aws.neon.tech`) in your connection string with the direct AWS Neon endpoint IP (e.g., `3.0.167.45`).
2. **Bypass hostname TLS verification:** Because the SSL certificate is issued for `*.neon.tech` and not the IP address, you **must** append `sslmode=no-verify` and pass the endpoint parameter.

**Connection String Format:**
```text
postgresql://neondb_owner:PASSWORD@3.0.167.45/neondb?sslmode=no-verify&options=endpoint%3Dep-falling-poetry-aowzfr5x
```
*(Ensure to replace `PASSWORD` and `ep-falling-poetry-aowzfr5x` with your actual Neon credentials and endpoint name)*

---

## Scaling Recommendations

| Issue | Solution |
|---|---|
| High connection count | Enable NeonDB connection pooler (already done via `pgbouncer=true`) |
| Slow match queries | Add `GIN` index on `skills` array column |
| High AI suggestion volume | Increase `CACHE_DURATION_MS` in `aiSuggestionRepository.js` |
| Large resume uploads | Use S3/Cloudflare R2 for file storage instead of local disk |
| Heavy read load | Add Redis caching layer in front of `jobRepository.findAll()` |
