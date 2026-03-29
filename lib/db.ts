import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.WAITLIST_STORAGE_POSTGRES_URL!);
