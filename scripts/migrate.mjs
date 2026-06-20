import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.WAITLIST_STORAGE_POSTGRES_URL);

await sql`
  CREATE TABLE IF NOT EXISTS waitlist_entries (
    id           SERIAL PRIMARY KEY,
    type         VARCHAR(20)  NOT NULL,
    name         TEXT         NOT NULL,
    email        TEXT         NOT NULL UNIQUE,
    role         TEXT,
    university   TEXT,
    reason       TEXT,
    organization TEXT,
    signed_up_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    synced_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_entries(email)
`;

// Add soft-delete columns if they don't exist yet
await sql`ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`;
await sql`ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;

await sql`DROP TABLE IF EXISTS contact_cooldowns`;

await sql`
  CREATE TABLE IF NOT EXISTS contact_rate_limits (
    key          TEXT        NOT NULL,
    kind         TEXT        NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count        INT         NOT NULL DEFAULT 1,
    PRIMARY KEY (key, kind)
  )
`;

// Pending email verifications (double opt-in). One row per (email, purpose);
// the full form submission is stashed in `payload` so the server — not the
// client — holds the data between the "request code" and "confirm code" steps.
await sql`
  CREATE TABLE IF NOT EXISTS pending_verifications (
    email      TEXT        NOT NULL,
    purpose    TEXT        NOT NULL,   -- 'waitlist' | 'contact'
    code       TEXT        NOT NULL,   -- 6-digit verification code
    payload    JSONB       NOT NULL,   -- the original form submission
    attempts   INT         NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (email, purpose)
  )
`;

console.log("Migration complete.");
