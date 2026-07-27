# Parametra.ai — Website Claude Agent Guide

Pre-launch marketing site for Parametra.ai, an AI-powered multi-agent CAD design tool for Onshape. Built with Next.js 16, Tailwind CSS v4, TypeScript.

**Current state: light-theme redesign** (branch `refactor/major-website-updates`) — soft off-white background with blue accents, softened (rounded-corner) styling. The earlier near-black/CAD-green "terminal" aesthetic this doc previously described is gone from the site shell.

## Design language

- **Colors**: off-white base `#f8fafc`, blue-tinted panels `#eef2f9`, borders `#dbe6f5`, text `#0f172a` (primary) / `#475569` (secondary) / `#64748b` (dim) / `#94a3b8` (extra-dim), accent **blue `#3b82f6`** (hover `#2563eb`). Blue is now the site's own brand accent, so the platform-tree Fusion 360 node uses **cyan** (`cyan-300`/`cyan-500`/`cyan-600`) instead to stay visually distinct from the Onshape-root/brand blue; violet is still used for the SolidWorks node.
- **Fonts**: Lato (`--font-lato`, sans) + Geist Mono (`--font-geist-mono`) via `next/font/google`. (No longer Geist Sans.)
- **Style**: rounded corners (`rounded-md`/`rounded-lg`, softened from the old sharp-corner look) on buttons, cards, inputs, and panels; monospace eyebrows/labels in uppercase tracking-widest and terminal-style `[tag]` log lines are still used as a typographic motif.
- Key CSS classes in `globals.css`: `grid-bg` (now an intentional no-op — the coordinate-grid effect was dropped when softening the aesthetic), `gradient-text`, `header-glass` (light frosted-glass blur), `cursor-blink`, `morph-fade-in/out`, `form-field-enter`, `cad-scan-line`, `cad-pulse` (both currently unused dead CSS), `animate-fade-up/in`, and the `.device-*` family (device shell for the live-demo flight — see DemoSection below).
- **`DemoSection.tsx` is an intentional exception**: the scripted "mock Parametra desktop app" window (and its child components `InterCadPanel.tsx`, `IntentWebViewer.tsx`) keeps its own self-contained dark/CAD-green palette — like a product screenshot floating on the light page — rather than following the site-shell light theme. Only its outer section wrapper background was updated to blend with the new page background.

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 — no config file, `@import "tailwindcss"` in `globals.css`
- **Backend API**: external C# (ASP.NET Core) service at `https://api.parametra.ai` (repo `141712CA-D/parametra-infra-api`, AWS behind Cloudflare). This site is a **thin client** — all waitlist/contact logic, email (Resend), Google Sheets sync, Postgres, and Turnstile verification live in that backend.
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`) — widget only; secret-key verification is in the backend
- **Analytics**: Vercel Speed Insights, mounted in `layout.tsx`
- **Deployment**: Vercel (GitHub repo `141712CA-D/cadweb`, production branch `main`)
- **Tests**: Vitest + React Testing Library (jsdom), config in `vitest.config.mts` / `vitest.setup.ts`. Run `npm test` (or `npm run test:watch`). Suites live in `__tests__/`: `lib/` (scrollLock ref-counting, apiUrl, consumeExpired), `components/` (MorphSwitch phases, SignupForm validation/captcha-gating with a mocked Turnstile + fetch, DemoSection script-data invariants). DemoSection's demo data constants (`MESSAGES`, `SCRIPT`, `FEATURES`, `LOG_LINES`, `VAR_GROUPS`, `TRANSFER_MESSAGES`, `TRANSFER_SCRIPT`, `TRANSFER_LOG_LINES`) are exported for the data tests — **run `npm test` after editing either demo script**; the tests enforce id references, chronological delays, that the transfer log fits inside its conversation window, and the "12 features · 9 variables" / "13 features mapped (7 direct + 6 replicated)" copy counts. `DemoSection.gate.test.tsx` asserts the gated run is the transfer; `deviceFlight.test.ts` covers the scroll-driven device flight (band continuity, docked stillness, dock-marker alignment).

## Environment Variables

Only public (`NEXT_PUBLIC_`) vars plus two server-only cron secrets. Stored in `.env.local` locally and Vercel encrypted storage. Never committed. **Note: there is currently no `.env.local` in the local checkout** — forms cannot work locally until one is created.

```
NEXT_PUBLIC_API_URL                 # Backend base URL — https://api.parametra.ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY      # Cloudflare Turnstile site key (browser-safe)
NEXT_PUBLIC_MAIL_FROM_EMAIL         # Sender shown in spam notice (optional; defaults to no-reply@parametra.ai)
CRON_SECRET                         # Server-only. Authenticates Vercel Cron → /api/cron/sync-waitlist
ADMIN_SYNC_SECRET                   # Server-only. Forwarded as X-Admin-Secret; MUST equal backend's ADMIN_SYNC_SECRET
```

> `NEXT_PUBLIC_*` vars are build-time inlined — changing one in Vercel requires a redeploy.

## File Structure

```
app/
├── layout.tsx              # Fonts (Lato + Geist Mono), metadata, favicon, BackgroundSync, SpeedInsights, tabIndex=-1 on body
├── page.tsx                # Home — intro state via sessionStorage, SignupModal state, CTA band, Partners, footer
├── globals.css             # All custom CSS: keyframes, grid-bg, header-glass, morph animations, etc.
│
├── components/
│   ├── BackgroundSync.tsx  # Mounted in layout: warms /api/health, hourly cookie-throttled waitlist sync
│   ├── ContactForm.tsx     # Contact form (Individual + Team tabs, 6-digit email code verify step)
│   ├── DemoSection.tsx     # Scroll-locked demo section on a 3D scroll runway (see below)
│   ├── DeviceShell.tsx     # MacBook / phone chrome around the demo window; all geometry is CSS,
│                           # driven by the single `--chrome` custom property
│   ├── DevBanner.tsx       # Fixed top bar "This project is currently in development"
│   ├── Header.tsx          # Fixed header at top-8: logo, The Pitch + Contact + Discord, waitlist button, mobile hamburger menu
│   ├── Hero.tsx            # Hero fold + embedded DemoSection + platform tree scroll section
│   ├── IntroAnimation.tsx  # Curtain intro overlay — uses shared lockScroll/unlockScroll
│   ├── MorphSwitch.tsx     # Height/opacity morph between form tab contents (frozen-snapshot exit, live entry)
│   ├── SignupForm.tsx      # Waitlist form + live email dedup badge + 6-digit code verify step
│   └── SignupModal.tsx     # Right-side slide-in panel (z-70, over DevBanner) hosting SignupForm
│
├── about/page.tsx          # Scroll-snap full-viewport cards: Andrew Yang, Sandeep Sawhney, Abhijeet Chopra
├── signup/page.tsx         # Thin wrapper: SignupForm + footer
├── contact/page.tsx        # Thin wrapper: ContactForm + footer
├── how-it-works/page.tsx   # HIDDEN — unlinked from header/footer/hero + `noindex` metadata, but still builds and
│                           # is reachable by direct URL. Kept for later use; don't delete.
├── privacy-policy/page.tsx # Dark-theme legal page
├── terms/page.tsx          # Dark-theme legal page
│
└── api/
    └── cron/sync-waitlist/route.ts  # ONLY route — Vercel-cron proxy. Verifies Bearer CRON_SECRET,
                                     # forwards to backend POST /api/admin/sync-waitlist with X-Admin-Secret.

