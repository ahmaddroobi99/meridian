import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/physical-ai")({
  loader: () => fetchItems({ data: { category: "robotics", range: "month", limit: 50 } }),
  component: () => (
    <CategoryScreen
      kicker="Physical AI"
      title="Physical AI"
      body="When models leave the chat box: VLA, hardware control, sensors, and the plant."
      items={Route.useLoaderData()}
    />
  ),
});
