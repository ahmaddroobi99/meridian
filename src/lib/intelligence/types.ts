export type Reliability = "primary" | "secondary" | "tertiary";
export type EvidenceStatus = "confirmed" | "reported" | "speculative" | "community";
export type ItemKind = "paper" | "article" | "repo" | "model" | "release" | "discussion";
export type SourceKind = "lab" | "oss" | "academic" | "engineering" | "industry" | "community";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "research" | "expert";
export type TimeRange = "hour" | "today" | "week" | "month" | "all";

export type CategoryNode = {
  id: string;
  label: string;
  parent?: string;
  keywords: string[];
};

export type SourceDef = {
  id: string;
  name: string;
  slug: string;
  kind: SourceKind;
  reliability: Reliability;
  url: string;
  feedUrl?: string;
  orgId?: string;
  adapter: "rss" | "arxiv" | "github-search" | "github-releases" | "hf-models";
  arxivCat?: string;
  githubQuery?: string;
  githubRepo?: string;
  maxItems?: number;
  aiFilter?: boolean;
};

export type FeedEntry = {
  title: string;
  url: string;
  publishedAt: string | null;
  authors: string[];
  summary: string;
  extra?: Record<string, string | number | null>;
};

export type ItemRecord = {
  id: string;
  clusterId: string;
  kind: ItemKind;
  title: string;
  url: string;
  sourceId: string;
  orgId: string | null;
  publishedAt: string | null;
  authors: string[];
  institutions: string[];
  categories: string[];
  summary: string;
  technicalSummary: string;
  whyItMatters: string;
  keyConcepts: string[];
  models: string[];
  datasets: string[];
  hardware: string[];
  frameworks: string[];
  github: string[];
  relatedPapers: string[];
  abstract: string | null;
  importanceScore: number;
  technicalDepth: number;
  noveltyScore: number;
  practicalValue: number;
  researchQuality: number;
  recencyScore: number;
  trendMomentum: number;
  sourceCredibility: number;
  difficulty: Difficulty;
  evidenceStatus: EvidenceStatus;
  isPrimary: boolean;
  isBreaking: boolean;
  isBuildable: boolean;
  buildNotes: string | null;
  arxivId: string | null;
  githubStars: number | null;
  githubLanguage: string | null;
  githubForks: number | null;
  citationCount: number | null;
  rawSnippet: string | null;
  engineerBrief: string | null;
  deepAnalysis: string | null;
  ingestedAt: string;
};

export type TrendRecord = {
  id: string;
  topic: string;
  slug: string;
  growth: number;
  articleCount: number;
  paperCount: number;
  orgs: string[];
  firstSeen: string | null;
  lastSeen: string | null;
  direction: "up" | "down" | "stable" | "emerging";
  score: number;
  summary: string;
};

export type ModelRecord = {
  id: string;
  name: string;
  organization: string | null;
  slug: string;
  releasedAt: string | null;
  modalities: string[];
  parameters: string | null;
  contextLength: string | null;
  license: string | null;
  openness: "open" | "closed" | "unknown";
  hardware: string | null;
  githubUrl: string | null;
  hfUrl: string | null;
  paperUrl: string | null;
  notes: string;
};

export type OrgRecord = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  url: string | null;
  description: string;
};

export type IngestStats = {
  sourcesOk: number;
  sourcesFailed: number;
  itemsInserted: number;
  duplicatesRemoved: number;
  lastUpdated: string | null;
  sourceStatuses: {
    id: string;
    name: string;
    ok: boolean;
    error?: string;
    count: number;
    lastFetch: string | null;
  }[];
};

export type DashboardPayload = {
  lastUpdated: string | null;
  topFive: ItemRecord[];
  today: ItemRecord[];
  week: ItemRecord[];
  deepReads: ItemRecord[];
  breaking: ItemRecord[];
  research: ItemRecord[];
  buildThis: ItemRecord[];
  trends: TrendRecord[];
  stats: {
    items: number;
    papers: number;
    repos: number;
    sources: number;
  };
};

export type GraphPayload = {
  nodes: { id: string; label: string; group: string; count: number; x: number; y: number }[];
  edges: { from: string; to: string }[];
};

export type SearchFilters = {
  q?: string;
  range?: TimeRange;
  kind?: ItemKind | "all";
  category?: string;
  difficulty?: Difficulty | "all";
  source?: string;
  wasteMyTime?: boolean;
};
