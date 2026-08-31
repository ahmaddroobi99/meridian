import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { ArticleCard, BriefRow } from "@/components/feed/article-card";
import { Score } from "@/components/feed/meta";
import { Badge } from "@/components/ui/badge";
import { bootstrapFeed } from "@/lib/server/feed";
import { formatRelative, readingTime } from "@/lib/utils";
import type { ItemRecord } from "@/lib/intelligence/types";
import { CATEGORY_BY_ID } from "@/lib/intelligence/taxonomy";

export const Route = createFileRoute("/")({
  loader: () => bootstrapFeed(),
  pendingComponent: HomePending,
  component: Home,
});

function HomePending() {
  return (
    <FeedScaffold>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">Collecting live feeds</p>
      <h1 className="mt-3 text-3xl">What matters in AI today</h1>
      <p className="mt-3 text-sm text-muted">Pulling arXiv, lab blogs, GitHub, and engineering RSS…</p>
    </FeedScaffold>
  );
}

function Home() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const collecting = data.stats.items === 0;

  useEffect(() => {
    if (!collecting) return;
    const t = window.setInterval(() => {
      void router.invalidate();
    }, 4000);
    return () => window.clearInterval(t);
  }, [collecting, router]);

  return (
    <FeedScaffold lastUpdated={data.lastUpdated}>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          kicker="Live corpus"
          title="What matters in AI today"
          body="Not a headline stream. Ranked by technical significance, novelty, source credibility, and whether you can actually learn or build from it."
        />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs tabular-nums text-muted sm:grid-cols-4">
          <Stat k="items" v={data.stats.items} />
          <Stat k="papers" v={data.stats.papers} />
          <Stat k="repos" v={data.stats.repos} />
          <Stat k="sources" v={data.stats.sources} />
        </dl>
      </div>

      {collecting && (
        <div className="mb-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          First collection is running in the background. Refresh in a few seconds — this terminal does not ship mock news.
        </div>
      )}

      <section className="mb-12">
        <SectionTitle kicker="Priority" title="If you only read five things today" to="/today" />
        <div className="grid gap-3 lg:grid-cols-5">
          {data.topFive.map((item, i) => (
            <TopFiveCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <SectionTitle kicker="Last 24 hours" title="Today" to="/today" />
          <div className="grid gap-3">
            {data.today.slice(0, 8).map((item) => (
              <ArticleCard key={item.id} item={item} />
            ))}
          </div>
        </section>
        <aside className="flex flex-col gap-8 lg:col-span-5">
          <section className="rounded-xl border border-border bg-surface p-3">
            <SectionTitle kicker="Signal" title="Breaking" to="/today" />
            {data.breaking.length ? (
              data.breaking.slice(0, 6).map((item, i) => <BriefRow key={item.id} item={item} index={i} />)
            ) : (
              <p className="px-2 py-3 text-sm text-muted">No confirmed breaking items in the current window.</p>
            )}
          </section>
          <section className="rounded-xl border border-border bg-surface p-3">
            <SectionTitle kicker="Topics" title="Trending AI" to="/trends" />
            <ul className="divide-y divide-border">
              {data.trends.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                  <div>
                    <p className="text-sm">{t.topic}</p>
                    <p className="font-mono text-xs text-subtle">
                      {t.articleCount} items · {t.paperCount} papers · {t.direction}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-accent">{Math.round(t.growth * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-12">
        <SectionTitle kicker="Seven days" title="This week" to="/research" />
        <div className="grid gap-3 md:grid-cols-2">
          {data.week.slice(0, 8).map((item) => (
            <ArticleCard key={item.id} item={item} dense />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle kicker="Study" title="Deep reads" to="/papers" />
        <div className="grid gap-3">
          {data.deepReads.map((item) => (
            <ArticleCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionTitle kicker="arXiv & labs" title="Research" to="/papers" />
          <div className="grid gap-3">
            {data.research.slice(0, 6).map((item) => (
              <ArticleCard key={item.id} item={item} dense />
            ))}
          </div>
        </section>
        <section>
          <SectionTitle kicker="Reproduce" title="Build this" to="/github" />
          <div className="grid gap-3">
            {data.buildThis.slice(0, 6).map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-medium">
                  <Link to="/item/$id" params={{ id: item.id }} className="hover:text-accent">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted">{item.buildNotes}</p>
                <div className="mt-3 flex gap-4">
                  <Score value={item.practicalValue} label="build" />
                  <Score value={item.technicalDepth} label="depth" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </FeedScaffold>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div>
      <dt className="text-subtle">{k}</dt>
      <dd className="text-lg text-fg">{v}</dd>
    </div>
  );
}

function SectionTitle({ kicker, title, to }: { kicker: string; title: string; to: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-subtle">{kicker}</p>
        <h2 className="text-xl tracking-tight">{title}</h2>
      </div>
      <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
        Open <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

function TopFiveCard({ item, rank }: { item: ItemRecord; rank: number }) {
  return (
    <Link
      to="/item/$id"
      params={{ id: item.id }}
      className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] hover:border-border-strong"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs tabular-nums text-accent">{String(rank).padStart(2, "0")}</span>
        <Badge tone="muted">{item.difficulty}</Badge>
      </div>
      <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted">{item.whyItMatters}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs text-subtle">
        <div>
          <dt>Learn</dt>
          <dd className="text-fg">{CATEGORY_BY_ID[item.categories[0] ?? ""]?.label ?? item.kind}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd className="tabular-nums text-fg">{readingTime(item.summary + item.technicalSummary)} min</dd>
        </div>
      </dl>
      <p className="mt-3 font-mono text-xs text-subtle">{formatRelative(item.publishedAt)}</p>
    </Link>
  );
}
