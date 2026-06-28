# Parametra.ai — Website Claude Agent Guide

Pre-launch marketing site for Parametra.ai, an AI-powered multi-agent CAD design tool for Onshape. Built with Next.js 16, Tailwind CSS v4, TypeScript.

**Current version: v1.6.0**
- Hero redesigned: badge removed, subtitle is "Built by Engineers · For Everyone · Releasing Soon"
- Hero right panel: animated crossfade between `/OnshapeRaw.png` and `/OnshapeDemo.png` every 3.2s (900ms fade), status bar overlay shows current phase
- Hero right panel: description paragraph sits above the image card
- Hero prompt box: label "TEST PROMPT", typewriter animation cycles 4 prompts — main prompt holds 5000ms, others 2200ms; 36ms/char typing, 14ms/char erasing; invisible spacer locks box height on mobile
- Hero background gradients: both top AND bottom use blue-600 `rgba(37,99,235,...)` (previously top was sky, bottom was emerald)
- "Scroll the demo" button removed; scroll nudge (font-mono "scroll" + bouncing chevron) fades in after 4s idle, disappears when `scrollY > 60`
- Bottom feature cards ("Native workflow", "Editable output", "Prompt to iteration") removed
- New **platform tree** scroll section added after terminal demo (see Hero section below)
- `cursor-blink` keyframe + class added to `globals.css` (step-end, 1s)
- About Us link now visible on mobile header (removed `hidden sm:block`)
- About page: social links added — Andy has LinkedIn, Sandeep has LinkedIn + Website; icons on mobile, text labels on desktop
- About page: cards are fully clickable (stretched link pattern, `absolute inset-0 z-10`) — Andy → LinkedIn, Sandeep → personal website; social buttons sit above at `z-20`
- About page: Andy's card has `mt-6` offset and photo `objectPosition: center 15%`
- `icons` map in `about/page.tsx` holds inline SVGs for LinkedIn and Website
- React import added to `about/page.tsx` for `React.ReactNode` type
- Waitlist + contact role dropdown: "Project Manager" replaced with "Freelancer"
- Instructor role now shows "Where do you teach?" school field (same `university` DB column, no migration needed)
- Student school field placeholder: "Where do you attend?"
- API route validates school required for both Student and Instructor roles separately
- Role allowlist validation added to API: `["Student", "Instructor", "Freelancer", "Hobbyist"]`