lib/
├── api.ts                  # apiUrl(path) — prefixes NEXT_PUBLIC_API_URL (falls back to same-origin, fails loudly)
├── consumeExpired.ts       # POST /api/{waitlist|contact}/consume-expired (keepalive) after successful verify
├── deviceFlight.ts         # Pure scroll-progress → 3D transform math for the live-demo flight
└── scrollLock.ts           # Shared reference-counted body scroll lock (lockScroll/unlockScroll)

public/demo.mp4             # Demo screen recording (currently ~60 KB — likely placeholder, verify before launch)
vercel.json                 # Vercel Cron: /api/cron/sync-waitlist daily at 00:00 UTC (production only)
```

The old `/overview` page was removed.

## Home page (`/`)

Section order: **hero fold → demo video (scroll-locked) → platform tree → CTA band → Partners → footer**.

- `sessionStorage("introPlayed")` gates the intro animation (plays once per session); `mounted` state prevents hydration mismatch
- All "Join the Waitlist" triggers (header, hero, CTA band, footer link) open **SignupModal** via shared state in `page.tsx`; standalone pages fall back to `/signup`
- CTA band: "Releasing Soon" eyebrow, "Stop rebuilding the same model." h2, button opening SignupModal
- Partners: Onshape logo (grayscale, colors on hover), below the CTA
- Footer shows version string (currently `v1.5.1.1`) centered in mono dim text

### Hero (`Hero.tsx`)

**Zone 1 — hero fold**: the hero used to alternate on a 6.5s timer between a text-to-CAD pitch and an Inter-CAD pitch; that alternation is **gone** — the hero is now fixed on Inter-CAD transfer. Eyebrow "Parametra · v1.0 · Releasing Soon"; h1 "Inter-Software Git for CAD" (`text-4xl sm:text-5xl lg:text-6xl font-black`); "Inter-CAD transfer" step chips (`INTER_CAD_STEPS`); blue waitlist button + "See a transfer →" button that scrolls to `#live-demo`. Right column: description + `/node-demo-video.mov` (looping, force-played on pause/visibilitychange) with a scroll-down prompt bar. Scroll nudge (`fixed bottom-8` chevron) appears after 4s idle, hides at `scrollY > 60`.

