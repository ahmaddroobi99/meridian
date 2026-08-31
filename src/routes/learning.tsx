import { createFileRoute, Link } from "@tanstack/react-router";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { fetchCatalog, fetchItems } from "@/lib/server/feed";
import { CATEGORY_BY_ID, LEARNING_PATHS } from "@/lib/intelligence/taxonomy";
import { usePersonal } from "@/lib/store/personal";

export const Route = createFileRoute("/learning")({
  loader: async () => {
    const [catalog, recent] = await Promise.all([
      fetchCatalog(),
      fetchItems({ data: { range: "week", limit: 20, wasteMyTime: true } }),
    ]);
    return { catalog, recent };
  },
  component: LearningPage,
});

function LearningPage() {
  const { recent } = Route.useLoaderData();
  const topics = usePersonal((s) => s.topics);
  const toggle = usePersonal((s) => s.toggleTopic);
  const read = usePersonal((s) => s.read);

  return (
    <FeedScaffold>
      <PageHeader
        kicker="Curriculum"
        title="What should I learn next?"
        body="Follow topics. Paths are fixed engineering tracks; the live corpus fills the reading list. Gaps are categories you follow but have not read this week."
      />
      <section className="mb-10">
        <h2 className="mb-3 text-lg">Followed topics</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORY_BY_ID)
            .filter((c) => !c.parent)
            .map((c) => {
              const on = topics.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`h-10 rounded-md border px-3 text-sm ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}
                >
                  {c.label}
                </button>
              );
            })}
        </div>
      </section>
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        {LEARNING_PATHS.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-medium">{p.title}</h3>
            <ol className="mt-3 space-y-2">
              {p.steps.map((id, i) => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <Link to="/search" search={{ q: CATEGORY_BY_ID[id]?.label ?? id, category: id }} className="hover:text-accent">
                    {CATEGORY_BY_ID[id]?.label ?? id}
                  </Link>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
      <section>
        <h2 className="mb-3 text-lg">This week's assigned reading</h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {recent
            .filter((i) => i.categories.some((c) => topics.includes(c)))
            .slice(0, 12)
            .map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link to="/item/$id" params={{ id: i.id }} className={read.includes(i.id) ? "text-muted" : "hover:text-accent"}>
                  {i.title}
                </Link>
                <span className="font-mono text-xs text-subtle">{i.difficulty}</span>
              </li>
            ))}
        </ul>
      </section>
    </FeedScaffold>
  );
}
