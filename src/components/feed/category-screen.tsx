import { FeedScaffold, ItemGrid, PageHeader } from "./feed-page";
import type { ItemRecord } from "@/lib/intelligence/types";

export function CategoryScreen({
  kicker,
  title,
  body,
  items,
}: {
  kicker: string;
  title: string;
  body: string;
  items: ItemRecord[];
}) {
  return (
    <FeedScaffold>
      <PageHeader kicker={kicker} title={title} body={body} />
      <ItemGrid items={items} empty="Nothing in this slice of the live corpus yet. Refresh the feeds." />
    </FeedScaffold>
  );
}
