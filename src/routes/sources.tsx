import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchCatalog } from "@/lib/server/feed";

export const Route = createFileRoute("/sources")({
  loader: () => fetchCatalog(),
  component: SourcesPage,
});

function SourcesPage() {
  const { sources } = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Primary → tertiary"
        title="Sources"
        body="Official APIs and RSS first. Journalism is labeled secondary. Community feeds are tertiary. Full articles are never stored — only metadata and short extracted summaries."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {sources.map((s) => (
          <Link
            key={s.id}
            to="/sources/$slug"
            params={{ slug: s.slug }}
            className="rounded-xl border border-border bg-surface p-4 hover:border-border-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{s.name}</h3>
              <span className="font-mono text-xs uppercase text-subtle">{s.reliability}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {s.kind} · {s.url}
            </p>
          </Link>
        ))}
      </div>
    </FeedScaffold>
  );
}
