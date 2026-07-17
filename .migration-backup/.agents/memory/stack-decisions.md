---
name: Stack Decisions
description: Key architectural choices for CheckInn
---

## Framework
- React + Vite (kept, not migrated to Next.js — spec said "agree with choices", existing codebase)
- Express 5 API server (separate artifact)
- Drizzle ORM + PostgreSQL (Replit DB for dev; use DATABASE_URL for Neon/Vercel prod)

## API Calls
- Generated Orval client (`@workspace/api-client-react`) only for endpoints in openapi.yaml
- New endpoints (auth, hotels, rooms, staff, reports): plain `fetch('/api/...', { credentials: 'include' })` in useQuery/useMutation
- `credentials: "include"` is MANDATORY on every fetch — needed for cookie auth

## Routing
- Wouter for client-side routing
- Path-based routing: `/api/*` → API server, `/*` → frontend

## Design
- Apple Liquid Glass theme — glassmorphism CSS in index.css (glass-card, glass-input, glass-sidebar)
- Framer Motion for animations
- Recharts for charts
- shadcn/ui base components

**Why:** Keeping Vite avoids a massive Next.js migration mid-project; the cookie-based auth works identically in both, and Vercel can host Express via serverless adapter.
