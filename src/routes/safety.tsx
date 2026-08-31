import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/safety")({
  loader: () => fetchItems({ data: { category: "safety", range: "month", limit: 50 } }),
  component: () => (
    <CategoryScreen
      kicker="Alignment"
      title="AI safety"
      body="Alignment, interpretability, evaluation, robustness, and agent containment. Community posts are labeled as such."
      items={Route.useLoaderData()}
    />
  ),
});
