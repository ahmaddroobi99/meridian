import type { Difficulty, EvidenceStatus, ItemKind, ItemRecord, ModelRecord, TrendRecord } from "./types";

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.startsWith("[")) {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  return s === "null" ? null : s;
}

function bool(v: unknown): boolean {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

export type ItemRow = Record<string, unknown>;

export function mapItem(row: ItemRow): ItemRecord {
  return {
    id: String(row.id),
    clusterId: String(row.cluster_id ?? row.id),
    kind: (str(row.kind) ?? "article") as ItemKind,
    title: String(row.title ?? ""),
    url: String(row.url ?? ""),
    sourceId: String(row.source_id ?? ""),
    orgId: str(row.org_id),
    publishedAt: str(row.published_at),
    authors: arr(row.authors),
    institutions: arr(row.institutions),
    categories: arr(row.categories),
    summary: String(row.summary ?? ""),
    technicalSummary: String(row.technical_summary ?? ""),
    whyItMatters: String(row.why_it_matters ?? ""),
    keyConcepts: arr(row.key_concepts),
    models: arr(row.models),
    datasets: arr(row.datasets),
    hardware: arr(row.hardware),
    frameworks: arr(row.frameworks),
    github: arr(row.github),
    relatedPapers: arr(row.related_papers),
    abstract: str(row.abstract),
    importanceScore: num(row.importance_score),
    technicalDepth: num(row.technical_depth),
    noveltyScore: num(row.novelty_score),
    practicalValue: num(row.practical_value),
    researchQuality: num(row.research_quality),
    recencyScore: num(row.recency_score),
    trendMomentum: num(row.trend_momentum),
    sourceCredibility: num(row.source_credibility),
    difficulty: (str(row.difficulty) ?? "intermediate") as Difficulty,
    evidenceStatus: (str(row.evidence_status) ?? "reported") as EvidenceStatus,
    isPrimary: bool(row.is_primary),
    isBreaking: bool(row.is_breaking),
    isBuildable: bool(row.is_buildable),
    buildNotes: str(row.build_notes),
    arxivId: str(row.arxiv_id),
    githubStars: row.github_stars == null ? null : num(row.github_stars),
    githubLanguage: str(row.github_language),
    githubForks: row.github_forks == null ? null : num(row.github_forks),
    citationCount: row.citation_count == null ? null : num(row.citation_count),
    rawSnippet: str(row.raw_snippet),
    engineerBrief: str(row.engineer_brief),
    deepAnalysis: str(row.deep_analysis),
    ingestedAt: str(row.ingested_at) ?? new Date().toISOString(),
  };
}

export function mapTrend(row: ItemRow): TrendRecord {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    slug: String(row.slug ?? ""),
    growth: num(row.growth),
    articleCount: num(row.article_count),
    paperCount: num(row.paper_count),
    orgs: arr(row.orgs),
    firstSeen: str(row.first_seen),
    lastSeen: str(row.last_seen),
    direction: (str(row.direction) ?? "stable") as TrendRecord["direction"],
    score: num(row.score),
    summary: String(row.summary ?? ""),
  };
}

export function mapModel(row: ItemRow): ModelRecord {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    organization: str(row.organization),
    slug: String(row.slug ?? ""),
    releasedAt: str(row.released_at),
    modalities: arr(row.modalities),
    parameters: str(row.parameters),
    contextLength: str(row.context_length),
    license: str(row.license),
    openness: (str(row.openness) ?? "unknown") as ModelRecord["openness"],
    hardware: str(row.hardware),
    githubUrl: str(row.github_url),
    hfUrl: str(row.hf_url),
    paperUrl: str(row.paper_url),
    notes: String(row.notes ?? ""),
  };
}
