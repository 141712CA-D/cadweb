// Base URL for the Parametra backend API (C# service on AWS, fronted by Cloudflare).
// Set via NEXT_PUBLIC_API_URL (e.g. https://api.parametra.ai). Falls back to same-origin
// so a missing env var fails loudly against a non-existent local route rather than silently.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiUrl = (path: string) => `${API_BASE}${path}`;
