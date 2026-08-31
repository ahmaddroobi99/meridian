import { createFileRoute } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";
import { fetchGraph } from "@/lib/server/feed";

export const Route = createFileRoute("/graph")({
  loader: () => fetchGraph(),
  component: GraphPage,
});

function GraphPage() {
  const data = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Map"
        title="Knowledge graph"
        body="Taxonomy over the live corpus. Node size follows item count. Click a topic to open search."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface p-2">
        <KnowledgeGraph data={data} />
      </div>
    </FeedScaffold>
  );
}
