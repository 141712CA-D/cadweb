# Project CADen — Website Claude Agent Guide

Pre-launch marketing site for Project CADen, an AI-powered multi-agent CAD design tool for Onshape. Built with Next.js 16, Tailwind CSS v4, TypeScript.

---

## Stack

- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 — no config file, uses `@import "tailwindcss"` in `globals.css`
- **Language**: TypeScript
- **Email**: Resend (`resend` package)
- **Spreadsheet**: Google Sheets API (`googleapis` package)
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`)
- **Fonts**: Geist Sans + Geist Mono via `next/font/google`
- **Deployment**: Vercel (connected to GitHub repo `SandeepSawhney2015/cadweb`, branch `main`)

---

## Environment Variables

All stored in `.env.local` locally and in Vercel's encrypted environment variable storage. Never committed to GitHub.

```
RESEND_API_KEY                  # Resend email service
GOOGLE_SHEET_ID                 # Google Sheets spreadsheet ID
GOOGLE_SERVICE_ACCOUNT_EMAIL    # Google service account for Sheets API
GOOGLE_PRIVATE_KEY              # Private key (full PEM block, \n escaped)
NEXT_PUBLIC_TURNSTILE_SITE_KEY  # Cloudflare Turnstile (public, browser-safe)
TURNSTILE_SECRET_KEY            # Cloudflare Turnstile (server-side only)
```

`NEXT_PUBLIC_` prefix exposes a var to the browser. All others are server-side only.

---

## File Structure

```
app/
├── layout.tsx              # Root layout — fonts, metadata, favicon, tabIndex on body
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
    ├── waitlist/route.ts   # POST — verifies Turnstile, validates fields, sends email + appends to Google Sheet
    └── contact/route.ts    # POST — verifies Turnstile, validates fields, sends email
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
- Footer: © year + nav links + `v1.4.0` centered in monospace dim text

### Intro Animation (`IntroAnimation.tsx`)
- Phases and timings:
  ```
  PHASE_SCANLINE  = 300ms   scan line sweeps
  PHASE_TYPING    = 900ms   typewriter starts ("Project CADen", 13 chars × 70ms = ~1810ms done)
  PHASE_BURST     = 1900ms  radial burst ring
  PHASE_EXIT      = 2300ms  overlay fades out, scroll unlocked, pointer-events disabled
  PHASE_UNMOUNT   = 3000ms  component removed from DOM, onDone() called
  ```
- Locks `document.body.style.overflow = "hidden"` on mount, restores at PHASE_EXIT
- Sets `pointerEvents: "none"` at PHASE_EXIT so content behind is immediately interactive
- `document.body.focus()` called at PHASE_EXIT for scroll restoration
- Color palette: blue (`rgba(37,99,235,...)`) and sky (`rgba(14,165,233,...)`)

### Hero (`Hero.tsx`)
- Ambient glow orbs (animated via `orb-1/2/3` CSS classes)
- Floating particles (10 items, CSS custom properties `--duration` and `--delay`)
- Terminal demo window showing multi-agent session (`sketch agent [1/4]` → extrusion → fillet → edit agents)
  - Terminal title bar: dots use `flex-shrink-0` so they never compress on mobile
  - Mobile title: `project-caden · sketch agent [1/4]` — desktop: full string
- Three-pillar row: "Describe it" / "Agents go to work" / "A complete model in Onshape"
- Double CTA: "Join the waitlist" (top + bottom repeat)

### Header (`Header.tsx`)
- Fixed at `top-8` (below the 32px DevBanner at `top-0`, `z-[60]`)
- Scrolled state adds `header-glass` (backdrop blur) + border
- Mobile: "About Us" hidden (`hidden sm:block`), "Join the waitlist" shortens to "Waitlist"
- Logo: `/logo copy.png` from public (note the space in filename)

### About (`/about`)
- Andrew Yang — Mechanical Engineering, image left / text right on desktop
- Sandeep Sawhney — Computer Engineering, image right / text left on desktop
- Both: University of Michigan, Class of 2029, from New York
- Mobile: cards stack, text centered, major on line 1 / university+class on line 2 (`sm:hidden` / `hidden sm:block`)
- Images: `/AndyHeadshot.png`, `/SandeepHeashot.jpg` (note typo in filename — keep as-is)
- No click behavior on cards (intentional, future feature)

