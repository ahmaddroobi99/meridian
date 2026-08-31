import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";
import type { ItemRecord } from "@/lib/intelligence/types";

export const Route = createFileRoute("/open-source")({
  loader: async () => {
    const [models, releases, hf] = await Promise.all([
      fetchItems({ data: { kind: "model", limit: 24 } }),
      fetchItems({ data: { kind: "release", limit: 20 } }),
      fetchItems({ data: { source: "hf-blog", limit: 20 } }),
    ]);
    const seen = new Set<string>();
    const merged: ItemRecord[] = [];
    for (const i of [...hf, ...releases, ...models]) {
      if (seen.has(i.id)) continue;
      seen.add(i.id);
      merged.push(i);
    }
    return merged;
  },
  component: Page,
});

function Page() {
  return (
    <CategoryScreen
      kicker="Weights & code"
      title="Open source"
      body="Model drops, library releases, and Hugging Face activity. License and availability are taken from public metadata only."
      items={Route.useLoaderData()}
    />
  );
}
