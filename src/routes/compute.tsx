import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/compute")({
  loader: () => fetchItems({ data: { category: "infra", range: "month", limit: 50 } }),
  component: () => (
    <CategoryScreen
      kicker="Infrastructure"
      title="Compute"
      body="Training, inference, quantization, compilation, and distributed systems."
      items={Route.useLoaderData()}
    />
  ),
});