### Waitlist (`/signup`)
- Two tabs: Individual | Team / Organization
- Individual fields: Name, Email, Role (Student/Instructor/Project Manager/Hobbyist), University (shown only if Role === "Student"), Why CADen
- Team fields: Rep Name, Email, Organization, Role (text input), Intended Usage
- Cloudflare Turnstile widget — submit button disabled until token received
- On success: "You're on the list." state with "← Back to home" that replays intro animation
- Clears `document.body.style.overflow` on mount (prevents scroll lock bleed from home page)

### Contact (`/contact`)
- Two tabs: Individual | Team / Organization (same tab pattern as waitlist)
- Individual fields: Name, Email, Role (Student/Instructor/Project Manager/Hobbyist/Other), University (if Student), Subject, Message
- Team fields: Rep Name, Email, Organization, Your Role (text input), Subject, Message
- Same Turnstile setup as waitlist
- On success: "Message received." state
- Clears `document.body.style.overflow` on mount

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

## API Routes

### `POST /api/waitlist`
1. Verifies Cloudflare Turnstile token server-side
2. **Server-side field validation** — returns 400 if any required field is missing, email is invalid format, or `type` is not `"individual"` or `"team"`; also checks university required when role is Student
3. Sends formatted HTML email via Resend (`from: developers@projcaden.dev`, `to: developers@projcaden.dev`)
4. Appends row to Google Sheet via service account auth
   - Columns: Timestamp | Type | Name/Rep | Email | Role | University | Reason/Usage | Organization
5. Email + sheet write run in parallel via `Promise.all`

### `POST /api/contact`
1. Verifies Cloudflare Turnstile token server-side
2. **Server-side field validation** — same pattern as waitlist; validates both `individual` and `team` types
3. Sends formatted HTML email via Resend (`from/to: developers@projcaden.dev`)
   - Individual subject: `[CADen Contact] {subject} — {name}`
   - Team subject: `[CADen Contact — Team] {subject} — {repName} ({org})`
4. Both route handlers initialize Resend **inside** the handler (not module level) — avoids build-time errors

### Shared validation helpers (in each route)
```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function missing(...vals: unknown[]) {
  return vals.some((v) => !v || (typeof v === "string" && !v.trim()));
}
```

---

## Styling Notes

- **Color palette**: Black base (`#000`), blue-600 (`rgba(37,99,235,...)`) and sky-400 (`rgba(14,165,233,...)`)
- **No violet/cyan** — was replaced with blue/sky throughout
- **`gradient-text`**: `linear-gradient(135deg, #ffffff 0%, #93c5fd 40%, #38bdf8 100%)`
- **`glow-button`**: animated box-shadow pulse in blue
- **`badge-shimmer`**: sweeping gradient animation on hero badge
- **`grid-bg`**: subtle white grid lines with pulsing opacity
- **`header-glass`**: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(16px)`
- **`particle`**: uses CSS custom properties `--duration` and `--delay` for per-particle timing
- All keyframes defined in `globals.css`

---

## Known Quirks

- `SandeepHeashot.jpg` — filename typo (missing 'd'), keep as-is
- `logo copy.png` — active logo in `/public` (space in name), referenced everywhere as `"/logo copy.png"`
- `GOOGLE_PRIVATE_KEY` in `.env.local` has `\n` escaped as `\\n` — code does `.replace(/\\n/g, "\n")` to restore newlines at runtime
- Resend and Google Sheets clients initialized **inside** route handlers, not at module level — avoids build-time errors when env vars aren't present during Vercel build
- `tabIndex={-1}` on `<body>` in `layout.tsx` — makes body programmatically focusable for scroll restoration after intro animation completes
- About page uses explicit `lg:items-start lg:text-left` / `lg:items-end lg:text-right` instead of dynamic Tailwind class names (v4 purges dynamic template literal classes)
- Turnstile widget requires network access to Cloudflare — may not appear on poor mobile connections
- Select `color` can't be conditionally overridden via Tailwind utility classes when `text-white` is already set by `inputClass` — use inline `style` instead
