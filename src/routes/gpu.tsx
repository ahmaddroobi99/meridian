import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/gpu")({
  loader: () => fetchItems({ data: { category: "gpus", range: "month", limit: 50 } }),
  component: function GpuPage() {
    return (
      <CategoryScreen
        kicker="Kernels"
        title="GPU / CUDA"
        body="CUDA, TensorRT, vLLM, llama.cpp, MLX, and the metal under the Python."
        items={Route.useLoaderData()}
      />
    );
  },
});
