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

console.log("Migration complete.");
