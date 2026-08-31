import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/agents")({
  loader: () => fetchItems({ data: { category: "agents", range: "month", limit: 50 } }),
  component: () => (
    <CategoryScreen
      kicker="Agentic systems"
      title="Agents"
      body="Tool use, computer use, multi-agent systems, and autonomous coding."
      items={Route.useLoaderData()}
    />
  ),
});