---

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 — no config file, uses `@import "tailwindcss"` in `globals.css`
- **Language**: TypeScript
- **Backend API**: external C# (ASP.NET Core) service at `https://api.parametra.ai` (repo `141712CA-D/parametra-infra-api`, deployed on AWS behind Cloudflare). This site is a **thin client** — all waitlist/contact logic, email (Resend), Google Sheets sync, Postgres, and Turnstile *verification* live in that backend. The front end no longer has any API routes, DB access, or server secrets.
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`) — widget only; the secret-key verification happens in the backend
- **Fonts**: Geist Sans + Geist Mono via `next/font/google`
- **Analytics**: Vercel Speed Insights (`@vercel/speed-insights/next`) — mounted in `layout.tsx`
- **Deployment**: Vercel (connected to GitHub repo `141712CA-D/cadweb`, branch `main`)

---

## Environment Variables

Since the backend moved to `api.parametra.ai`, the front end is a thin client and needs **only public (`NEXT_PUBLIC_`) vars**. All email/Google/Postgres/Turnstile-secret config now lives on the C# backend, not here. Stored in `.env.local` locally and in Vercel's encrypted storage. Never committed.

```
NEXT_PUBLIC_API_URL                 # Backend base URL — https://api.parametra.ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY      # Cloudflare Turnstile site key (browser-safe)
NEXT_PUBLIC_MAIL_FROM_EMAIL         # Sender shown in the "unmark as spam" UI notice (optional; defaults to no-reply@parametra.ai)
CRON_SECRET                         # Server-only. Authenticates Vercel Cron → /api/cron/sync-waitlist
ADMIN_SYNC_SECRET                   # Server-only. Forwarded as X-Admin-Secret; MUST equal the backend's ADMIN_SYNC_SECRET
```

> `NEXT_PUBLIC_*` vars are **build-time inlined** — changing one in Vercel requires a redeploy to take effect. `CRON_SECRET` / `ADMIN_SYNC_SECRET` are server-only (no `NEXT_PUBLIC_` prefix) and read at runtime by the cron route.
>
> The old server secrets (`RESEND_API_KEY`, `GOOGLE_*`, `TURNSTILE_SECRET_KEY`, `WAITLIST_STORAGE_POSTGRES_URL`, `SYNC_SECRET`, `CRON_SECRET`, `MAIL_FROM_EMAIL`, `MAIL_TO_EMAIL`) have been removed from this project and should be **deleted from the Vercel dashboard** too. They now live in the AWS/backend environment.

---

## File Structure

```
app/
├── layout.tsx              # Root layout — fonts, metadata, favicon, SpeedInsights, tabIndex on body
├── page.tsx                # Home page — manages intro animation state via sessionStorage
├── globals.css             # All custom CSS: animations, orbs, grid, gradient-text, etc.
│
├── components/
│   ├── DevBanner.tsx       # Fixed top bar "This project is currently in development" with ping dot
│   ├── Header.tsx          # Fixed header (sits below DevBanner at top-8). Logo + About Us + Join waitlist
│   ├── Hero.tsx            # Full landing page hero section with terminal demo and three pillars
│   └── IntroAnimation.tsx  # Cinematic intro overlay — phases: idle→scan→type→burst→exit
│
├── about/page.tsx          # About Us page — Andrew Yang and Sandeep Sawhney cards
├── signup/page.tsx         # Waitlist form — Individual (with university if Student) + Team tabs
├── contact/page.tsx        # Contact form — Individual + Team tabs, subject + message
│
└── api/
    └── cron/sync-waitlist/route.ts  # ONLY remaining route — Vercel-cron proxy. Verifies CRON_SECRET,
                                     # forwards to backend POST /api/admin/sync-waitlist with X-Admin-Secret.
                                     # (All real app logic lives in the api.parametra.ai backend.)

lib/
└── api.ts                  # apiUrl(path) helper — prefixes NEXT_PUBLIC_API_URL onto backend calls

vercel.json                 # Vercel Cron: /api/cron/sync-waitlist runs daily at 00:00 UTC
```

---

## Pages

### Home (`/`)
- Renders `DevBanner` + `IntroAnimation` + `Header` + `Hero` + footer
- `sessionStorage("introPlayed")` controls whether intro animation runs
  - First visit: animation plays, sets flag on completion
  - Return visit: skips animation, page appears instantly (`transition: none`)
  - "← Back to home" on success pages clears the flag so animation replays
- `mounted` state gates IntroAnimation to prevent hydration mismatch (sessionStorage not available on server)
- Footer: © year + nav links + `v1.5.0` centered in monospace dim text

### Intro Animation (`IntroAnimation.tsx`)
- Phases and timings:
  ```
  PHASE_RISE    = 80ms    logo + title rise from bottom
  PHASE_TEXT    = 350ms   tagline fades in
  PHASE_REVEAL  = 800ms   call onDone so page is ready underneath
  PHASE_SLIDE   = 900ms   overlay slides up (curtain reveal)
  PHASE_UNMOUNT = 1650ms  remove from DOM
  ```
- Locks `document.body.style.overflow = "hidden"` on mount, restores at PHASE_REVEAL
- `document.body.focus()` called at PHASE_REVEAL for scroll restoration
- Logo and title in a `flex-col items-center gap-0` container; title uses `mt-2 sm:-mt-6` — small positive gap on mobile, slight overlap on desktop (do NOT use large negative margins, it causes the logo to clip into the title on mobile)
- Color palette: blue (`rgba(37,99,235,...)`) and sky (`rgba(14,165,233,...)`)

### Hero (`Hero.tsx`)
Hero has three scroll zones:

**1 — Initial viewport (above fold)**
- Left column: h1 tagline, subtitle "Built by Engineers · For Everyone · Releasing Soon", TEST PROMPT box with typewriter, "Join the waitlist" CTA
- TEST PROMPT typewriter: `typingPrompts` array of 4 prompts, driven by `typingPhase` / `charPos` / `promptIdx` state + `useEffect` chain; invisible spacer prevents mobile reflow
- Right column: description paragraph + image card (`OnshapeRaw.png` / `OnshapeDemo.png` crossfade via `demoView` state toggled every 3200ms by `setInterval`; status bar overlay inside image)
- Scroll nudge: `showNudge` state — `setTimeout(4000)` shows it, scroll listener hides it at `scrollY > 60`; renders as `fixed bottom-8` chevron

**2 — Pinned terminal demo** (`#generation-demo`, `ref={demoRef}`, `min-h-[500vh]`)
- 4 stages (`stages` array): Prompt intake → Sketch solver → Feature build → Ready in Onshape
- `activeIndex` driven by scroll progress through `demoRef` height
- Desktop: `TerminalAccumulator` — terminals accumulate in a 2×2 grid as you scroll
- Mobile: `TerminalSwap` — one terminal visible at a time, fades in/out
- Stage dots use per-stage `accent` color class

