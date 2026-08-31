import { createFileRoute } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { ArticleCard } from "@/components/feed/article-card";
import { fetchMonthly } from "@/lib/server/feed";

export const Route = createFileRoute("/monthly")({
  loader: () => fetchMonthly(),
  component: MonthlyPage,
});

function MonthlyPage() {
  const { month, papers, trends } = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Monthly intelligence"
        title="AI monthly report"
        body="Major developments, research, and emerging topics over the last 30 days."
      />
      <section className="mb-10 grid gap-3 md:grid-cols-2">
        {trends.slice(0, 8).map((t) => (
          <article key={t.id} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-medium">{t.topic}</h3>
            <p className="mt-2 text-sm text-muted">{t.summary}</p>
          </article>
        ))}
      </section>
      <h2 className="mb-3 text-lg">Papers</h2>
      <div className="mb-10 grid gap-3">
        {papers.slice(0, 8).map((item) => (
          <ArticleCard key={item.id} item={item} dense />
        ))}
      </div>
      <h2 className="mb-3 text-lg">Corpus highlights</h2>
      <div className="grid gap-3">
        {month.slice(0, 12).map((item) => (
          <ArticleCard key={item.id} item={item} dense />
        ))}
      </div>
    </FeedScaffold>
  );
}
