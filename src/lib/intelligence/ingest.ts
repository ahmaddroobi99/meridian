import { getSql } from "@/lib/db";
import { hashId, slugify } from "@/lib/utils";
import { looksLikeAi } from "./classify";
import { fetchText, parseFeed } from "./rss";
import { composeItem, jaccard } from "./scoring";
import { ORGANIZATIONS, SOURCES } from "./sources";
import { TAXONOMY } from "./taxonomy";
import type { FeedEntry, IngestStats, ItemRecord, SourceDef } from "./types";

const STALE_MS = 45 * 60 * 1000;
const UA_JSON = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; MeridianResearchBot/1.0)",
};

type Status = IngestStats["sourceStatuses"][number];

async function fetchJson<T>(url: string, timeoutMs = 10000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: UA_JSON, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function collect(source: SourceDef): Promise<FeedEntry[]> {
  const cap = source.maxItems ?? 12;
  if (source.adapter === "rss") {
    if (!source.feedUrl) return [];
    const xml = await fetchText(source.feedUrl);
    let items = parseFeed(xml).slice(0, cap);
    if (source.aiFilter) items = items.filter((i) => looksLikeAi(`${i.title} ${i.summary}`));
    return items;
  }
  if (source.adapter === "arxiv" && source.arxivCat) {
    const url = `https://export.arxiv.org/api/query?search_query=cat:${source.arxivCat}&start=0&max_results=${cap}&sortBy=submittedDate&sortOrder=descending`;
    const xml = await fetchText(url);
    return parseFeed(xml).map((e) => {
      const id = e.url.match(/(\d{4}\.\d{4,5})/)?.[1];
      const abs = id ? `https://arxiv.org/abs/${id}` : e.url;
      return { ...e, url: abs, extra: { ...(e.extra ?? {}), arxivId: id ?? null } };
    });
  }
  if (source.adapter === "github-search" && source.githubQuery) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(source.githubQuery)}&sort=updated&order=desc&per_page=${cap}`;
    const data = await fetchJson<{
      items?: {
        full_name: string;
        html_url: string;
        description: string | null;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
        updated_at: string;
        created_at: string;
        owner?: { login: string };
      }[];
    }>(url);
    return (data.items ?? []).map((r) => ({
      title: r.full_name,
      url: r.html_url,
      publishedAt: r.created_at ?? r.updated_at,
      authors: r.owner?.login ? [r.owner.login] : [],
      summary: r.description ?? "",
      extra: { stars: r.stargazers_count, forks: r.forks_count, language: r.language, repo: r.html_url },
    }));
  }
  if (source.adapter === "github-releases" && source.githubRepo) {
    const xml = await fetchText(`https://github.com/${source.githubRepo}/releases.atom`);
    return parseFeed(xml).slice(0, cap).map((e) => ({
      ...e,
      extra: { ...(e.extra ?? {}), repo: `https://github.com/${source.githubRepo}` },
    }));
  }
  if (source.adapter === "hf-models") {
    const data = await fetchJson<
      { id: string; pipeline_tag?: string; likes?: number; downloads?: number; createdAt?: string; tags?: string[] }[]
    >(`https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=${cap}`);
    return data.map((m) => ({
      title: m.id,
      url: `https://huggingface.co/${m.id}`,
      publishedAt: m.createdAt ?? null,
      authors: [m.id.split("/")[0] ?? "unknown"],
      summary: [m.pipeline_tag, ...(m.tags ?? []).slice(0, 8)].filter(Boolean).join(", "),
      extra: { stars: m.likes ?? 0 },
    }));
  }
  return [];
}

function json(v: unknown): string {
  return JSON.stringify(v ?? []);
}

