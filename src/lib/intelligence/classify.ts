import { clamp } from "@/lib/utils";
import { CATEGORY_BY_ID, CONFERENCES, TAXONOMY } from "./taxonomy";
import type { Difficulty, EvidenceStatus, ItemKind, Reliability, SourceDef } from "./types";

const MODEL_PATTERNS = [
  /\bgrok(?:-\d+(?:\.\d+)?)?\b/gi,
  /\bgpt(?:-\d+(?:\.\d+)?)?\b/gi,
  /\bclaude(?:[-\s]?(?:opus|sonnet|haiku|\d+(?:\.\d+)?))?\b/gi,
  /\bgemini(?:[-\s]?(?:\d+(?:\.\d+)?|flash|pro|ultra))?\b/gi,
  /\bllama[-\s]?\d+[^\s,)]*/gi,
  /\bqwen[^\s,)]*/gi,
  /\bmistral[^\s,)]*/gi,
  /\bdeepseek[^\s,)]*/gi,
  /\bvllm\b/gi,
  /\bwhisper\b/gi,
  /\bsam(?:-?\d)?\b/gi,
  /\bopenvla\b/gi,
  /\brt-2\b/gi,
  /\bstable diffusion\b/gi,
];

const BUILD_HINTS = [
  "github", "open-source", "open source", "code", "implement", "reproduce",
  "checkpoint", "weights", "huggingface", "colab", "tutorial", "from scratch",
];

const DEPTH_HINTS = [
  "architecture", "attention", "kernel", "gradient", "theorem", "proof",
  "ablation", "benchmark", "latency", "throughput", "quantization",
  "loss", "parameter", "token", "mixture of experts", "moe",
];

const BREAKING_HINTS = [
  "release", "announces", "we are introducing", "available now", "open weights",
  "state of the art", "sota", "breakthrough", "new model",
];

const AI_FILTER =
  /\b(ai|a\.i\.|artificial intelligence|machine learning|deep learning|llm|language model|neural|gpu|cuda|nvidia|openai|anthropic|deepmind|gemini|claude|gpt|grok|llama|huggingface|transformer|diffusion|robot|multimodal|inference|alignment|agentic|foundation model)\b/i;

export function looksLikeAi(text: string): boolean {
  return AI_FILTER.test(text);
}

export function extractList(text: string, vocab: string[]): string[] {
  const lower = text.toLowerCase();
  return vocab.filter((v) => lower.includes(v));
}

export function extractModels(text: string): string[] {
  const found = new Set<string>();
  for (const re of MODEL_PATTERNS) {
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) m.forEach((x) => found.add(x.trim()));
  }
  return [...found].slice(0, 8);
}

export function classifyCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const scored = TAXONOMY.map((node) => {
    let hits = 0;
    for (const k of node.keywords) {
      if (lower.includes(k)) hits += k.length > 8 ? 2 : 1;
    }
    return { id: node.id, hits };
  }).filter((x) => x.hits > 0);
  scored.sort((a, b) => b.hits - a.hits);
  const ids = scored.slice(0, 5).map((s) => s.id);
  if (ids.length === 0) {
    if (/\bpaper\b|arxiv/.test(lower)) return ["machine-learning"];
    return ["industry"];
  }
  const withParents = new Set(ids);
  for (const id of ids) {
    const p = CATEGORY_BY_ID[id]?.parent;
    if (p) withParents.add(p);
  }
  return [...withParents].slice(0, 6);
}

export function extractConcepts(text: string, categories: string[]): string[] {
  const fromCats = categories.map((id) => CATEGORY_BY_ID[id]?.label).filter(Boolean) as string[];
  const extra: string[] = [];
  for (const c of CONFERENCES) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) extra.push(c);
  }
  return [...new Set([...fromCats, ...extra])].slice(0, 10);
}

export function inferKind(source: SourceDef, url: string, title: string): ItemKind {
  if (source.adapter === "arxiv" || /arxiv\.org/.test(url)) return "paper";
  if (source.adapter === "github-search" || source.adapter === "github-releases") return "repo";
  if (source.adapter === "hf-models") return "model";
  if (/release|v\d+\.\d+/i.test(title) && source.kind === "engineering") return "release";
  if (source.kind === "community") return "discussion";
  if (source.kind === "academic") return "paper";
  return "article";
}

export function inferDifficulty(kind: ItemKind, depth: number): Difficulty {
  if (kind === "paper") return depth > 70 ? "research" : "advanced";
  if (depth > 80) return "expert";
  if (depth > 60) return "advanced";
  if (depth > 35) return "intermediate";
  return "beginner";
}

