# AgriCane Deployment Checklist

Use this checklist before deploying the portfolio build to Vercel, Render, and Neon.

## Secret Handling

- Never commit `.env`, `.env.production`, or platform secret values.
- Rotate any credential that has ever appeared in committed files or shared screenshots.
- Keep `.env.example` as placeholders only.
- Do not expose backend secrets through Vite. Any variable prefixed with `VITE_` is bundled into the browser.

## Neon

Create two connection strings:

- `DATABASE_URL`: pooled connection string for runtime traffic.
- `DIRECT_URL`: direct connection string for Prisma migrations.

Both URLs should include SSL settings required by Neon.

## Render Backend

Required environment variables:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
DATABASE_URL=<neon-pooled-url>
DIRECT_URL=<neon-direct-url>
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://<your-vercel-domain>
OPENWEATHER_API_KEY=<optional-openweather-key>
COPERNICUS_CLIENT_ID=<optional-sentinel-client-id>
COPERNICUS_CLIENT_SECRET=<optional-sentinel-client-secret>
SMTP_HOST=<optional-smtp-host>
SMTP_PORT=587
SMTP_USER=<optional-smtp-user>
SMTP_PASSWORD=<optional-smtp-password>
NOTIFICATION_FROM=noreply@agricane.com
```

Recommended commands:

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
node dist/main
```

Do not run seed automatically on every production restart. Run demo seed intentionally when preparing a portfolio database.

## Vercel Frontend

Required environment variables:

```env
VITE_API_BASE_URL=https://<your-render-service>/api/v1
VITE_WS_URL=https://<your-render-service>
```

Acceptance checks:

- Refreshing nested routes such as `/fields/:id` and `/notifications` does not return 404.
- Browser network requests point to Render, not localhost.
- No backend secret is stored in Vercel frontend env.

## Local Verification Before Deploy

Run these checks from the project folders:

```bash
# backend
npm run build
npm run lint
npm test

# frontend
npm run build
npm run lint
```

If `npm` is not available in PATH on Windows, use the local Node runtime and local CLI scripts as documented in `AUDIT_IMPLEMENTATION_PLAN.md`.
