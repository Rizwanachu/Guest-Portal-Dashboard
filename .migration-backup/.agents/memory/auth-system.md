---
name: Auth System
description: JWT + httpOnly cookie auth, bcrypt, setup wizard, roles
---

## Design
- Token: JWT signed with `JWT_SECRET` env var, 7-day expiry
- Cookie: `auth_token`, httpOnly, SameSite=Lax (dev) / Strict (prod), Secure in prod
- Password hashing: bcryptjs rounds=12 (pure JS — no native deps, Vercel-safe)
- Roles: `super_admin` (no hotelId), `admin` (hotelId set), `staff` (hotelId set)

## Endpoints (all at /api/auth/...)
- `GET /setup-status` — returns `{ setupRequired: bool }` — always public
- `POST /setup` — creates first admin + hotel; only works when users table empty
- `POST /login` — sets cookie on success
- `POST /logout` — clears cookie; requires auth
- `GET /me` — returns safe user; requires auth
- `POST /forgot-password` — sends reset email; always returns 200 (anti-enumeration)
- `POST /reset-password` — validates token + sets new password
- `POST /change-password` — requires auth; validates current password
- `PATCH /profile` — update name/phone; requires auth

## Frontend
- `AuthProvider` in `hooks/use-auth.tsx` wraps the app, fetches /me on mount
- `ProtectedRoute` component redirects to /login if not authenticated
- Public routes: /login, /setup, /checkin/:token
- `credentials: "include"` required on ALL fetch calls to the API

## First-run flow
1. App loads → `setupCheck()` → if setupRequired → redirect to /setup
2. /setup: 2-step wizard (hotel name → admin account) → POST /auth/setup → logged in

**Why:** Clerk/Auth0/Firebase explicitly excluded by product spec; self-hosted JWT is simpler for Vercel deployment without external auth service dependencies.
