import { google } from "googleapis";
import { sql } from "@/lib/db";

export async function syncWaitlist(): Promise<{ synced: number }> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:H",
  });

  const rows = res.data.values ?? [];
  const dataRows = rows.slice(1).filter((r) => r[3]); // must have email (col D)

  const sheetEmails: string[] = [];

  for (const row of dataRows) {
    const [timestamp, type, name, email, role, university, reason, organization] = row;
    const normalizedEmail = (email as string).toLowerCase();
    sheetEmails.push(normalizedEmail);

    await sql`
      INSERT INTO waitlist_entries
        (type, name, email, role, university, reason, organization, signed_up_at, synced_at)
      VALUES (
        ${(type ?? "individual").toLowerCase()},
        ${name ?? ""},
        ${normalizedEmail},
        ${role ?? null},
        ${university || null},
        ${reason ?? null},
        ${organization || null},
        ${timestamp ? new Date(timestamp) : new Date()},
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        type         = EXCLUDED.type,
        name         = EXCLUDED.name,
        role         = EXCLUDED.role,
        university   = EXCLUDED.university,
        reason       = EXCLUDED.reason,
        organization = EXCLUDED.organization,
        synced_at    = NOW()
    `;
  }

  // Remove DB rows deleted from the sheet
  if (sheetEmails.length > 0) {
    const dbRows = await sql`SELECT email FROM waitlist_entries`;
    const toDelete = (dbRows as { email: string }[])
      .map((r) => r.email)
      .filter((e) => !sheetEmails.includes(e));
    for (const email of toDelete) {
      await sql`DELETE FROM waitlist_entries WHERE email = ${email}`;
    }
  }

  return { synced: sheetEmails.length };
}
