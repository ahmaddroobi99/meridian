import { createFileRoute } from "@tanstack/react-router";
import { FeedScaffold, ItemGrid, PageHeader } from "@/components/feed/feed-page";
import { fetchSource } from "@/lib/server/feed";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/sources/$slug")({
  loader: ({ params }) => fetchSource({ data: { slug: params.slug } }),
  component: SourcePage,
});

function SourcePage() {
  const data = Route.useLoaderData();
  if (!data) {
    return (
      <FeedScaffold>
        <PageHeader title="Unknown source" />
      </FeedScaffold>
    );
  }
  const { source, items } = data;
  return (
    <FeedScaffold>
      <PageHeader
        kicker={source.reliability}
        title={source.name}
        body={`${source.kind} · last fetch ${formatDate(source.last_fetch_at)} · ${source.item_count} collected`}
      />
      {source.last_error && <p className="mb-4 text-sm text-danger">{source.last_error}</p>}
      <a href={source.url} className="mb-6 inline-block text-sm text-accent" target="_blank" rel="noreferrer">
        {source.url}
      </a>
      <ItemGrid items={items} empty="No items stored from this feed yet." />
    </FeedScaffold>
  );
}