async function upsertItem(item: ItemRecord): Promise<"insert" | "skip"> {
  const sql = await getSql();
  const existing = await sql<{ id: string; source_id: string; importance_score: number }>`
    select id, source_id, importance_score from items where url = ${item.url} limit 1
  `;
  if (existing[0]) return "skip";

  const near = await sql<{ id: string; title: string; cluster_id: string; is_primary: boolean; importance_score: number; published_at: string | null }>`
    select id, title, cluster_id, is_primary, importance_score, published_at from items
    where cluster_id = ${item.clusterId}
    limit 8
  `;
  let primary = true;
  let clusterId = item.clusterId;
  for (const row of near) {
    if (jaccard(row.title, item.title) >= 0.72) {
      clusterId = row.cluster_id;
      if (row.importance_score >= item.importanceScore) primary = false;
      else {
        await sql`update items set is_primary = false where id = ${row.id}`;
      }
      break;
    }
  }

  await sql`
    insert into items (
      id, cluster_id, kind, title, url, source_id, org_id, published_at, authors, institutions,
      categories, summary, technical_summary, why_it_matters, key_concepts, models, datasets,
      hardware, frameworks, github, related_papers, abstract, importance_score, technical_depth,
      novelty_score, practical_value, research_quality, recency_score, trend_momentum,
      source_credibility, difficulty, evidence_status, is_primary, is_breaking, is_buildable,
      build_notes, arxiv_id, github_stars, github_language, github_forks, citation_count,
      raw_snippet, ingested_at
    ) values (
      ${item.id}, ${clusterId}, ${item.kind}, ${item.title}, ${item.url}, ${item.sourceId},
      ${item.orgId}, ${item.publishedAt}, ${json(item.authors)}::jsonb, ${json(item.institutions)}::jsonb,
      ${json(item.categories)}::jsonb, ${item.summary}, ${item.technicalSummary}, ${item.whyItMatters},
      ${json(item.keyConcepts)}::jsonb, ${json(item.models)}::jsonb, ${json(item.datasets)}::jsonb,
      ${json(item.hardware)}::jsonb, ${json(item.frameworks)}::jsonb, ${json(item.github)}::jsonb,
      ${json(item.relatedPapers)}::jsonb, ${item.abstract}, ${item.importanceScore}, ${item.technicalDepth},
      ${item.noveltyScore}, ${item.practicalValue}, ${item.researchQuality}, ${item.recencyScore},
      ${item.trendMomentum}, ${item.sourceCredibility}, ${item.difficulty}, ${item.evidenceStatus},
      ${primary}, ${item.isBreaking}, ${item.isBuildable}, ${item.buildNotes}, ${item.arxivId},
      ${item.githubStars}, ${item.githubLanguage}, ${item.githubForks}, ${item.citationCount},
      ${item.rawSnippet}, ${item.ingestedAt}
    )
    on conflict (url) do nothing
  `;
  return "insert";
}

async function seedCatalog() {
  const sql = await getSql();
  for (const s of SOURCES) {
    await sql`
      insert into sources (id, name, slug, kind, reliability, url, feed_url, active)
      values (${s.id}, ${s.name}, ${s.slug}, ${s.kind}, ${s.reliability}, ${s.url}, ${s.feedUrl ?? null}, true)
      on conflict (id) do update set name = excluded.name, feed_url = excluded.feed_url, url = excluded.url
    `;
  }
  for (const o of ORGANIZATIONS) {
    await sql`
      insert into organizations (id, name, slug, kind, url, description)
      values (${o.id}, ${o.name}, ${o.slug}, ${o.kind}, ${o.url}, ${o.description})
      on conflict (id) do update set description = excluded.description, url = excluded.url
    `;
  }
}