**3 — Platform tree section** (`ref={treeRef}`, `min-h-[600vh]`)
- 6 stages (`platformStages`): Generated in Onshape → Persisted in Fusion 360 → Persisted in SolidWorks → Fusion 360 · Simulation → SolidWorks · Simulation → One prompt. Every tool.
- `platformIndex` driven by scroll progress through `treeRef` height
- `PlatformTree` component:
  - Root: Onshape card (always visible), `[done]` line turns emerald at stage 5
  - Trunk → crossbar (`mx-[25%]`) → drops → 2-column grid with Fusion 360 (stage 1) and SolidWorks (stage 2) branch cards
  - `LeafList` component below each branch: vertical trunk with left-border rail + horizontal tick connectors to leaf cards
  - Fusion 360 leaves (stage 3): `[cam]`, `[gen-design]`, `[static-fea]`, `[thermal]`, `[event-sim]`
  - SolidWorks leaves (stage 4): `[config]`, `[static-sim]`, `[flow-sim]`, `[drop-test]`, `[motion]`
- Mobile stability: section header `h2` + `p` use invisible-spacer pattern; entire `PlatformTree` is wrapped in `relative` with an invisible `activeIndex=5` copy below and the real tree `absolute inset-0` on top — prevents any reflow/jump as tree builds
- Background gradients: both top and bottom radial gradients use `rgba(37,99,235,...)` (blue-600)

### Header (`Header.tsx`)
- Fixed at `top-8` (below the 32px DevBanner at `top-0`, `z-[60]`)
- Scrolled state adds `header-glass` (backdrop blur) + border
- Mobile: "About Us" hidden (`hidden sm:block`), "Join the waitlist" shortens to "Waitlist"
- Logo: plain `<img>` tag (NOT Next.js `<Image>`) with `style={{ width: 32, height: 32, display: "block" }}` — Next.js Image caused vertical displacement bugs with the SVG

### About (`/about`)
- Andrew Yang — Mechanical Engineering, image left / text right on desktop
- Sandeep Sawhney — Computer Engineering, image right / text left on desktop
- Both: University of Michigan, Class of 2029, from New York
- Mobile: cards stack, text centered, major on line 1 / university+class on line 2 (`sm:hidden` / `hidden sm:block`)
- Images: `/AndyHeadshot.png`, `/SandeepHeashot.jpg` (note typo in filename — keep as-is)
- Andy's photo: `objectPosition: center 15%` — shifted slightly down from top
- Andy's card has `mt-6` to offset it lower toward Sandeep's card
- Cards are clickable via stretched link pattern (`absolute inset-0 z-10`) — Andy → LinkedIn, Sandeep → personal website; works on mobile and desktop
- Social buttons at `z-20` so they intercept their own taps above the card link
- Social links: Andy has LinkedIn only; Sandeep has LinkedIn + Website
- Mobile: social buttons show inline SVG icons (LinkedIn logo, globe); desktop: text labels
- `icons` map at top of file holds SVGs keyed by label string (`"LinkedIn"`, `"Website"`)
- `primaryHref` field on each team member drives the card click destination

