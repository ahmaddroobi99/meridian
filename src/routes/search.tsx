import { createFileRoute } from "@tanstack/react-router";
import { FeedScaffold, ItemGrid, PageHeader } from "@/components/feed/feed-page";
import { Input } from "@/components/ui/input";
import { fetchSearch } from "@/lib/server/feed";
import { ROOT_CATEGORIES } from "@/lib/intelligence/taxonomy";
import { useNavigate } from "@tanstack/react-router";

type Search = {
  q?: string;
  category?: string;
  kind?: "paper" | "article" | "repo" | "model" | "release" | "discussion" | "all";
  range?: "hour" | "today" | "week" | "month" | "all";
  difficulty?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : undefined,
    kind: (typeof s.kind === "string" ? s.kind : "all") as Search["kind"],
    range: (typeof s.range === "string" ? s.range : "month") as Search["range"],
    difficulty: typeof s.difficulty === "string" ? s.difficulty : "all",
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchSearch({ data: deps }),
  component: SearchPage,
});

function SearchPage() {
  const items = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const set = (patch: Partial<Search>) => {
    void navigate({ search: { ...search, ...patch } });
  };
  return (
    <FeedScaffold>
      <PageHeader
        kicker="Retrieval"
        title="Search"
        body="Full-text over titles, abstracts, and categories in the live corpus — papers, repos, models, and articles."
      />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Input
          defaultValue={search.q}
          placeholder="VLM robotics, CUDA inference…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value });
          }}
          className="md:col-span-2"
        />
        <select
          className="h-10 rounded-md border border-border bg-surface px-2 text-sm"
          value={search.kind ?? "all"}
          onChange={(e) => set({ kind: e.target.value as Search["kind"] })}
        >
          {["all", "paper", "article", "repo", "model", "release", "discussion"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-surface px-2 text-sm"
          value={search.range ?? "month"}
          onChange={(e) => set({ range: e.target.value as Search["range"] })}
        >
          {["hour", "today", "week", "month", "all"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {ROOT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => set({ category: search.category === c.id ? undefined : c.id })}
            className={`h-9 rounded-md border px-3 text-xs ${search.category === c.id ? "border-accent text-accent" : "border-border text-muted"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ItemGrid items={items} empty="No matches. Try a broader window or a different category." />
    </FeedScaffold>
  );
}
