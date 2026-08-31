import { getSql } from "@/lib/db";
import { mapItem, mapModel, mapTrend } from "./map";
import { ROOT_CATEGORIES, TAXONOMY } from "./taxonomy";
import { SOURCE_BY_ID } from "./sources";
import type {
  DashboardPayload,
  GraphPayload,
  ItemKind,
  ItemRecord,
  SearchFilters,
  TimeRange,
} from "./types";

const ITEM_COLS = `*`;

function briefingScore(x: ItemRecord): number {
  const src = SOURCE_BY_ID[x.sourceId];
  const lab = src?.kind === "lab" ? 18 : src?.kind === "engineering" && x.kind === "article" ? 12 : 0;
  const kind =
    x.kind === "article" ? 10 : x.kind === "paper" ? 7 : x.kind === "model" ? 4 : x.kind === "release" ? -8 : -4;
  const breaking = x.isBreaking ? 8 : 0;
  const shortRelease = /^b\d+$/i.test(x.title) || x.title.length < 18 ? -20 : 0;
  return x.importanceScore + lab + kind + breaking + shortRelease + x.noveltyScore * 0.12;
}

function since(range?: TimeRange): string | null {
  const now = Date.now();
  if (range === "hour") return new Date(now - 3600e3).toISOString();
  if (range === "today") return new Date(now - 86400e3).toISOString();
  if (range === "week") return new Date(now - 7 * 86400e3).toISOString();
  if (range === "month") return new Date(now - 30 * 86400e3).toISOString();
  return null;
}

export async function listItems(opts: {
  limit?: number;
  offset?: number;
  kind?: ItemKind | "all";
  category?: string;
  range?: TimeRange;
  source?: string;
  difficulty?: string;
  wasteMyTime?: boolean;
  q?: string;
  breaking?: boolean;
  buildable?: boolean;
  papers?: boolean;
  order?: "importance" | "recent";
} = {}): Promise<ItemRecord[]> {
  const sql = await getSql();
  const limit = Math.min(opts.limit ?? 40, 120);
  const offset = opts.offset ?? 0;
  const clauses: string[] = ["is_primary = true"];
  const params: unknown[] = [];
  const add = (frag: string, v: unknown) => {
    params.push(v);
    clauses.push(frag.replace("?", `$${params.length}`));
  };

  if (opts.kind && opts.kind !== "all") add("kind = ?", opts.kind);
  if (opts.source) add("source_id = ?", opts.source);
  if (opts.difficulty && opts.difficulty !== "all") add("difficulty = ?", opts.difficulty);
  if (opts.breaking) clauses.push("is_breaking = true");
  if (opts.buildable) clauses.push("is_buildable = true");
  if (opts.papers) clauses.push("kind = 'paper'");
  if (opts.wasteMyTime) {
    clauses.push("source_credibility >= 70");
    clauses.push("importance_score >= 48");
    clauses.push("kind <> 'discussion'");
  }
  const from = since(opts.range);
  if (from) add("published_at >= ?::timestamptz", from);
  if (opts.category) {
    const kids = TAXONOMY.filter((t) => t.id === opts.category || t.parent === opts.category).map((t) => t.id);
    const parts = kids.map((id) => {
      params.push(`%"${id}"%`);
      return `categories::text ilike $${params.length}`;
    });
    if (parts.length) clauses.push(`(${parts.join(" or ")})`);
  }
  if (opts.q && opts.q.trim()) {
    const q = `%${opts.q.trim()}%`;
    params.push(q, q, q, q);
    const a = params.length - 3;
    clauses.push(
      `(title ilike $${a} or summary ilike $${a + 1} or raw_snippet ilike $${a + 2} or categories::text ilike $${a + 3})`,
    );
  }
  const order =
    opts.order === "recent"
      ? "published_at desc nulls last, importance_score desc"
      : "importance_score desc, published_at desc nulls last";
  params.push(limit, offset);
  const text = `select ${ITEM_COLS} from items where ${clauses.join(" and ")} order by ${order} limit $${params.length - 1} offset $${params.length}`;
  const rows = await sql.query<Record<string, unknown>>(text, params);
  return rows.map(mapItem);
}

