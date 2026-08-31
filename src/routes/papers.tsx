import { createFileRoute } from "@tanstack/react-router";
import { CategoryScreen } from "@/components/feed/category-screen";
import { fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/papers")({
  loader: () => fetchItems({ data: { papers: true, range: "month", limit: 60, order: "recent" } }),
  component: () => (
    <CategoryScreen
      kicker="arXiv"
      title="Papers"
      body="Newest preprints from cs.AI, cs.LG, cs.CV, cs.CL, cs.RO, stat.ML and cs.NE. Abstracts only — open the PDF on arXiv."
      items={Route.useLoaderData()}
    />
  ),
});
