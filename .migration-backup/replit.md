# Hotel Guest Check-in Portal

A digital guest check-in platform for hotels. Staff create bookings and share a link; guests fill in their details, upload IDs, and complete check-in before arrival — no paper forms.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/guest-checkin run dev` — run the frontend (port 21770)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Vercel Deployment

The project deploys as a **single Vercel project**: the frontend is a static build, the API runs as a serverless function. Both share the same domain so cookies and relative `/api/...` paths work without extra config.

### Vercel project settings (set once in the dashboard)
Vercel reads `vercel.json` automatically. No build settings to configure in the dashboard — all routing and build steps are declared in `vercel.json`.

**How it works**: `@vercel/static-build` runs the `vercel-build` script (frontend Vite build) and serves `artifacts/guest-checkin/dist/public` as static files. `@vercel/node` compiles `api/index.ts` (which re-exports the Express app) as a serverless function. Routes send `/api/*` to the function and everything else falls through to `index.html`.

### Required environment variables (Vercel → Settings → Environment Variables)
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. Use a pooler URL (e.g. Neon pooled endpoint) for best serverless performance. |
| `JWT_SECRET` | ✅ | Any long random string. The server throws at startup in production if this is missing. |
| `SESSION_SECRET` | ✅ | Used by cookie-parser for signed cookies. |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of allowed CORS origins. Leave unset if frontend and API share the same Vercel domain (default). Set only if you split them into separate projects. |
| `SMTP_HOST` | Optional | SMTP server hostname for email. The server logs-only and skips sending if unconfigured. |
| `SMTP_PORT` | Optional | SMTP port (e.g. 587). |
| `SMTP_USER` | Optional | SMTP username / email address. |
| `SMTP_PASS` | Optional | SMTP password. |
| `SMTP_FROM` | Optional | From address for outgoing emails. |
| `APP_URL` | Optional | Public URL of the deployment (e.g. `https://yourapp.vercel.app`). Used in email links. |
| `LOG_LEVEL` | Optional | Pino log level (`info`, `warn`, `error`). Defaults to `info`. |

### Database: apply schema to production
After creating the Vercel project and setting `DATABASE_URL`, run schema migrations against your production database once (from your local machine or Replit):
```
DATABASE_URL=<prod-url> pnpm --filter @workspace/db run push
```

### Architecture notes
- `vercel.json` routes `/api/*` → `api/index.ts` (Express serverless handler) and all other paths → `index.html` (SPA fallback).
- File uploads (ID photos, signatures) are stored as base64 data URLs directly in the `guests` table. This works for low-to-medium volume. For higher traffic, wire uploads to Vercel Blob or S3 (see the "Keep guest uploads safe" task).
- The Express app is exported from `api/index.ts` at the project root — do not move or rename this file.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/bookings.ts` — bookings table
- `lib/db/src/schema/guests.ts` — guests table (with FRRO fields for foreign nationals)
- `artifacts/api-server/src/routes/bookings.ts` — bookings + check-in link routes
- `artifacts/api-server/src/routes/guests.ts` — guest check-in, upload, search routes
- `artifacts/guest-checkin/src/` — frontend React app

## Architecture decisions

- Check-in links use a secure random 48-character hex token (`checkin_token`) stored on the booking — no auth required for the public guest form.
- FRRO/C-Form section auto-shows when nationality is not "India" / "Indian" (case-insensitive check on both frontend and backend).
- ID/signature uploads are stored as base64-decoded files in `/tmp/guest-uploads/` — for production, wire this to object storage.
- Booking status auto-advances to "completed" when submitted guest count reaches `numberOfGuests`.
- Export (PDF/Excel) is fully client-side — `useGetExportData` fetches the data; the frontend renders using browser print or CSV Blob.

## Product

- **Admin dashboard** — stats (today's arrivals, pending/completed, foreign nationals), recent bookings list
- **Bookings management** — create, view, edit, delete bookings; generate WhatsApp/SMS check-in links
- **Guest check-in form** (public, mobile-first) — multi-step: personal info → ID upload → FRRO fields (if foreign) → digital signature → confirmation
- **Search guests** — search across all bookings by name, phone, email, nationality, booking ref

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before the api-server typecheck, otherwise the DB table exports appear missing.
- The OpenAPI spec must not use operation-shaped body/param component names — Orval generates collisions. Use entity-shaped names (`GuestCheckinInput`, not `SubmitGuestCheckinBody`).
- `/bookings/stats` and `/bookings/recent` routes must be registered BEFORE `/bookings/:id` in Express, or the literal path segments get captured as the `:id` param.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
