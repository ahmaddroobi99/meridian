import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/github")({
  loader: () => fetchItems({ data: { kind: "repo", limit: 50, order: "recent" } }),
  component: function GithubPage() {
    return (
      <CategoryScreen
        kicker="Buildable AI"
        title="GitHub"
        body="Active repositories and releases: vLLM, llama.cpp, TensorRT-LLM, DeepSpeed, MLX, plus trending LLM/agent/robotics repos."
        items={Route.useLoaderData()}
      />
    );
  },
});
