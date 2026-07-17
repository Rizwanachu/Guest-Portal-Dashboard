---
name: SMTP Notes
description: Email infrastructure setup and required env vars
---

## Required Env Vars
- `SMTP_HOST` — e.g. smtp.gmail.com, smtp.sendgrid.net
- `SMTP_PORT` — 587 (TLS) or 465 (SSL)
- `SMTP_USER` — SMTP username/email
- `SMTP_PASS` — SMTP password or app password
- `SMTP_FROM` — sender address, e.g. noreply@hotel.com
- `APP_URL` — base URL for reset/checkin links, e.g. https://hotel.vercel.app

## Behavior
- If SMTP not configured: emails are logged to pino logger but not sent (no crash)
- Transport created fresh per email call (no persistent connection)

## Templates (in api-server/src/lib/email.ts)
- `bookingConfirmationHtml()` — sent on new booking
- `passwordResetHtml()` — sent on forgot-password
- `staffInviteHtml()` — sent when staff member is added

**Why:** Graceful degradation means the app works fully in dev without SMTP creds.