export async function getItem(id: string): Promise<ItemRecord | null> {
  const sql = await getSql();
  const rows = await sql`select * from items where id = ${id} limit 1`;
  return rows[0] ? mapItem(rows[0]) : null;
}

export async function relatedItems(item: ItemRecord, limit = 8): Promise<ItemRecord[]> {
  const sql = await getSql();
  const cat = item.categories[0];
  if (!cat) {
    const rows = await sql`select * from items where is_primary = true and id <> ${item.id} order by importance_score desc limit ${limit}`;
    return rows.map(mapItem);
  }
  const rows = await sql.query<Record<string, unknown>>(
    `select * from items where is_primary = true and id <> $1 and categories::text ilike $2
     order by importance_score desc limit $3`,
    [item.id, `%"${cat}"%`, limit],
  );
  return rows.map(mapItem);
}

export async function clusterMates(clusterId: string, id: string): Promise<ItemRecord[]> {
  const sql = await getSql();
  const rows = await sql`
    select * from items where cluster_id = ${clusterId} and id <> ${id}
    order by source_credibility desc limit 6
  `;
  return rows.map(mapItem);
}

export async function getDashboard(): Promise<DashboardPayload> {
  const sql = await getSql();
  const last = await sql<{ value: string }>`select value from meta where key = 'last_updated'`;
  const [today, week, deep, breaking, research, build, trends, counts] = await Promise.all([
    listItems({ range: "today", limit: 18, order: "importance" }),
    listItems({ range: "week", limit: 80, order: "importance" }),
    listItems({ limit: 10, order: "importance", wasteMyTime: true }),
    listItems({ breaking: true, range: "week", limit: 10 }),
    listItems({ papers: true, range: "week", limit: 16 }),
    listItems({ buildable: true, limit: 12 }),
    sql`select * from trends order by score desc limit 12`,
    sql<{ items: number; papers: number; repos: number; sources: number }>`
      select
        (select count(*)::int from items) as items,
        (select count(*)::int from items where kind = 'paper') as papers,
        (select count(*)::int from items where kind = 'repo') as repos,
        (select count(*)::int from sources) as sources
    `,
  ]);
  const pool = week.filter((i) => i.kind === "article" || i.kind === "paper" || i.kind === "model");
  const ranked = [...(pool.length >= 8 ? pool : week)].sort((a, b) => briefingScore(b) - briefingScore(a));
  const topFive: ItemRecord[] = [];
  const usedCats = new Set<string>();
  const usedKinds = new Set<string>();
  for (const item of ranked) {
    if (topFive.length >= 5) break;
    const cat = item.categories[0] ?? item.kind;
    if (usedCats.has(cat) && topFive.length < 4) continue;
    if (usedKinds.has(item.kind) && (item.kind === "repo" || item.kind === "release") && topFive.length < 4) continue;
    usedCats.add(cat);
    usedKinds.add(item.kind);
    topFive.push(item);
  }
  while (topFive.length < 5 && topFive.length < ranked.length) {
    const next = ranked.find((r) => !topFive.some((t) => t.id === r.id));
    if (!next) break;
    topFive.push(next);
  }
  return {
    lastUpdated: last[0]?.value ?? null,
    topFive,
    today: today.length ? today : week.slice(0, 18),
    week,
    deepReads: deep.filter((d) => d.technicalDepth >= 55).slice(0, 8),
    breaking,
    research,
    buildThis: build,
    trends: trends.map(mapTrend),
    stats: counts[0] ?? { items: 0, papers: 0, repos: 0, sources: 0 },
  };
}

