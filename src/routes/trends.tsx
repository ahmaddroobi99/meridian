import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchTrends } from "@/lib/server/feed";
import { ORG_BY_ID } from "@/lib/intelligence/sources";

export const Route = createFileRoute("/trends")({
  loader: () => fetchTrends(),
  component: TrendsPage,
});

function TrendsPage() {
  const trends = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Cross-source"
        title="Trending AI"
        body="Topics that appear independently in papers, lab blogs, GitHub, and industry coverage score higher than a single viral post."
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-subtle">
            <tr>
              <th className="px-3 py-2">Topic</th>
              <th className="px-3 py-2">Dir</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Papers</th>
              <th className="px-3 py-2">Week share</th>
              <th className="px-3 py-2">Orgs</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2.5">
                  <Link to="/search" search={{ q: t.topic, category: t.id }} className="hover:text-accent">
                    {t.topic}
                  </Link>
                  <p className="text-xs text-muted">{t.summary}</p>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs uppercase text-accent">{t.direction}</td>
                <td className="px-3 py-2.5 tabular-nums">{t.articleCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{t.paperCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{Math.round(t.growth * 100)}%</td>
                <td className="px-3 py-2.5 text-xs text-muted">
                  {t.orgs.map((o) => ORG_BY_ID[o]?.name ?? o).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeedScaffold>
  );
}
