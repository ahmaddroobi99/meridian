import { getSql } from "@/lib/db";
import { getItem } from "./queries";

export type ExplainMode = "engineer" | "deep" | "compare";

const SYSTEM = `You are Meridian, a research-intelligence brief writer for engineers.
Use ONLY the provided metadata (title, source, abstract/snippet, categories). Do not invent authors, benchmarks, parameter counts, dates, GitHub repos, or performance numbers. If something is not in the source text, write "Not verified".
Distinguish FACT (supported by the snippet) vs INFERENCE (your interpretation). Keep claims calibrated.
Do not copy long copyrighted passages; paraphrase.`;

function promptFor(mode: ExplainMode, payload: string): string {
  if (mode === "engineer") {
    return `Transform this item into an engineering brief with these headings:
Problem
Existing solution
New solution
Architecture
Algorithm
Implementation
Hardware
Performance
Limitations
What to build (a small reproduction)

Item:
${payload}`;
  }
  if (mode === "deep") {
    return `Write a graduate-level technical analysis with:
30-second summary
2-minute explanation
Engineering explanation (architecture, algorithms, models, data, compute, infrastructure, limitations)
Deep technical analysis
Why it matters (what changed, what existed before, 1-year and 5-year relevance)

Item:
${payload}`;
  }
  return `Compare the two items on architecture, disclosed specs, modalities, openness, hardware, and use cases. Mark undisclosed fields as Unknown / Not verified.\n\n${payload}`;
}

export async function explainItem(id: string, mode: ExplainMode): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const item = await getItem(id);
  if (!item) return { ok: false, error: "Item not found" };

  const column = mode === "deep" ? "deep_analysis" : "engineer_brief";
  if (mode !== "compare") {
    const cached = mode === "deep" ? item.deepAnalysis : item.engineerBrief;
    if (cached) return { ok: true, text: cached };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI briefing is not available in this environment" };

  const payload = [
    `Title: ${item.title}`,
    `Source: ${item.sourceId}`,
    `Kind: ${item.kind}`,
    `URL: ${item.url}`,
    `Published: ${item.publishedAt ?? "unknown"}`,
    `Categories: ${item.categories.join(", ")}`,
    `Authors: ${item.authors.join(", ") || "not provided"}`,
    `Models mentioned: ${item.models.join(", ") || "none extracted"}`,
    `Snippet: ${(item.abstract || item.rawSnippet || item.summary).slice(0, 1600)}`,
  ].join("\n");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 900,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: promptFor(mode, payload) },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "Empty model response" };

  if (mode !== "compare") {
    const sql = await getSql();
    if (column === "deep_analysis") {
      await sql`update items set deep_analysis = ${text}, enriched_at = ${new Date().toISOString()} where id = ${id}`;
    } else {
      await sql`update items set engineer_brief = ${text}, enriched_at = ${new Date().toISOString()} where id = ${id}`;
    }
  }
  return { ok: true, text };
}

export async function compareItems(aId: string, bId: string) {
  const [a, b] = await Promise.all([getItem(aId), getItem(bId)]);
  if (!a || !b) return { ok: false as const, error: "Both items are required" };
  const apiKey = process.env.XAI_API_KEY;
  const table = {
    a,
    b,
    rows: [
      ["Title", a.title, b.title],
      ["Kind", a.kind, b.kind],
      ["Source", a.sourceId, b.sourceId],
      ["Importance", String(a.importanceScore), String(b.importanceScore)],
      ["Technical depth", String(a.technicalDepth), String(b.technicalDepth)],
      ["Categories", a.categories.join(", "), b.categories.join(", ")],
      ["Models", a.models.join(", ") || "—", b.models.join(", ") || "—"],
      ["Hardware", a.hardware.join(", ") || "—", b.hardware.join(", ") || "—"],
      ["Frameworks", a.frameworks.join(", ") || "—", b.frameworks.join(", ") || "—"],
      ["Open artifact", a.github[0] || a.arxivId || "—", b.github[0] || b.arxivId || "—"],
    ],
  };
  if (!apiKey) return { ok: true as const, table, narrative: null as string | null };
  const r = await explainItem(a.id, "compare").catch(() => null);
  void r;
  const payload = `A:\n${a.title}\n${(a.abstract || a.summary).slice(0, 800)}\n\nB:\n${b.title}\n${(b.abstract || b.summary).slice(0, 800)}`;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 700,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: promptFor("compare", payload) },
      ],
    }),
  });
  if (!res.ok) return { ok: true as const, table, narrative: null as string | null };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { ok: true as const, table, narrative: body.choices?.[0]?.message?.content ?? null };
}
