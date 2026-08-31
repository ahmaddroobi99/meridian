import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchItems, fetchModel } from "@/lib/server/feed";

export const Route = createFileRoute("/models/$slug")({
  loader: async ({ params }) => {
    const model = await fetchModel({ data: { slug: params.slug } });
    const items = model
      ? await fetchItems({ data: { q: model.name, limit: 20 } })
      : [];
    return { model, items };
  },
  component: ModelPage,
});

function ModelPage() {
  const { model, items } = Route.useLoaderData();
  if (!model) {
    return (
      <FeedScaffold>
        <PageHeader title="Unknown model" body="Not present in the extracted model index." />
      </FeedScaffold>
    );
  }
  const rows = [
    ["Parameters", model.parameters ?? "Unknown / not verified"],
    ["Context", model.contextLength ?? "Unknown / not verified"],
    ["License", model.license ?? "Unknown / not verified"],
    ["Openness", model.openness],
    ["Hardware", model.hardware ?? "Unknown / not verified"],
    ["Modalities", model.modalities.join(", ") || "Unknown / not verified"],
  ];
  return (
    <FeedScaffold>
      <PageHeader kicker={model.organization ?? "model"} title={model.name} body={model.notes} />
      <dl className="mb-8 grid gap-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4">
            <dt className="font-mono text-xs uppercase tracking-widest text-subtle">{k}</dt>
            <dd className="mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mb-3 text-lg">Mentions</h2>
      <ul className="grid gap-2">
        {items.map((i) => (
          <li key={i.id}>
            <Link to="/item/$id" params={{ id: i.id }} className="text-sm hover:text-accent">
              {i.title}
            </Link>
          </li>
        ))}
      </ul>
    </FeedScaffold>
  );
}
