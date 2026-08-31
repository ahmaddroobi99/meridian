import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureFresh, ingestAll, readStats } from "@/lib/intelligence/ingest";
import { compareItems, explainItem } from "@/lib/intelligence/explain";
import {
  clusterMates,
  getDashboard,
  getGraph,
  getItem,
  getModel,
  getModels,
  getOrg,
  getOrgs,
  getResearchers,
  getSource,
  getTrends,
  listItems,
  monthlyBundle,
  relatedItems,
  searchAll,
  weeklyBundle,
} from "@/lib/intelligence/queries";
import { ORGANIZATIONS, SOURCES } from "@/lib/intelligence/sources";
import { LEARNING_PATHS, ROOT_CATEGORIES, TAXONOMY } from "@/lib/intelligence/taxonomy";
import type { DashboardPayload } from "@/lib/intelligence/types";

function emptyDashboard(): DashboardPayload {
  return {
    lastUpdated: null,
    topFive: [],
    today: [],
    week: [],
    deepReads: [],
    breaking: [],
    research: [],
    buildThis: [],
    trends: [],
    stats: { items: 0, papers: 0, repos: 0, sources: 0 },
  };
}

export const bootstrapFeed = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
    return await getDashboard();
  } catch (err) {
    console.error("[meridian] ingest failed", err);
    try {
      return await getDashboard();
    } catch (inner) {
      console.error("[meridian] dashboard failed", inner);
      return emptyDashboard();
    }
  }
});

export const refreshFeed = createServerFn({ method: "POST" }).handler(async () => {
  const stats = await ingestAll(true);
  const dash = await getDashboard();
  return { stats, dash };
});

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* still return stats */
  }
  return readStats();
});

export const fetchItems = createServerFn({ method: "GET" })
  .validator(
    (input: {
      limit?: number;
      kind?: "paper" | "article" | "repo" | "model" | "release" | "discussion" | "all";
      category?: string;
      range?: "hour" | "today" | "week" | "month" | "all";
      source?: string;
      difficulty?: string;
      wasteMyTime?: boolean;
      q?: string;
      breaking?: boolean;
      buildable?: boolean;
      papers?: boolean;
      order?: "importance" | "recent";
    }) => input,
  )
  .handler(async ({ data }) => {
    try {
      await ensureFresh(false);
    } catch {
      /* empty corpus still ok */
    }
    return listItems(data);
  });

export const fetchItem = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const item = await getItem(data.id);
    if (!item) return { item: null, related: [], cluster: [] };
    const [related, cluster] = await Promise.all([
      relatedItems(item),
      clusterMates(item.clusterId, item.id),
    ]);
    return { item, related, cluster };
  });

export const fetchSearch = createServerFn({ method: "GET" })
  .validator((input: { q?: string; range?: "hour" | "today" | "week" | "month" | "all"; kind?: "paper" | "article" | "repo" | "model" | "release" | "discussion" | "all"; category?: string; difficulty?: string; wasteMyTime?: boolean }) => input)
  .handler(async ({ data }) => {
    try {
      await ensureFresh(false);
    } catch {
      /* ignore */
    }
    return searchAll({
      ...data,
      difficulty: data.difficulty as "beginner" | "intermediate" | "advanced" | "research" | "expert" | "all" | undefined,
    });
  });

export const fetchGraph = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return getGraph();
});

export const fetchTrends = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return getTrends();
});

export const fetchWeekly = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return weeklyBundle();
});

export const fetchMonthly = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return monthlyBundle();
});

export const fetchModels = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return getModels();
});

export const fetchModel = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => getModel(data.slug));

export const fetchOrgs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureFresh(false);
  } catch {
    /* ignore */
  }
  return getOrgs();
});

export const fetchOrg = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    try {
      await ensureFresh(false);
    } catch {
      /* ignore */
    }
    return getOrg(data.slug);
  });

export const fetchSource = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    try {
      await ensureFresh(false);
    } catch {
      /* ignore */
    }
    return getSource(data.slug);
  });

export const fetchResearchers = createServerFn({ method: "GET" }).handler(async () => getResearchers());

export const fetchCatalog = createServerFn({ method: "GET" }).handler(async () => ({
  sources: SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    kind: s.kind,
    reliability: s.reliability,
    url: s.url,
  })),
  orgs: ORGANIZATIONS,
  taxonomy: TAXONOMY,
  roots: ROOT_CATEGORIES,
  learning: LEARNING_PATHS,
}));

export const explainFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), mode: z.enum(["engineer", "deep"]) }))
  .handler(async ({ data }) => explainItem(data.id, data.mode));

export const compareFn = createServerFn({ method: "POST" })
  .validator(z.object({ a: z.string(), b: z.string() }))
  .handler(async ({ data }) => compareItems(data.a, data.b));