async function recomputeTrends() {
  const sql = await getSql();
  const rows = await sql<{ categories: string; source_id: string; kind: string; published_at: string | null; org_id: string | null }>`
    select categories::text as categories, source_id, kind, published_at, org_id from items
  `;
  const weekAgo = Date.now() - 7 * 86400e3;
  const stats = new Map<
    string,
    { total: number; week: number; papers: number; orgs: Set<string>; first: number; last: number }
  >();
  for (const r of rows) {
    let cats: string[] = [];
    try {
      cats = JSON.parse(r.categories) as string[];
    } catch {
      cats = [];
    }
    const t = r.published_at ? new Date(r.published_at).getTime() : Date.now();
    for (const c of cats) {
      const node = TAXONOMY.find((n) => n.id === c);
      if (!node) continue;
      let s = stats.get(c);
      if (!s) {
        s = { total: 0, week: 0, papers: 0, orgs: new Set(), first: t, last: t };
        stats.set(c, s);
      }
      s.total += 1;
      if (t >= weekAgo) s.week += 1;
      if (r.kind === "paper") s.papers += 1;
      if (r.org_id) s.orgs.add(r.org_id);
      s.first = Math.min(s.first, t);
      s.last = Math.max(s.last, t);
    }
  }
  await sql`delete from trends`;
  for (const [id, s] of stats) {
    const node = TAXONOMY.find((n) => n.id === id);
    if (!node || s.total < 2) continue;
    const growth = s.total === 0 ? 0 : s.week / s.total;
    const direction = growth > 0.55 ? "up" : growth < 0.2 ? "stable" : s.week >= 4 ? "emerging" : "stable";
    const score = Math.round((s.week * 12 + s.total * 2 + s.papers * 3) * 10) / 10;
    await sql`
      insert into trends (id, topic, slug, growth, article_count, paper_count, orgs, first_seen, last_seen, direction, score, summary)
      values (
        ${id}, ${node.label}, ${slugify(node.label)}, ${growth}, ${s.total}, ${s.papers},
        ${JSON.stringify([...s.orgs].slice(0, 8))}::jsonb,
        ${new Date(s.first).toISOString()}, ${new Date(s.last).toISOString()}, ${direction}, ${score},
        ${`${node.label}: ${s.week} items this week, ${s.papers} papers, ${s.total} total in the live corpus.`}
      )
      on conflict (id) do update set
        growth = excluded.growth, article_count = excluded.article_count, paper_count = excluded.paper_count,
        orgs = excluded.orgs, last_seen = excluded.last_seen, direction = excluded.direction, score = excluded.score,
        summary = excluded.summary
    `;
  }
}

async function extractModelsAndPeople() {
  const sql = await getSql();
  const items = await sql<{ models: string; authors: string; org_id: string | null; url: string; title: string }>`
    select models::text as models, authors::text as authors, org_id, url, title from items
  `;
  const modelHits = new Map<string, { name: string; org: string | null; url: string }>();
  const people = new Map<string, { name: string; org: string | null; count: number }>();
  for (const it of items) {
    let models: string[] = [];
    let authors: string[] = [];
    try {
      models = JSON.parse(it.models) as string[];
    } catch { /* ignore */ }
    try {
      authors = JSON.parse(it.authors) as string[];
    } catch { /* ignore */ }
    for (const m of models) {
      const key = slugify(m);
      if (!key) continue;
      if (!modelHits.has(key)) modelHits.set(key, { name: m, org: it.org_id, url: it.url });
    }
    for (const a of authors.slice(0, 4)) {
      if (a.length < 4 || a.length > 48) continue;
      if (/huggingface|arxiv|admin|team/i.test(a)) continue;
      const key = slugify(a);
      const prev = people.get(key);
      if (prev) prev.count += 1;
      else people.set(key, { name: a, org: it.org_id, count: 1 });
    }
  }
  for (const [id, m] of modelHits) {
    const open = /llama|qwen|mistral|deepseek|vllm/i.test(m.name) ? "open" : "unknown";
    await sql`
      insert into models (id, name, organization, slug, openness, notes)
      values (${id}, ${m.name}, ${m.org}, ${id}, ${open}, ${"Mentioned in live corpus. Specs not disclosed here."})
      on conflict (id) do nothing
    `;
  }
  for (const [id, p] of people) {
    if (p.count < 2) continue;
    await sql`
      insert into researchers (id, name, slug, organization, paper_count)
      values (${id}, ${p.name}, ${id}, ${p.org}, ${p.count})
      on conflict (id) do update set paper_count = excluded.paper_count
    `;
  }
}

async function poolMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return out;
}

const globalIngest = globalThis as typeof globalThis & {
  __meridianIngest?: Promise<IngestStats>;
  __meridianLast?: number;
};