**Zone 2 — DemoSection** (imported into Hero, wrapped in `relative z-10`): see below.

**Zone 3 — platform tree** (`treeRef`, `min-h-[300vh]`, sticky inner): 6 `platformStages` driven by scroll progress — Onshape root card → Fusion 360 + SolidWorks branch cards → per-branch `LeafList` capability leaves → "One prompt. Every tool." finale. Invisible-copy + `absolute inset-0` overlay pattern prevents reflow as the tree builds. Header h2/p use the invisible-spacer pattern.

> The old Zone-2 pinned terminal simulation ("How it generates", `TerminalAccumulator`/`TerminalSwap`, `#generation-demo`) was **removed** — redundant with the real demo video and `/how-it-works`.

### DemoSection (`DemoSection.tsx`)

Scripted mock-app demo (fake Parametra desktop window: sidebar, breakdown panel, chat + logs tabs). The one run is the **Inter-CAD transfer** — the product's focus, so it leads everywhere on the site. Driven entirely by exported constants (`TRANSFER_MESSAGES`/`TRANSFER_SCRIPT`/`TRANSFER_LOG_LINES`; the `MESSAGES`/`SCRIPT`/`FEATURES`/`LOG_LINES`/`VAR_GROUPS` text-to-CAD set is still exported and covered by tests but no longer rendered) — covered by invariant tests, run `npm test` after editing them.

- **Gated start (all breakpoints)**: the demo never auto-plays. A `!started` overlay ("▶ Start mock application") covers the window; clicking `startDemo()` snaps to the dock marker (`behavior: "instant"` — smooth would strand mid-scroll under the lock), locks body scroll via shared `lockScroll()`, runs the transfer conversation (~9.5s) with `TRANSFER_LOG_LINES` streaming into the Logs tab, then unlocks and sets `sessionStorage("demoAnimPlayed")`.
- Already played this session → mount effect fast-forwards the transfer to its complete state, no gate, no lock.
- `InterCadPanel` takes a `stage` prop mirroring `statusLineCount`, so the breakdown builds in step with the conversation.
- After completion: desktop-only fake-cursor hint tour (once per session, `cursorHintPlayed`) — it opens the "Derived / Non-Direct Map" accordion (via a real DOM click on `[data-intercad-btn="derived"]`, since that state lives inside `InterCadPanel`), switches to the transfer log, and hovers the intent web (`[data-intercad-web]`).
- Mobile (<sm): sidebar/panel live in a hamburger slide-in shelf; chat pane is the main view.

#### Device flight (`lib/deviceFlight.ts` + `DeviceShell.tsx`)

