import { apiUrl } from "@/lib/api";

export type ConsumeExpiredKind = "waitlist" | "contact";

export function consumeExpired(kind: ConsumeExpiredKind) {
  return fetch(apiUrl(`/api/${kind}/consume-expired`), {
    method: "POST",
    keepalive: true,
  }).catch((err) => {
    console.error(`Failed to consume expired ${kind} data:`, err);
  });
}
