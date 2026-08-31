import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/multimodal")({
  loader: () => fetchItems({ data: { category: "multimodal", range: "month", limit: 50 } }),
  component: () => (
    <CategoryScreen
      kicker="VLM"
      title="VLM / Multimodal"
      body="Vision-language models, video, audio, and any-to-any architectures."
      items={Route.useLoaderData()}
    />
  ),
});
