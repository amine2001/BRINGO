// Routing helpers for delay alerts without changing the DB schema
import type { DelayAlertStatus } from "./types";

type ChatRouting = {
  fallback: string;
  acceptance?: string | null;
  preparation?: string | null;
  delivery?: string | null;
};

const PREFIXES = {
  acceptance: ["A", "ACC"] as const,
  preparation: ["P", "PREP"] as const,
  delivery: ["D", "DEL"] as const,
  fallback: ["F", "DEF", "DEFAULT"] as const,
} as const;

export function decodeChatRouting(raw: string | null | undefined): ChatRouting {
  const fallback = (raw ?? "").trim() || "";
  const routing: ChatRouting = { fallback };
  if (!raw || !raw.includes(";")) {
    return routing;
  }

  const map = new Map(
    raw
      .split(";")
      .map((piece) => piece.trim())
      .filter(Boolean)
      .map((piece) => {
        const [prefix, ...rest] = piece.split(":");
        return [prefix?.toUpperCase(), rest.join(":")] as const;
      })
      .filter(([prefix, value]) => prefix && value),
  );

  const pick = (keys: readonly string[]) => {
    for (const key of keys) {
      const val = map.get(key);
      if (val) return val;
    }
    return undefined;
  };

  routing.fallback = pick(PREFIXES.fallback) ?? routing.fallback;
  routing.acceptance = pick(PREFIXES.acceptance) ?? null;
  routing.preparation = pick(PREFIXES.preparation) ?? null;
  routing.delivery = pick(PREFIXES.delivery) ?? null;
  return routing;
}

export function encodeChatRouting(routing: ChatRouting): string {
  const parts: string[] = [];
  if (routing.acceptance) parts.push(`A:${routing.acceptance}`);
  if (routing.preparation) parts.push(`P:${routing.preparation}`);
  if (routing.delivery) parts.push(`D:${routing.delivery}`);
  parts.push(`F:${routing.fallback}`);
  const encoded = parts.join(";");
  // Keep within the 64-char column; fall back to default if it would overflow
  return encoded.length <= 64 ? encoded : routing.fallback;
}

export function resolveChatIdForStatus(raw: string, status: DelayAlertStatus): string {
  const routing = decodeChatRouting(raw);
  if (status === "prepared") {
    return routing.delivery || routing.fallback;
  }

  if (status === "accepted" || status === "new") {
    return routing.acceptance || routing.preparation || routing.fallback;
  }

  return routing.fallback;
}
