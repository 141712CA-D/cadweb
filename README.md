# Parametra website

Marketing site for **Parametra.ai**, built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **TypeScript**.

The site uses a dark terminal-style design, `Lato` for body text, `Geist Mono` for mono UI labels, and a thin-client architecture: the frontend handles presentation and basic UX, while waitlist/contact logic, email, verification, and sync live in the external backend at `https://api.parametra.ai`. That backend is backed by a Postgres database hosted on Neon and a managed Redis cache (Upstash) used for email dedup checks and rate limiting.

## What the site contains

### Home (`/`)

The homepage is a single-page marketing experience with:

- hero section and prompt preview
- embedded product demo video
- scroll-locked live demo section
- platform tree showing Onshape, Fusion 360, and SolidWorks paths
- CTA band, partners section, and footer

The live demo never auto-starts. A user must click the overlay button to launch it; that click scrolls the page to the demo and locks body scroll until the scripted run completes.

### Additional routes

- `/about` — team story + scroll-snap founder cards
- `/how-it-works` — product vision, prompt/drawing intake, and pipeline explanation
- `/signup` — standalone waitlist form
- `/contact` — standalone contact form
- `/privacy-policy`
- `/terms`

## Forms

Both forms use a shared pattern:

- client-side validation
- Cloudflare Turnstile verification
- two-step flow: submit request, then verify a 6-digit code by email
- `consumeExpired()` cleanup after successful verification

### Waitlist form

`SignupForm` supports two modes:

- **Individual** — name, email, role, university/school for students and instructors, reason for use
- **Team** — rep name, email, organization, role, intended usage

It also includes live email deduplication via `GET /api/waitlist/check-cache?email=...` (backed by a Redis/Upstash
cache) and a self-service unsubscribe flow: a user follows the unsubscribe link in an email, requests a fresh
6-digit code (`POST /api/waitlist/unsubscribe-request`), and confirms it (`POST /api/waitlist/unsubscribe`) to
remove themselves from the waitlist.

### Contact form

`ContactForm` supports:

- **Individual** — name, email, role, university for students, subject, message
- **Team** — rep name, email, organization, role, subject, message

It also handles rate limiting with a cooldown state when the backend returns `429`.

## Demo experience

`DemoSection` is the main interactive showcase. It includes:

- a mock app window with sidebar, feature tree, variables, logs, and a mesh viewer
- a start gate so the demo only runs on explicit user action
- shared scroll locking via `lib/scrollLock.ts`
- a second transfer flow that replays a Fusion-to-Onshape transfer story

The demo data is exported and covered by tests so timing and content stay consistent.

## API wiring

All frontend requests go through `lib/api.ts`, which prefixes `NEXT_PUBLIC_API_URL` when set.

Used endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | warm up the backend on page load |
| `GET` | `/api/waitlist/check-cache` | live email dedup check (Redis-backed) |
| `POST` | `/api/waitlist/request` | send waitlist verification email |
| `POST` | `/api/waitlist/verify` | confirm waitlist code |
| `POST` | `/api/waitlist/unsubscribe-request` | send/resend an unsubscribe verification code |
| `POST` | `/api/waitlist/unsubscribe` | confirm unsubscribe code and remove the waitlist entry |
| `POST` | `/api/contact/request` | send contact verification email |
| `POST` | `/api/contact/verify` | confirm contact code |
| `POST` | `/api/{waitlist\|contact}/consume-expired` | clear expired verification state |
| `POST` | `/api/cookies/is-sync-ready` | check if background sync should run |
| `POST` | `/api/cookies/sync-waitlist` | browser-throttled waitlist sync |
| `GET` | `/api/cron/sync-waitlist` | Vercel cron proxy to the backend admin sync |

The only local API route is the cron proxy at `app/api/cron/sync-waitlist/route.ts`; it authenticates Vercel Cron with `CRON_SECRET` and forwards to the backend admin endpoint with `ADMIN_SYNC_SECRET`.

## Background behavior

`BackgroundSync` runs on page load to:

- warm the backend with `/api/health`
- perform a cookie-throttled waitlist sync once per browser per hour

## Tech stack

- Next.js 16.2.1 App Router
- React 19
- Tailwind CSS v4
- TypeScript
- Vitest + React Testing Library
- Cloudflare Turnstile
- Vercel Speed Insights
- Three.js for the demo model viewer

## Environment variables

Create a local `.env.local` with:

```bash
NEXT_PUBLIC_API_URL=https://api.parametra.ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
NEXT_PUBLIC_MAIL_FROM_EMAIL=no-reply@parametra.ai
CRON_SECRET=...
ADMIN_SYNC_SECRET=...
```

Notes:

- `NEXT_PUBLIC_*` values are build-time values
- forms will not work locally without the backend CORS allowlist and matching Turnstile hostname configuration

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:watch
```

## Tests

The test suite covers:

- `scrollLock`
- `apiUrl`
- `consumeExpired`
- `MorphSwitch`
- `SignupForm`
- `DemoSection` data and gate behavior

## Notes

- The site is intentionally dark-themed and uses sharp, terminal-style UI
- The homepage footer version string is updated manually
- The site is deployed on Vercel
