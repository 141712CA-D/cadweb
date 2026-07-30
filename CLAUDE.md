# Parametra.ai — Website Claude Agent Guide

Pre-launch marketing site for Parametra.ai, an AI-powered multi-agent CAD design tool for Onshape. Built with Next.js 16, Tailwind CSS v4, TypeScript.

**Current state: light-theme redesign** (branch `refactor/major-website-updates`) — soft off-white background with blue accents, softened (rounded-corner) styling. The earlier near-black/CAD-green "terminal" aesthetic this doc previously described is gone from the site shell.

## Design language

- **Colors**: off-white base `#f8fafc`, blue-tinted panels `#eef2f9`, borders `#dbe6f5`, text `#0f172a` (primary) / `#475569` (secondary) / `#64748b` (dim) / `#94a3b8` (extra-dim), accent **blue `#3b82f6`** (hover `#2563eb`). Blue is now the site's own brand accent, so the platform-tree Fusion 360 node uses **cyan** (`cyan-300`/`cyan-500`/`cyan-600`) instead to stay visually distinct from the Onshape-root/brand blue; violet is still used for the SolidWorks node.
- **Fonts**: Lato (`--font-lato`, sans) + Geist Mono (`--font-geist-mono`) via `next/font/google`. (No longer Geist Sans.)
- **Style**: rounded corners (`rounded-md`/`rounded-lg`, softened from the old sharp-corner look) on buttons, cards, inputs, and panels; monospace eyebrows/labels in uppercase tracking-widest and terminal-style `[tag]` log lines are still used as a typographic motif.
- Key CSS classes in `globals.css`: `grid-bg` (now an intentional no-op — the coordinate-grid effect was dropped when softening the aesthetic), `gradient-text`, `header-glass` (light frosted-glass blur), `cursor-blink`, `morph-fade-in/out`, `form-field-enter`, `cad-scan-line`, `cad-pulse` (both currently unused dead CSS), `animate-fade-up/in`, `tree-draw` (hero git-tree branch draw-in; paths must set `pathLength={1}`), and the `.device-*` family (device shell for the stored DemoSection flight).
- **The app-window surfaces are an intentional exception**: `DemoShowcase.tsx`'s recording frames and the (currently unmounted) `DemoSection.tsx` mock app keep a self-contained dark palette (near-black `#0b0d11`/`#0e1014` bg, `#12151b` cards, `#1c2027` borders, amber `#fbbf24` warning badges) replicating the real Parametra desktop app — like product screenshots floating on the light page — rather than following the site-shell light theme. (`InterCadPanel.tsx` / `IntentWebViewer.tsx` belonged to the older chat-style mock and are no longer imported anywhere — kept in the repo for reuse.)

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 — no config file, `@import "tailwindcss"` in `globals.css`
- **Backend API**: external C# (ASP.NET Core) service at `https://api.parametra.ai` (repo `141712CA-D/parametra-infra-api`, AWS behind Cloudflare). This site is a **thin client** — all waitlist/contact logic, email (Resend), Google Sheets sync, Postgres, and Turnstile verification live in that backend.
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`) — widget only; secret-key verification is in the backend
- **Analytics**: Vercel Speed Insights, mounted in `layout.tsx`
- **Deployment**: Vercel (GitHub repo `141712CA-D/cadweb`, production branch `main`)
- **Tests**: Vitest + React Testing Library (jsdom), config in `vitest.config.mts` / `vitest.setup.ts`. Run `npm test` (or `npm run test:watch`). Suites live in `__tests__/`: `lib/` (scrollLock ref-counting, apiUrl, consumeExpired), `components/` (MorphSwitch phases, SignupForm validation/captcha-gating with a mocked Turnstile + fetch, DemoSection script-data invariants). DemoSection's demo data constants (`DOCUMENTS`, `PART_STUDIOS`, `SESSION_CHIPS`, `GRAPH_NODES`, `GRAPH_EDGES`, `APP_SCRIPT`, `HISTORY_EVENTS`) are exported for the data tests — **run `npm test` after editing the demo script**; the tests enforce chronological step delays, that reveal counts never shrink or overshoot their data (and finish fully revealed), that graph edges reference real node ids, the "27 nodes · 28 edges" copy, and that History events land inside the script's window. `DemoSection.gate.test.tsx` asserts the gated pull → home → intent-graph run; `deviceFlight.test.ts` covers the scroll-driven device flight (band continuity, docked stillness, dock-marker alignment).

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
│   ├── DemoSection.tsx     # STORED, UNMOUNTED — interactive mock-app demo on a 3D scroll runway (see below)
│   ├── DemoShowcase.tsx    # `#live-demo` — two overlapping app recordings, hover-focus on desktop (see below)
│   ├── GitTree.tsx         # Hero SVG git tree — blue neutral main + parallel per-tool branches
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

