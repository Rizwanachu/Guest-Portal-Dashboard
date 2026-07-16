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