export function inferEvidence(source: SourceDef, kind: ItemKind): EvidenceStatus {
  if (source.reliability === "primary" && (kind === "paper" || kind === "repo" || kind === "release")) {
    return "confirmed";
  }
  if (source.reliability === "primary") return "confirmed";
  if (source.reliability === "secondary") return "reported";
  if (source.kind === "community") return "community";
  return "speculative";
}

export function credibilityOf(rel: Reliability): number {
  if (rel === "primary") return 92;
  if (rel === "secondary") return 74;
  return 48;
}

export function recencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 35;
  const ageH = (Date.now() - new Date(publishedAt).getTime()) / 36e5;
  if (ageH < 6) return 100;
  if (ageH < 24) return 92;
  if (ageH < 72) return 78;
  if (ageH < 168) return 62;
  if (ageH < 720) return 42;
  return 22;
}

export function technicalDepth(text: string, kind: ItemKind): number {
  const lower = text.toLowerCase();
  let score = kind === "paper" ? 62 : kind === "repo" ? 55 : 38;
  for (const h of DEPTH_HINTS) if (lower.includes(h)) score += 4;
  if (lower.length > 800) score += 6;
  if (/\b(algorithm|architecture|theorem|lemma)\b/.test(lower)) score += 8;
  return clamp(score);
}

export function practicalValue(text: string, kind: ItemKind): number {
  const lower = text.toLowerCase();
  let score = kind === "repo" ? 70 : kind === "release" ? 68 : 40;
  for (const h of BUILD_HINTS) if (lower.includes(h)) score += 5;
  return clamp(score);
}

export function noveltyScore(text: string, recency: number): number {
  const lower = text.toLowerCase();
  let score = recency * 0.45 + 25;
  if (/\b(first|novel|new|introducing|we propose|sota|state-of-the-art)\b/.test(lower)) score += 18;
  return clamp(score);
}

export function isBreaking(text: string, recency: number, kind: ItemKind, importance: number): boolean {
  if (recency < 70) return false;
  if (kind === "discussion") return false;
  const lower = text.toLowerCase();
  const hinted = BREAKING_HINTS.some((h) => lower.includes(h));
  return hinted && importance >= 62;
}

export function isBuildable(text: string, kind: ItemKind): boolean {
  if (kind === "repo" || kind === "release" || kind === "model") return true;
  const lower = text.toLowerCase();
  return BUILD_HINTS.filter((h) => lower.includes(h)).length >= 2;
}

export function summarize30s(title: string, snippet: string): string {
  const clean = snippet.replace(/\s+/g, " ").trim();
  if (clean.length > 40) {
    const cut = clean.slice(0, 280);
    const last = cut.lastIndexOf(". ");
    return last > 80 ? cut.slice(0, last + 1) : cut.replace(/\s+\S*$/, "") + "…";
  }
  return title;
}

export function technicalSummary(title: string, snippet: string, cats: string[]): string {
  const labels = cats
    .map((id) => CATEGORY_BY_ID[id]?.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const body = snippet.replace(/\s+/g, " ").trim().slice(0, 420);
  if (body.length > 60) {
    return labels ? `${body} Categories: ${labels}.` : body;
  }
  return `${title}. Engineering relevance: ${labels || "general AI systems"}.`;
}

export function whyItMatters(
  title: string,
  cats: string[],
  kind: ItemKind,
  sourceName: string,
): string {
  const top = CATEGORY_BY_ID[cats[0] ?? ""]?.label ?? "AI systems";
  if (kind === "paper") {
    return `Primary research in ${top}. Worth reading if you are building or evaluating systems in this area — the claim is from ${sourceName}, not a recap.`;
  }
  if (kind === "repo" || kind === "release") {
    return `Runnable artifact in ${top}. Highest learning value comes from cloning it and tracing the implementation, not from the announcement.`;
  }
  if (kind === "model") {
    return `New model surface in ${top}. Check license, modalities, and whether weights are actually available before treating it as usable.`;
  }
  return `${sourceName} published an update touching ${top}. Ask what changed technically — architecture, data, compute, or product packaging — before investing time.`;
}

export function buildNotes(kind: ItemKind, github: string[], difficulty: Difficulty): string {
  const repo = github[0] ? `Start from ${github[0]}.` : "No repository was attached — reconstruct a thin slice from the abstract.";
  const hw =
    difficulty === "research" || difficulty === "expert"
      ? "Likely needs a modern GPU (24GB+) for a faithful reproduction."
      : "A laptop-scale mini-project is enough to learn the idea.";
  return `${repo} ${hw}`;
}