Section order: **hero fold (git tree) → app showcase (`#live-demo`) → platform tree → CTA band → Partners → footer**.

- `sessionStorage("introPlayed")` gates the intro animation (plays once per session); `mounted` state prevents hydration mismatch
- All "Join the Waitlist" triggers (header, hero, CTA band, footer link) open **SignupModal** via shared state in `page.tsx`; standalone pages fall back to `/signup`
- CTA band: "Releasing Soon" eyebrow, "Stop rebuilding the same model." h2, button opening SignupModal
- Partners: Onshape logo (grayscale, colors on hover), below the CTA
- Footer shows version string (currently `v1.5.1.1`) centered in mono dim text

### Hero (`Hero.tsx`)

**Zone 1 — hero fold**: eyebrow "Parametra · v1.0 · Releasing Soon"; h1 "Inter-Software Git for CAD" (`text-4xl sm:text-5xl lg:text-6xl font-black`); the "Your model shouldn't be trapped…" description; blue waitlist button + "See the app →" button that scrolls to `#live-demo`. Right column: `GitTree` + a bold "Own. Your. Workflow." caption (blue "Workflow."). The tree is the app's loading-screen subway-map style: blue software-neutral main line, Onshape/SolidWorks/Fusion 360/CATIA branches that fork off main and run **parallel forever — branches deliberately never merge back** (persistence, not PRs); every line fades off the right edge via an SVG mask, and `.tree-draw` draws the lines in on mount. Scroll nudge (`fixed bottom-8` chevron) appears after 4s idle, hides at `scrollY > 60`.

**Zone 2 — DemoShowcase** (`#live-demo`): two app recordings in dark macOS-style window chrome — Home (`/homepage_recording.mov`) upper-left, Intent graph (`/graph_recording.mov`) lower-right. On lg+ the panes overlap diagonally (container `lg:aspect-[1.5]`, panes absolute `lg:w-[58%]`); hovering focuses a pane (z-raise, `scale-[1.03]`, blue-tinted border, caption slides up over the video) and dims the other to 55%. Below lg they stack with captions always visible as card footers, each fading up once via IntersectionObserver. One `<video>` per pane serves both layouts; both are force-played GIF-style (pause/visibilitychange listeners).

**Zone 3 — platform tree** (`treeRef`, `min-h-[300vh]`, sticky inner): 6 `platformStages` driven by scroll progress — Onshape root card → Fusion 360 + SolidWorks branch cards → per-branch `LeafList` capability leaves → "One prompt. Every tool." finale. Invisible-copy + `absolute inset-0` overlay pattern prevents reflow as the tree builds. Header h2/p use the invisible-spacer pattern.

> The old Zone-2 pinned terminal simulation ("How it generates", `TerminalAccumulator`/`TerminalSwap`, `#generation-demo`) was **removed** — redundant with the real demo video and `/how-it-works`.

### DemoSection (`DemoSection.tsx`) — STORED, currently unmounted

**Not rendered anywhere** — replaced on the homepage by DemoShowcase, but kept in the repo (with its tests, which still run and pass) for reuse. Note its dock-marker anchor (`DOCK_ANCHOR_ID`) is therefore absent from the DOM; Hero scrolls to `#live-demo` directly.

Scripted mock-app demo replicating the **real Parametra desktop app** (dark theme, macOS titlebar, app header with capture badges, sidebar, dashboard views). The one run is **Pull from Onshape → Home dashboard → Intent graph**, driven entirely by exported constants (`APP_SCRIPT` reveals `DOCUMENTS`/`PART_STUDIOS`/`SESSION_CHIPS`/`GRAPH_NODES` by count while `HISTORY_EVENTS` stream into the History tab) — covered by invariant tests, run `npm test` after editing them.

