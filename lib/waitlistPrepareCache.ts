"use client";

export const PREPARE_STORAGE_KEY = "waitlistPrepareDataV1";
export const PREPARE_EVENT = "waitlist-prepare-updated";

export type WaitlistHashSets = {
  registered: Set<string>;
  returning: Set<string>;
};

let cachedHashSets: WaitlistHashSets | null = null;

function normalizeHashes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is string => typeof value === "string");
}

function buildHashSets(registered: string[], returning: string[]): WaitlistHashSets {
  return {
    registered: new Set<string>(registered),
    returning: new Set<string>(returning),
  };
}

export function getPreparedHashSets(): WaitlistHashSets | null {
  return cachedHashSets;
}

export function hydratePreparedHashSetsFromStorage(): WaitlistHashSets | null {
  if (cachedHashSets) return cachedHashSets;

  const raw = localStorage.getItem(PREPARE_STORAGE_KEY);
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as { registered?: unknown; returning?: unknown };
  cachedHashSets = buildHashSets(
    normalizeHashes(obj.registered),
    normalizeHashes(obj.returning),
  );
  return cachedHashSets;
}

export function writePreparedHashSets(registeredInput: unknown, returningInput: unknown): WaitlistHashSets {
  const registered = normalizeHashes(registeredInput);
  const returning = normalizeHashes(returningInput);

  cachedHashSets = buildHashSets(registered, returning);
  localStorage.setItem(
    PREPARE_STORAGE_KEY,
    JSON.stringify({ registered, returning, updatedAt: Date.now() }),
  );
  window.dispatchEvent(new Event(PREPARE_EVENT));
  return cachedHashSets;
}
