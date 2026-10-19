import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/robotics")({
  loader: () => fetchItems({ data: { category: "robotics", range: "month", limit: 50 } }),
  component: function RoboticsPage() {
    return (
      <CategoryScreen
        kicker="Embodied"
        title="Robotics"
        body="Manipulation, navigation, sim-to-real, and robot foundation models."
        items={Route.useLoaderData()}
      />
    );
  },
});
