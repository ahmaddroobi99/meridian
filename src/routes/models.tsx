import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchModels } from "@/lib/server/feed";

export const Route = createFileRoute("/models")({
  loader: () => fetchModels(),
  component: ModelsPage,
});

function ModelsPage() {
  const models = Route.useLoaderData();
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Disclosed only"
        title="Models"
        body="Extracted from the live corpus. Undisclosed parameter counts, context lengths, and benchmarks are not invented."
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-subtle">
            <tr>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Org</th>
              <th className="px-3 py-2">Openness</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2.5">
                  <Link to="/models/$slug" params={{ slug: m.slug }} className="hover:text-accent">
                    {m.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted">{m.organization ?? "—"}</td>
                <td className="px-3 py-2.5 font-mono text-xs uppercase">{m.openness}</td>
                <td className="px-3 py-2.5 text-muted">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeedScaffold>
  );
}