- **Views** (`view` state): `pulling` (logo + subway-map branch lines + status line), `home` (hero banner, stat cards, Documents list, capture details with Part Studios, fetch-activity heatmap), `graph` (stat cards, Example Workflow panel, "Read this session" chips, 27-node/28-edge SVG intent graph with legend + help card), `history` (session event feed). Header flips "No capture open" → "Part Studio 1" + amber partial/2-warnings badges mid-run.
- **Sidebar**: Home, **History** (with live event-count chip), Inter-op group (only "Intent graph" navigates; the rest are inert set dressing), and an **account/login chip pinned bottom-left** — clicking toggles Guest "Sign in →" ↔ "Sandeep S. · Onshape connected" (pure mock, no real auth). Nav is inert until the run completes (`done`).
- **Gated start (all breakpoints)**: the demo never auto-plays. A `!started` overlay ("▶ Start mock application") covers the window; clicking `startDemo()` snaps to the dock marker (`behavior: "instant"` — smooth would strand mid-scroll under the lock), locks body scroll via shared `lockScroll()`, plays `APP_SCRIPT` (~9.5s), then unlocks and sets `sessionStorage("demoAnimPlayed")`.
- Already played this session → mount effect fast-forwards to the completed intent-graph state, no gate, no lock.
- After completion: desktop-only fake-cursor hint tour (once per session, `cursorHintPlayed`) — clicks the History tab, hovers the login chip (never clicks it), then returns to the Intent graph. The tour holds the scroll lock until it finishes.
- Mobile (<sm): the sidebar (including the login chip) lives in a hamburger slide-in shelf; the main view fills the window. Content grids need explicit `grid-cols-1` (Tailwind's `minmax(0,1fr)`) — an implicit `auto` track sizes to card min-content and overflows the phone window.

#### Device flight (`lib/deviceFlight.ts` + `DeviceShell.tsx`)

The section is a **`RUNWAY_SVH` (170svh) scroll runway** with a `sticky top-0`, 100svh stage inside it. The window flies in from the back-left as a MacBook (`sm+`) or phone (`<sm`), rotating upright and dissolving its shell as it docks — **and then stays put**. There is deliberately **no fly-out**: once docked it holds position for the rest of the runway and leaves the same way any other section does, by scrolling off the top. (An outward exit arc was built and then removed — don't reintroduce it.)

- `flightAt(p)` is pure and unit-tested (`__tests__/lib/deviceFlight.test.ts`) — entry `[0, ENTRY_END)` (0.42), docked `[ENTRY_END, 1]`. The docked band returns `DOCKED_FRAME`, whose `transform` is `none` so docked text renders crisp; a test walks the whole band asserting nothing moves.
- The scroll handler writes **straight to the DOM** on one element (transform, opacity, `--chrome`, `pointer-events`) via rAF — the demo subtree is far too heavy to re-render per frame. Nothing here is React state.
- `DeviceShell` is pure CSS (`.device-*` in `globals.css`) sized off the single `--chrome` var: `1` = full body, `0` = every layer collapsed to zero size and opacity, leaving the window untouched.
- **The dock marker** (`DOCK_MARKER_TOP_SVH`, an absolutely-positioned 1px div) is what `startDemo` scrolls to. Aiming at the section's top instead would land progress at 0 — the window still mid-flight — so keep them in sync if the band constants change.
- The window is only interactive while docked (`pointer-events: none` otherwise), and `prefers-reduced-motion` skips the flight entirely.
- **The fake cursor layer must stay outside the stage**: both `perspective` and `transform` make an ancestor the containing block for `position: fixed`, which would pin the cursor to the flying window rather than the viewport.

### scrollLock (`lib/scrollLock.ts`)

Reference-counted `document.body.style.overflow` lock shared by NodeIntro, SignupModal, and DemoSection — prevents one consumer's unlock from clobbering another's lock. Always pair lock/unlock and release on unmount.

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
- Turbopack's persistent cache can keep serving stale `globals.css` after edits made while `next dev` is running (even across server restarts) — if CSS changes don't show up, `rm -rf .next` and restart
- Commit messages in this repo must contain **no Claude/AI references** (no Co-Authored-By or session trailers)