The section is a **`RUNWAY_SVH` (170svh) scroll runway** with a `sticky top-0`, 100svh stage inside it. The window flies in from the back-left as a MacBook (`sm+`) or phone (`<sm`), rotating upright and dissolving its shell as it docks — **and then stays put**. There is deliberately **no fly-out**: once docked it holds position for the rest of the runway and leaves the same way any other section does, by scrolling off the top. (An outward exit arc was built and then removed — don't reintroduce it.)

- `flightAt(p)` is pure and unit-tested (`__tests__/lib/deviceFlight.test.ts`) — entry `[0, ENTRY_END)` (0.42), docked `[ENTRY_END, 1]`. The docked band returns `DOCKED_FRAME`, whose `transform` is `none` so docked text renders crisp; a test walks the whole band asserting nothing moves.
- The scroll handler writes **straight to the DOM** on one element (transform, opacity, `--chrome`, `pointer-events`) via rAF — the demo subtree is far too heavy to re-render per frame. Nothing here is React state.
- `DeviceShell` is pure CSS (`.device-*` in `globals.css`) sized off the single `--chrome` var: `1` = full body, `0` = every layer collapsed to zero size and opacity, leaving the window untouched.
- **The dock marker** (`DOCK_MARKER_TOP_SVH`, an absolutely-positioned 1px div) is what `startDemo` scrolls to. Aiming at the section's top instead would land progress at 0 — the window still mid-flight — so keep them in sync if the band constants change.
- The window is only interactive while docked (`pointer-events: none` otherwise), and `prefers-reduced-motion` skips the flight entirely.
- **The fake cursor layer must stay outside the stage**: both `perspective` and `transform` make an ancestor the containing block for `position: fixed`, which would pin the cursor to the flying window rather than the viewport.

### scrollLock (`lib/scrollLock.ts`)

Reference-counted `document.body.style.overflow` lock shared by IntroAnimation, SignupModal, and DemoSection — prevents one consumer's unlock from clobbering another's lock. Always pair lock/unlock and release on unmount.

## Forms

Both forms share the pattern: `noValidate`, `errors` record + `validate()` + `clearError(field)`, tab switch clears errors, `inputClass(error?)` swaps border color, email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, Turnstile widget (`theme: "dark"`), submit disabled until `allFieldsFilled && captchaToken`. Tab content swaps are animated by **MorphSwitch**. Both flows are **two-step**: submit → backend emails a 6-digit code → verify screen (`inputMode="numeric"`, `autoComplete="one-time-code"`) → success. On success, `consumeExpired()` fires and (standalone page) `introPlayed` is cleared + redirect home.

### SignupForm
- Individual: Name, Email, Role (Student/Instructor/Freelancer/Hobbyist), School (required for Student **and** Instructor, role-specific placeholder), Why. Team: Rep Name, Email, Org, Role (text), Intended Usage.
- Live email dedup: debounced 300ms `GET /api/waitlist/check-cache?email=` with request-id guard → `EmailCheckBadge` ("Checking…" / green "Can register" / red "Already registered"); registered emails block submit.
- Status states: `verify`, `success` ("You're on the list."), `welcome_back`, `duplicate`, `error`; success screens show the unmark-as-spam notice.

### ContactForm
- Individual adds Subject + Message (2000-char counter, amber >1600, red at max) and an "Other" role option; University required only for Student.
- Extra `cooldown` state for backend rate limits (429 → "Slow down." screen with retry minutes).

## Other pages

- **About**: full-viewport scroll-snap card per co-founder inside a scroll container (`scrollSnapAlign: start`, `scrollSnapStop: always`), scroll nudge, three members (Andrew Yang, Sandeep Sawhney — ME/CE, Michigan '29; Abhijeet Chopra — CS, NYU '29), `icons` map with inline LinkedIn/Website SVGs, socials per member.
- **How It Works** (hidden, see file structure): vision heading, flow tree (ASME Drawing + Direct Prompt → pipeline → Onshape), 4 processing layers (NLM Processor, Interpreter, Reasoning Engine, Execution Layer) with per-layer accent colors.

## Backend API (api.parametra.ai)

All calls go through `apiUrl()`. Endpoints used by this front end:

| Method & path | Called from | Notes |
|---|---|---|
| `POST /api/waitlist/request` | SignupForm submit | captcha + validation + dedup, emails 6-digit code |
| `POST /api/waitlist/verify` | SignupForm verify | `{email, code}` → `{success, returning}`; 400 mismatch, 410 expired, 429 attempts |
| `GET /api/waitlist/check-cache?email=` | SignupForm debounced dedup | `{canRegister, status}` |
| `POST /api/contact/request` | ContactForm submit | captcha + rate-limit (429 → `{retryAfter}`) |
| `POST /api/contact/verify` | ContactForm verify | same error mapping as waitlist |
| `POST /api/{waitlist\|contact}/consume-expired` | `lib/consumeExpired.ts` after verify | keepalive fire-and-forget |
| `GET /api/health` | BackgroundSync | API warm-up on page load |
| `POST /api/cookies/is-sync-ready` / `POST /api/cookies/sync-waitlist` | BackgroundSync | hourly per-browser sync, throttled by `waitlistSynced` cookie |
| `POST /api/admin/sync-waitlist` | cron proxy route | requires `X-Admin-Secret` |

**CORS:** backend allowlists only `https://parametra.ai` and `https://www.parametra.ai`. Localhost and Vercel preview domains are blocked — forms can't submit from them without adding origins to the backend CORS policy (and the Turnstile site-key hostname list in Cloudflare).

## Known Quirks

- No `.env.local` locally → Turnstile widget won't render and submit buttons stay disabled (greyed) when testing forms locally
- `public/demo.mp4` is ~60 KB — verify it's the real demo recording before launch
- `AbhijeetHeadshot.png` (6 MB) and `AndyHeadshot.png` (2.7 MB) are uncompressed — should become WebP/`next/image` eventually
- `SandeepHeashot.jpg` — filename typo (missing 'd'), keep as-is
- Header logo is a plain `<img>` (NOT Next `<Image>`) — Image caused vertical displacement with the SVG
- `tabIndex={-1}` on `<body>` — programmatically focusable for scroll restoration after the intro
- Select `color` can't be overridden via Tailwind when `text-white` is set — placeholder color uses inline `style`
- Turnstile needs Cloudflare network access — may not appear on poor connections
- Dead assets in `public/`: `logo copy.png`, `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`
- Footer version string (`v1.5.1.1` in `page.tsx`) is updated manually
- Commit messages in this repo must contain **no Claude/AI references** (no Co-Authored-By or session trailers)