export async function getGraph(): Promise<GraphPayload> {
  const sql = await getSql();
  const rows = await sql<{ categories: string }>`select categories::text as categories from items where is_primary = true`;
  const counts = new Map<string, number>();
  for (const r of rows) {
    let cats: string[] = [];
    try {
      cats = JSON.parse(r.categories) as string[];
    } catch {
      cats = [];
    }
    for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const roots = ROOT_CATEGORIES;
  const cx = 480;
  const cy = 300;
  const r = 210;
  const nodes = [
    { id: "ai", label: "AI", group: "root", count: rows.length, x: cx, y: cy },
    ...roots.map((c, i) => {
      const a = (Math.PI * 2 * i) / roots.length - Math.PI / 2;
      return {
        id: c.id,
        label: c.label,
        group: "root-cat",
        count: counts.get(c.id) ?? 0,
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
      };
    }),
  ];
  const edges = roots.map((c) => ({ from: "ai", to: c.id }));
  const childrenByRoot = roots.map((root, i) => {
    const kids = TAXONOMY.filter((t) => t.parent === root.id && (counts.get(t.id) ?? 0) > 0).slice(0, 2);
    const a = (Math.PI * 2 * i) / roots.length - Math.PI / 2;
    for (let j = 0; j < kids.length; j++) {
      const k = kids[j]!;
      const spread = (j - (kids.length - 1) / 2) * 0.22;
      nodes.push({
        id: k.id,
        label: k.label,
        group: root.id,
        count: counts.get(k.id) ?? 0,
        x: cx + Math.cos(a + spread) * (r + 110),
        y: cy + Math.sin(a + spread) * (r + 110),
      });
      edges.push({ from: root.id, to: k.id });
    }
    return kids;
  });
  void childrenByRoot;
  return { nodes, edges };
}

export async function getTrends() {
  const sql = await getSql();
  const rows = await sql`select * from trends order by score desc`;
  return rows.map(mapTrend);
}

export async function getModels() {
  const sql = await getSql();
  const rows = await sql`select * from models order by name`;
  return rows.map(mapModel);
}

export async function getModel(slug: string) {
  const sql = await getSql();
  const rows = await sql`select * from models where slug = ${slug} or id = ${slug} limit 1`;
  return rows[0] ? mapModel(rows[0]) : null;
}

export async function getOrgs() {
  const sql = await getSql();
  return sql<{ id: string; name: string; slug: string; kind: string; url: string | null; description: string }>`
    select id, name, slug, kind, url, description from organizations order by name
  `;
}

export async function getOrg(slug: string) {
  const sql = await getSql();
  const org = (
    await sql<{ id: string; name: string; slug: string; kind: string; url: string | null; description: string }>`
      select id, name, slug, kind, url, description from organizations where slug = ${slug} or id = ${slug} limit 1
    `
  )[0];
  if (!org) return null;
  const items = await sql.query<Record<string, unknown>>(
    `select * from items where is_primary = true and (org_id = $1 or source_id in (select id from sources where slug = $2))
     order by published_at desc nulls last limit 40`,
    [org.id, org.slug],
  );
  return { org, items: items.map(mapItem) };
}

export async function getSource(slug: string) {
  const sql = await getSql();
  const source = (
    await sql<{
      id: string;
      name: string;
      slug: string;
      kind: string;
      reliability: string;
      url: string;
      last_fetch_at: string | null;
      last_error: string | null;
      item_count: number;
    }>`select id, name, slug, kind, reliability, url, last_fetch_at, last_error, item_count from sources where slug = ${slug} or id = ${slug} limit 1`
  )[0];
  if (!source) return null;
  const items = await listItems({ source: source.id, limit: 40, order: "recent" });
  return { source, def: SOURCE_BY_ID[source.id], items };
}

export async function getResearchers() {
  const sql = await getSql();
  return sql<{ id: string; name: string; slug: string; organization: string | null; paper_count: number }>`
    select id, name, slug, organization, paper_count from researchers order by paper_count desc limit 60
  `;
}

export async function searchAll(filters: SearchFilters) {
  const items = await listItems({
    q: filters.q,
    range: filters.range,
    kind: filters.kind,
    category: filters.category,
    difficulty: filters.difficulty,
    source: filters.source,
    wasteMyTime: filters.wasteMyTime,
    limit: 60,
  });
  return items;
}

export async function weeklyBundle() {
  const [week, papers, build, trends, models] = await Promise.all([
    listItems({ range: "week", limit: 40 }),
    listItems({ papers: true, range: "week", limit: 15 }),
    listItems({ buildable: true, range: "week", limit: 10 }),
    getTrends(),
    getModels(),
  ]);
  return { week, papers, build, trends: trends.slice(0, 8), models: models.slice(0, 12) };
}

export async function monthlyBundle() {
  const [month, papers, trends] = await Promise.all([
    listItems({ range: "month", limit: 50 }),
    listItems({ papers: true, range: "month", limit: 20 }),
    getTrends(),
  ]);
  return { month, papers, trends };
}
