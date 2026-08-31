import { stripHtml } from "@/lib/utils";
import type { FeedEntry } from "./types";

function inner(block: string, names: string[]): string {
  for (const name of names) {
    const re = new RegExp(
      `<(?:${name}|[\\w]+:${name})(?:\\s[^>]*)?>([\\s\\S]*?)</(?:${name}|[\\w]+:${name})>`,
      "i",
    );
    const m = block.match(re);
    if (m?.[1]) return stripHtml(m[1]);
  }
  return "";
}

function attrLink(block: string): string {
  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (href?.[1]) return href[1].trim();
  const tagged = inner(block, ["link", "id", "guid"]);
  return tagged;
}

function authorsOf(block: string): string[] {
  const names: string[] = [];
  const authorBlocks = block.match(/<author[\s\S]*?<\/author>/gi) ?? [];
  for (const a of authorBlocks) {
    const n = inner(a, ["name"]) || stripHtml(a);
    if (n) names.push(n);
  }
  const dc = inner(block, ["dc:creator", "creator"]);
  if (dc) names.push(dc);
  return [...new Set(names.map((n) => n.replace(/,.*/, "").trim()).filter(Boolean))];
}

function dateOf(block: string): string | null {
  const raw = inner(block, ["published", "updated", "pubDate", "dc:date", "date"]);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string): FeedEntry[] {
  const chunks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ??
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ??
    [];
  const out: FeedEntry[] = [];
  for (const block of chunks) {
    const title = inner(block, ["title"]);
    let url = attrLink(block);
    if (!url) url = inner(block, ["id", "guid"]);
    if (!title || !url) continue;
    if (url.startsWith("/") ) continue;
    const summary =
      inner(block, ["summary", "description", "content", "content:encoded", "abstract"]) ||
      "";
    out.push({
      title: title.slice(0, 300),
      url: url.split("?")[0] === url ? url : url,
      publishedAt: dateOf(block),
      authors: authorsOf(block),
      summary: summary.slice(0, 1800),
    });
  }
  return out;
}

export async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, application/json, text/xml, */*",
        "User-Agent":
          "Mozilla/5.0 (compatible; MeridianResearchBot/1.0; research-intelligence; +https://grok.com)",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}
