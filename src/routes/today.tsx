import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/today")({
  loader: () => fetchItems({ data: { range: "today", limit: 50, order: "importance" } }),
  component: () => {
    const items = Route.useLoaderData();
    return (
      <CategoryScreen
        kicker="Last 24 hours"
        title="Today"
        body="Highest-signal developments in the last day. Product launches without technical substance are downranked."
        items={items}
      />
    );
  },
});
