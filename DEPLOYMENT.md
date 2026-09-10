# Production deployment

## Architecture

Deploy the two Vite SPAs to Vercel as separate projects. Deploy `server` to a persistent Node.js host (Render, Railway, Fly.io, a VM, etc.). The Express process owns a long-lived HTTP/Socket.IO server, background timers, and optionally local backup files; pretending it is a Vercel Function would break those features. PostgreSQL must be reachable from the Node host over TLS.

Recommended URLs:

- Admin: `https://admin.example.com`
- POS: `https://pos.example.com`
- API/Socket.IO: `https://api.example.com`

## Backend environment (secret unless noted)

Required in production:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET` (must differ from access secret)
- `CORS_ORIGINS=https://admin.example.com,https://pos.example.com`

Configuration:

- `PORT` (normally injected by host)
- `JWT_ACCESS_EXPIRY` (recommended `15m`)
- `JWT_REFRESH_EXPIRY` (recommended `7d`)
- `RATE_LIMIT_WINDOW_MS` (recommended `900000`)
- `RATE_LIMIT_MAX_REQUESTS` (recommended `1000`)
- `BCRYPT_SALT_ROUNDS` (recommended `12`)
- `MAX_LOGIN_ATTEMPTS` (recommended `5`)
- `LOCKOUT_DURATION_MINUTES` (recommended `15`)
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_BUSINESS_NAME` (needed only for first seed; an existing admin password is never overwritten)

Optional server-only integrations: `STORAGE_PROVIDER`, `STORAGE_LOCAL_PATH`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## Frontend environments

Admin Vercel project:

- `VITE_API_BASE_URL=https://api.example.com`
- `VITE_POS_URL=https://pos.example.com`

POS Vercel project:

- `VITE_API_BASE_URL=https://api.example.com`

Only public URLs may use the `VITE_` prefix. Never put database, JWT, AWS, or WhatsApp secrets in either Vercel frontend project.

## Steps

1. Back up PostgreSQL outside this application.
2. Resolve/verify Prisma migration history against a sanitized clone before changing production. Do not run `prisma migrate reset` or `prisma db push` against production. This repository is missing the original baseline migration; see the blocker in the release handoff.
3. On the backend host run `PUPPETEER_SKIP_DOWNLOAD=true npm ci`, `npx prisma generate --schema server/prisma/schema.prisma`, and `npm run build:server`.
4. After migration history is reconciled, run `npm run db:seed`. It is idempotent, backfills permissions/system roles, and preserves an existing admin password.
5. Start with `npm run start --workspace=server`. Configure the platform health check as `/health` and terminate TLS at the platform proxy.
6. In Vercel create one project with Root Directory `apps/admin`, and another with Root Directory `apps/pos`. The checked-in `vercel.json` files provide Vite builds and SPA fallback rewrites. Add the frontend variables above and deploy.
7. Add the final Vercel origins to backend `CORS_ORIGINS`, then restart the backend.

## Smoke test

1. `GET https://api.example.com/health` returns HTTP 200.
2. Open Admin `/login`, sign in, refresh `/dashboard`, and directly open `/users`, `/vendors`, `/targets`, `/shifts`, `/reports`, and `/backups`.
3. Create a Cashier with a strong temporary password and Main Branch. Verify it appears active and assigned to Cashier.
4. Open POS `/login`; sign in as Cashier, open shift, search/add an in-stock product, complete a cash sale, verify change and receipt, then close shift.
5. In Admin verify the sale under Sales and Reports. Log both users out and verify protected direct URLs return to login.
6. Test access-token expiry: one refresh request should occur and concurrent API calls should retry once; an invalid refresh token must clear storage and return to login.
