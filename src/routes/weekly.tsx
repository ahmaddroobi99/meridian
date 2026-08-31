import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { ArticleCard } from "@/components/feed/article-card";
import { fetchWeekly } from "@/lib/server/feed";

export const Route = createFileRoute("/weekly")({
  loader: () => fetchWeekly(),
  component: WeeklyPage,
});

function WeeklyPage() {
  const { week, papers, build, trends } = Route.useLoaderData();
  const top = week.slice(0, 10);
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Week in review"
        title="AI week in review"
        body="Automatically assembled from the live corpus. This is a ranking of what arrived, not a magazine essay."
      />
      <section className="mb-10">
        <h2 className="mb-3 text-lg">Top 10 developments</h2>
        <div className="grid gap-3">
          {top.map((item, i) => (
            <ArticleCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="mb-3 text-lg">Top papers</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {papers.slice(0, 10).map((item) => (
            <ArticleCard key={item.id} item={item} dense />
          ))}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="mb-3 text-lg">Build these</h2>
        <ul className="grid gap-2">
          {build.map((item) => (
            <li key={item.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              <Link to="/item/$id" params={{ id: item.id }} className="font-medium hover:text-accent">
                {item.title}
              </Link>
              <p className="mt-1 text-muted">{item.buildNotes}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-lg">What changed</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          {trends.slice(0, 6).map((t) => (
            <li key={t.id}>
              {t.topic}: {t.summary}
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-8">
        <Link to="/monthly" className="text-sm text-accent">
          Open the monthly report
        </Link>
      </p>
    </FeedScaffold>
  );
}