export async function ingestAll(force = false): Promise<IngestStats> {
  const now = Date.now();
  if (!force && globalIngest.__meridianIngest) return globalIngest.__meridianIngest;
  if (!force && globalIngest.__meridianLast && now - globalIngest.__meridianLast < STALE_MS) {
    return readStats();
  }
  const run = (async () => {
    await seedCatalog();
    const sql = await getSql();
    const runRows = await sql<{ id: number }>`insert into ingest_runs (status) values ('running') returning id`;
    const runId = runRows[0]?.id;
    let ok = 0;
    let failed = 0;
    let inserted = 0;
    let dupes = 0;
    const statuses: Status[] = [];

    await poolMap(SOURCES, 6, async (source) => {
      const started = new Date().toISOString();
      try {
        const entries = await collect(source);
        let count = 0;
        for (const e of entries) {
          try {
            const item = composeItem(source, e);
            const r = await upsertItem(item);
            if (r === "insert") {
              inserted += 1;
              count += 1;
            } else dupes += 1;
          } catch {
            dupes += 1;
          }
        }
        ok += 1;
        await sql`
          update sources set last_fetch_at = ${started}, last_error = null,
            fetch_count = fetch_count + 1, item_count = item_count + ${count}
          where id = ${source.id}
        `;
        statuses.push({ id: source.id, name: source.name, ok: true, count, lastFetch: started });
      } catch (err) {
        failed += 1;
        const msg = err instanceof Error ? err.message : "fetch failed";
        await sql`
          update sources set last_fetch_at = ${started}, last_error = ${msg}, fetch_count = fetch_count + 1
          where id = ${source.id}
        `;
        statuses.push({ id: source.id, name: source.name, ok: false, error: msg, count: 0, lastFetch: started });
      }
    });

    await recomputeTrends();
    await extractModelsAndPeople();
    const finished = new Date().toISOString();
    if (runId) {
      await sql`
        update ingest_runs set finished_at = ${finished}, status = 'ok',
          sources_ok = ${ok}, sources_failed = ${failed}, items_inserted = ${inserted},
          duplicates_removed = ${dupes}
        where id = ${runId}
      `;
    }
    await sql`
      insert into meta (key, value, updated_at) values ('last_updated', ${finished}, ${finished})
      on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at
    `;
    globalIngest.__meridianLast = Date.now();
    return {
      sourcesOk: ok,
      sourcesFailed: failed,
      itemsInserted: inserted,
      duplicatesRemoved: dupes,
      lastUpdated: finished,
      sourceStatuses: statuses,
    };
  })();

  globalIngest.__meridianIngest = run;
  try {
    return await run;
  } finally {
    globalIngest.__meridianIngest = undefined;
  }
}

export async function ensureFresh(force = false): Promise<IngestStats> {
  const sql = await getSql();
  const count = await sql<{ n: number }>`select count(*)::int as n from items`;
  const last = await sql<{ value: string }>`select value from meta where key = 'last_updated'`;
  const lastMs = last[0]?.value ? new Date(last[0].value).getTime() : 0;
  const empty = (count[0]?.n ?? 0) === 0;
  const stale = Date.now() - lastMs > STALE_MS;

  if (!force && globalIngest.__meridianIngest) {
    if (empty) {
      const timed = new Promise<IngestStats>((resolve) => {
        setTimeout(() => {
          void readStats().then(resolve);
        }, 12000);
      });
      return Promise.race([globalIngest.__meridianIngest, timed]);
    }
    return readStats();
  }

  if (force || empty || stale) {
    const run = ingestAll(force);
    if (!empty && !force) {
      void run.catch((err) => console.error("[meridian] ingest", err));
      return readStats();
    }
    const timed = new Promise<IngestStats>((resolve) => {
      setTimeout(() => {
        void readStats().then(resolve);
      }, 14000);
    });
    return Promise.race([run, timed]);
  }
  return readStats();
}

export async function readStats(): Promise<IngestStats> {
  const sql = await getSql();
  const last = await sql<{ value: string }>`select value from meta where key = 'last_updated'`;
  const run = await sql<{
    sources_ok: number;
    sources_failed: number;
    items_inserted: number;
    duplicates_removed: number;
  }>`select sources_ok, sources_failed, items_inserted, duplicates_removed from ingest_runs order by id desc limit 1`;
  const src = await sql<{
    id: string;
    name: string;
    last_error: string | null;
    last_fetch_at: string | null;
    item_count: number;
  }>`select id, name, last_error, last_fetch_at, item_count from sources order by name`;
  const r = run[0];
  return {
    sourcesOk: r?.sources_ok ?? 0,
    sourcesFailed: r?.sources_failed ?? 0,
    itemsInserted: r?.items_inserted ?? 0,
    duplicatesRemoved: r?.duplicates_removed ?? 0,
    lastUpdated: last[0]?.value ?? null,
    sourceStatuses: src.map((s) => ({
      id: s.id,
      name: s.name,
      ok: !s.last_error,
      error: s.last_error ?? undefined,
      count: s.item_count,
      lastFetch: s.last_fetch_at,
    })),
  };
}

export { hashId };