### Overview (`/overview`)
- Two sections:
  1. **The Vision for CADen** — pipeline flow tree (ASME Drawing + Direct Prompt → CADen Pipeline → Onshape model)
  2. **Beyond Onshape** — two cards:
     - Universal CAD Translation: SolidWorks / Fusion 360 / CATIA / FreeCAD → any target platform
     - Onshape Native Integration: prompt-to-CAD in Onshape (labeled "Phase 1 — Coming Soon", NOT live yet)

### Waitlist (`/signup`)
- Two tabs: Individual | Team / Organization
- Individual fields: Name, Email, Role (Student/Instructor/Freelancer/Hobbyist), University/Institution/School (shown if Role === "Student" or "Instructor", with role-specific placeholder), Why CADen
- Team fields: Rep Name, Email, Organization, Role (text input), Intended Usage
- Cloudflare Turnstile widget — submit button disabled until token received
- Four success states:
  - `"success"` — "You're on the list." (new user)
  - `"welcome_back"` — "Welcome back to the list." (previously removed user re-registering)
  - `"duplicate"` — "Already registered." (email already active in DB)
  - `"error"` — generic error
- All success states show spam notice: "If this is your first time receiving an email from developers@projcaden.dev, please unmark us as spam if applicable."
- Clears `document.body.style.overflow` on mount (prevents scroll lock bleed from home page)

### Contact (`/contact`)
- Two tabs: Individual | Team / Organization (same tab pattern as waitlist)
- Individual fields: Name, Email, Role (Student/Instructor/Freelancer/Hobbyist/Other), University (if Student), Subject, Message
- Team fields: Rep Name, Email, Organization, Your Role (text input), Subject, Message
- Same Turnstile setup as waitlist
- On success: "Message received." state + spam notice
- Clears `document.body.style.overflow` on mount

---

## Database & sync

The Postgres schema (`waitlist_entries`, `pending_verifications`, `contact_rate_limits`), the double opt-in verification flow, dedup/soft-delete logic, Google Sheet sync, and EF Core migrations all now live in the **C# backend** (`parametra-infra-api`). This front end has **no** database access. See that repo for schema and sync details.

> Note: the backend syncs the sheet inline on each waitlist request/verify. A nightly safety rebase also runs at 00:00 UTC: Vercel Cron → `app/api/cron/sync-waitlist` (proxy) → backend `POST /api/admin/sync-waitlist`. This catches manual sheet edits/deletions on days with no signups. Crons run on **production only**, not preview.

---

## Form Validation

Both `/signup` and `/contact` use the same validation pattern:

- `noValidate` on the form element — disables browser native validation
- `errors` state: `Record<string, string>`
- `validate()` — checks all required fields, returns boolean, sets all errors at once
- `clearError(field)` — removes a single field's error as soon as the user starts correcting it
- Tab switching clears all errors: `onClick={() => { setType(t); setErrors({}); }}`
- `inputClass(error?: string)` is a function — passes `"border-red-500/60"` when error present, `"border-white/10"` otherwise
- Inline error messages under each field: `errorClass = "text-xs text-red-400/80 mt-1.5"`
- Email validation: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — shows "Please enter a valid email address."
- Captcha error shown if Turnstile not completed before submit

