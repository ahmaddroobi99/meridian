import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/research")({
  loader: () => fetchItems({ data: { range: "week", limit: 50, wasteMyTime: true } }),
  component: () => (
    <CategoryScreen
      kicker="Primary + high depth"
      title="Research"
      body="Papers and lab notes from the last week, filtered for technical depth."
      items={Route.useLoaderData()}
    />
  ),
});
