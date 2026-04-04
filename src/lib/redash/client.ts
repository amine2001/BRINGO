import "server-only";

import { parse as parseCsv } from "csv-parse/sync";

import { normalizeRedashRecords } from "./normalizers";
import type {
  RedashClientConfig,
  RedashFetchResult,
  RedashResponseFormat,
} from "./types";

type LooseRecord = Record<string, unknown>;

function toUrlWithApiKey(apiUrl: string, apiKey: string): string {
  try {
    const url = new URL(apiUrl);
    if (!url.searchParams.has("api_key")) {
      url.searchParams.set("api_key", apiKey);
    }
    return url.toString();
  } catch {
    return apiUrl;
  }
}

function detectFormat(
  requested: RedashResponseFormat,
  contentType: string,
  body: string
): "json" | "csv" {
  if (requested === "json" || requested === "csv") return requested;
  if (contentType.includes("application/json")) return "json";
  if (contentType.includes("text/csv") || contentType.includes("application/csv")) {
    return "csv";
  }

  const trimmed = body.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  return "csv";
}

function parseJsonPayload(payload: unknown): LooseRecord[] {
  if (Array.isArray(payload)) return payload as LooseRecord[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as LooseRecord[];
    if (
      obj.query_result &&
      typeof obj.query_result === "object" &&
      Array.isArray((obj.query_result as Record<string, unknown>).data)
    ) {
      return (obj.query_result as Record<string, unknown>).data as LooseRecord[];
    }
    if (
      obj.query_result &&
      typeof obj.query_result === "object" &&
      (obj.query_result as Record<string, unknown>).data &&
      typeof (obj.query_result as Record<string, unknown>).data === "object" &&
      Array.isArray(
        ((obj.query_result as Record<string, unknown>).data as Record<string, unknown>).rows
      )
    ) {
      return (
        ((obj.query_result as Record<string, unknown>).data as Record<string, unknown>)
          .rows as LooseRecord[]
      );
    }
  }

  return [];
}

function parseCsvPayload(csvText: string): LooseRecord[] {
  const rows = parseCsv(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return rows as LooseRecord[];
}

export class RedashClient {
  private readonly config: Required<RedashClientConfig>;

  constructor(config: RedashClientConfig) {
    if (!config.apiUrl) throw new Error("Redash API URL is required.");
    if (!config.apiKey) throw new Error("Redash API key is required.");

    this.config = {
      ...config,
      format: config.format ?? "auto",
      timeoutMs: config.timeoutMs ?? 15_000,
    };
  }

  async fetchOrders(): Promise<RedashFetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(toUrlWithApiKey(this.config.apiUrl, this.config.apiKey), {
        method: "GET",
        headers: {
          Authorization: `Key ${this.config.apiKey}`,
          Accept: "application/json, text/csv;q=0.9, */*;q=0.8",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Redash fetch failed (${response.status} ${response.statusText}).`);
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      const body = await response.text();
      const format = detectFormat(this.config.format, contentType, body);

      let rawRows: LooseRecord[] = [];
      const warnings: string[] = [];

      if (format === "json") {
        try {
          rawRows = parseJsonPayload(JSON.parse(body) as unknown);
        } catch {
          rawRows = parseCsvPayload(body);
          warnings.push("Redash response declared JSON but parsing failed. Fallback to CSV parser.");
        }
      } else {
        rawRows = parseCsvPayload(body);
      }

      const normalizedResult = normalizeRedashRecords(rawRows);
      warnings.push(...normalizedResult.warnings);

      return {
        records: normalizedResult.normalized,
        format,
        fetchedAt: new Date(),
        warnings,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createRedashClient(config: RedashClientConfig): RedashClient {
  return new RedashClient(config);
}