### Select Dropdown Styling
- `appearance-none` removes native browser arrow
- Custom SVG chevron via inline `backgroundImage` (URL-encoded), positioned `right 14px center`
- `pr-10` prevents text overlapping the chevron
- `font-sans` forces Geist Sans (select elements don't inherit font by default)
- Placeholder color: `rgba(255,255,255,0.25)` when no value selected, `rgba(255,255,255,1)` when value chosen — set via inline `style` since Tailwind can't conditionally override `text-white`

---

## Backend API (api.parametra.ai)

The front end calls the C# backend through `apiUrl()` (`lib/api.ts`), which prefixes `NEXT_PUBLIC_API_URL`. All endpoints below live in the `parametra-infra-api` repo, **not** in this project. The two-step flow (request a code → verify it) is now **two distinct paths** instead of a `body.step` discriminator.

| Method & path | Called from | Body / query | Notes |
|---|---|---|---|
| `POST /api/waitlist/request` | `signup` submit | `{ type, ...fields, captchaToken }` | captcha + validation + dedup, emails a 6-digit code. `{success, pending}` / 409 `already_registered` |
| `POST /api/waitlist/verify` | `signup` verify | `{ email, code }` | confirms code, completes signup. `{success, returning}`. Errors: 400 mismatch/not_found, 410 expired, 429 too_many_attempts |
| `GET /api/waitlist/check?email=` | `signup` debounced dedup | — | `{status: "available" \| "registered" \| "returning" \| "invalid"}` |
| `POST /api/contact/request` | `contact` submit | `{ type, ...fields, captchaToken }` | captcha + validation + rate-limit (IP 5/10min, email 2/30min), emails code. 429 `{retryAfter}` when limited |
| `POST /api/contact/verify` | `contact` verify | `{ email, code }` | confirms code, sends the message. Same error-status mapping as waitlist |

Response JSON shapes and HTTP status codes match what the client already branches on, so no client-side response handling changed — only the URLs and the dropped `step` field.

**CORS:** the backend allowlists `https://parametra.ai` and `https://www.parametra.ai`. If a new front-end origin is added (preview domains, etc.), it must be added to the backend's CORS policy.

---

## Styling Notes

- **Color palette**: Black base (`#000`), blue-600 (`rgba(37,99,235,...)`) and sky-400 (`rgba(14,165,233,...)`)
- **No violet/cyan** — was replaced with blue/sky throughout (violet is used only in PlatformTree for SolidWorks node color)
- **`gradient-text`**: `linear-gradient(135deg, #ffffff 0%, #93c5fd 40%, #38bdf8 100%)`
- **`glow-button`**: animated box-shadow pulse in blue
- **`badge-shimmer`**: sweeping gradient animation on hero badge
- **`grid-bg`**: subtle white grid lines with pulsing opacity
- **`header-glass`**: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(16px)`
- **`particle`**: uses CSS custom properties `--duration` and `--delay` for per-particle timing
- **`cursor-blink`**: `step-end` animation at 1s — used for typewriter cursor in hero prompt box
- All keyframes defined in `globals.css`

---

## Known Quirks

- `SandeepHeashot.jpg` — filename typo (missing 'd'), keep as-is
- Logo is `/public/logo.svg` — referenced as `"/logo.svg"` via plain `<img>` tag in Header and Next.js `<Image>` in IntroAnimation
- `GOOGLE_PRIVATE_KEY` in `.env.local` has `\n` escaped as `\\n` — code does `.replace(/\\n/g, "\n")` to restore newlines at runtime
- Resend client in `contact/route.ts` initialized **inside** the handler; in `waitlist/route.ts` initialized at module level — both work, keep as-is
- `tabIndex={-1}` on `<body>` in `layout.tsx` — makes body programmatically focusable for scroll restoration after intro animation completes
- About page uses explicit `lg:items-start lg:text-left` / `lg:items-end lg:text-right` instead of dynamic Tailwind class names (v4 purges dynamic template literal classes)
- Turnstile widget requires network access to Cloudflare — may not appear on poor mobile connections
- Select `color` can't be conditionally overridden via Tailwind utility classes when `text-white` is already set by `inputClass` — use inline `style` instead
- `WAITLIST_STORAGE_POSTGRES_URL` is the env var name (not `POSTGRES_URL`) — Vercel prefixed it based on the database name when connecting
- `CRON_SECRET` is auto-generated by Vercel but must be manually added to env vars and set equal to `SYNC_SECRET` for the cron auth to work
