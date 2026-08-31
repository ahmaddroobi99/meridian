import { createFileRoute } from "@tanstack/react-router";
import { FeedScaffold, ItemGrid, PageHeader } from "@/components/feed/feed-page";
import { fetchOrg } from "@/lib/server/feed";

export const Route = createFileRoute("/orgs/$slug")({
  loader: ({ params }) => fetchOrg({ data: { slug: params.slug } }),
  component: OrgPage,
});

function OrgPage() {
  const data = Route.useLoaderData();
  if (!data) {
    return (
      <FeedScaffold>
        <PageHeader title="Unknown organization" />
      </FeedScaffold>
    );
  }
  return (
    <FeedScaffold>
      <PageHeader kicker={data.org.kind} title={data.org.name} body={data.org.description} />
      {data.org.url && (
        <a href={data.org.url} className="mb-6 inline-block text-sm text-accent" target="_blank" rel="noreferrer">
          {data.org.url}
        </a>
      )}
      <ItemGrid items={data.items} empty="No attributed items yet." />
    </FeedScaffold>
  );
}
