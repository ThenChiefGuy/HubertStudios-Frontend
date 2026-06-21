# Wiring status — read this first

This is a checkpoint snapshot, not a finished build. Here's exactly what's real vs. mock right now:

## Wired to the real backend

- `lib/api.ts` — the API client (fetch wrapper, CSRF handling, typed methods for every endpoint)
- `app/login/page.tsx` — real Turnstile widget, real `POST /api/auth/login`
- `app/verify/page.tsx` — real `POST /api/auth/verify`
- `components/dashboard/auth-guard.tsx` — checks `GET /api/auth/session` on load, redirects to `/login` if there's no valid session
- `components/dashboard/topbar.tsx` — shows the real logged-in admin email, real `POST /api/auth/logout`
- `components/dashboard/turnstile-widget.tsx` — real Cloudflare Turnstile widget (needs `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set, see `.env.example`)

## Still mock data — NOT wired yet

Every dashboard page still imports from `lib/mock-data.ts` and shows the same fake data regardless of what's actually in your D1 database:

- `app/(dashboard)/overview/page.tsx`
- `app/(dashboard)/plugins/page.tsx`
- `app/(dashboard)/licenses/page.tsx`
- `app/(dashboard)/builds/page.tsx`
- `app/(dashboard)/server-bans/page.tsx`
- `app/(dashboard)/active-servers/page.tsx`
- `app/(dashboard)/audit-log/page.tsx`
- `app/(dashboard)/settings/page.tsx` (no backend route exists for this one yet either)

And every dialog's Save/Delete button just shows a toast notification and doesn't call the API:

- `components/dashboard/plugin-dialog.tsx`
- `components/dashboard/license-dialog.tsx`
- `components/dashboard/build-dialog.tsx`
- `components/dashboard/ban-dialog.tsx`

## What this means in practice

You can log in for real (real password check, real Turnstile, real email code, real session cookie) and you'll land on the dashboard — but the dashboard itself will show the same hardcoded plugins/licenses/etc. every time, not your actual D1 data, until the pages above are wired up too.

## Set these before testing login

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_API_BASE_URL=          # your deployed Worker's URL (or leave blank if same-origin)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=    # the public Site Key from Cloudflare Turnstile
```
