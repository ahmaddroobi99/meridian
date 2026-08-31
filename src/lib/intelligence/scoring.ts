import { clamp, hashId } from "@/lib/utils";
import {
  buildNotes,
  classifyCategories,
  credibilityOf,
  extractConcepts,
  extractList,
  extractModels,
  inferDifficulty,
  inferEvidence,
  inferKind,
  isBreaking,
  isBuildable,
  noveltyScore,
  practicalValue,
  recencyScore,
  summarize30s,
  technicalDepth,
  technicalSummary,
  whyItMatters,
} from "./classify";
import { DATA_FRAMEWORKS, DATA_HARDWARE, DATASETS } from "./vocab";
import type { FeedEntry, ItemRecord, SourceDef } from "./types";

export { DATA_FRAMEWORKS, DATA_HARDWARE, DATASETS };

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|of|and|for|to|in|on|with|from|by|at)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clusterKey(title: string, url: string): string {
  const norm = normalizeTitle(title);
  const words = norm.split(" ").filter((w) => w.length > 2).slice(0, 10).join(" ");
  return hashId(words || url);
}

export function jaccard(a: string, b: string): number {
  const A = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const B = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function composeItem(source: SourceDef, entry: FeedEntry): ItemRecord {
  const text = `${entry.title}\n${entry.summary}`;
  const kind = inferKind(source, entry.url, entry.title);
  const cats = classifyCategories(text);
  const recency = recencyScore(entry.publishedAt);
  const depth = technicalDepth(text, kind);
  const practical = practicalValue(text, kind);
  const novelty = noveltyScore(text, recency);
  const cred = credibilityOf(source.reliability);
  const researchQ = kind === "paper" ? clamp(depth * 0.7 + cred * 0.3) : clamp(depth * 0.45 + cred * 0.4);
  const community = clamp(
    ((Number(entry.extra?.stars ?? 0) > 0
      ? Math.min(100, Math.log10(Number(entry.extra?.stars ?? 1) + 1) * 28)
      : 20) +
      (kind === "repo" ? 15 : 0)),
  );
  const trend = cats.includes("agents") || cats.includes("vla") || cats.includes("embodied") || cats.includes("inference")
    ? 72
    : 48;
  let importance = clamp(
    0.25 * depth +
      0.2 * novelty +
      0.15 * cred +
      0.15 * practical +
      0.1 * community +
      0.1 * recency +
      0.05 * trend,
  );
  if (/^b\d+$/i.test(entry.title) || (/^v?\d+\.\d+/.test(entry.title) && entry.title.length < 24)) {
    importance = clamp(importance * 0.55);
  }
  if (kind === "repo" && (Number(entry.extra?.stars ?? 0) < 200)) {
    importance = clamp(importance * 0.75);
  }
  const github: string[] = [];
  if (typeof entry.extra?.repo === "string") github.push(entry.extra.repo);
  const ghMatch = entry.summary.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i);
  if (ghMatch) github.push(ghMatch[0].replace(/\.git$/, ""));
  const arxiv = entry.url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i)?.[1]
    ?? (typeof entry.extra?.arxivId === "string" ? entry.extra.arxivId : null);
  const difficulty = inferDifficulty(kind, depth);
  const models = extractModels(text);
  const frameworks = extractList(text, DATA_FRAMEWORKS);
  const hardware = extractList(text, DATA_HARDWARE);
  const datasets = extractList(text, DATASETS);
  const concepts = extractConcepts(text, cats);
  const buildable = isBuildable(text, kind);

  return {
    id: hashId(entry.url),
    clusterId: clusterKey(entry.title, entry.url),
    kind,
    title: entry.title,
    url: entry.url,
    sourceId: source.id,
    orgId: source.orgId ?? null,
    publishedAt: entry.publishedAt,
    authors: entry.authors,
    institutions: [],
    categories: cats,
    summary: summarize30s(entry.title, entry.summary),
    technicalSummary: technicalSummary(entry.title, entry.summary, cats),
    whyItMatters: whyItMatters(entry.title, cats, kind, source.name),
    keyConcepts: concepts,
    models,
    datasets,
    hardware,
    frameworks,
    github,
    relatedPapers: arxiv ? [`https://arxiv.org/abs/${arxiv}`] : [],
    abstract: entry.summary || null,
    importanceScore: Math.round(importance * 10) / 10,
    technicalDepth: Math.round(depth * 10) / 10,
    noveltyScore: Math.round(novelty * 10) / 10,
    practicalValue: Math.round(practical * 10) / 10,
    researchQuality: Math.round(researchQ * 10) / 10,
    recencyScore: Math.round(recency * 10) / 10,
    trendMomentum: Math.round(trend * 10) / 10,
    sourceCredibility: cred,
    difficulty,
    evidenceStatus: inferEvidence(source, kind),
    isPrimary: true,
    isBreaking: isBreaking(text, recency, kind, importance),
    isBuildable: buildable,
    buildNotes: buildable ? buildNotes(kind, github, difficulty) : null,
    arxivId: arxiv,
    githubStars: typeof entry.extra?.stars === "number" ? entry.extra.stars : null,
    githubLanguage: typeof entry.extra?.language === "string" ? entry.extra.language : null,
    githubForks: typeof entry.extra?.forks === "number" ? entry.extra.forks : null,
    citationCount: null,
    rawSnippet: entry.summary.slice(0, 1200),
    engineerBrief: null,
    deepAnalysis: null,
    ingestedAt: new Date().toISOString(),
  };
}
