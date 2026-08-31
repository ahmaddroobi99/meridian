import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchOrgs } from "@/lib/server/feed";

export const Route = createFileRoute("/orgs")({
  loader: () => fetchOrgs(),
  component: OrgsPage,
});

function OrgsPage() {
  const orgs = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader kicker="Labs" title="Organizations" body="Frontier labs, hardware vendors, and open-source stewards tracked in this terminal." />
      <div className="grid gap-3 md:grid-cols-2">
        {orgs.map((o) => (
          <Link
            key={o.id}
            to="/orgs/$slug"
            params={{ slug: o.slug }}
            className="rounded-xl border border-border bg-surface p-4 hover:border-border-strong"
          >
            <h3 className="font-medium">{o.name}</h3>
            <p className="mt-2 text-sm text-muted">{o.description}</p>
          </Link>
        ))}
      </div>
    </FeedScaffold>
  );
}
