import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReadingList = { id: string; name: string; itemIds: string[] };

type PersonalState = {
  bookmarks: string[];
  read: string[];
  topics: string[];
  orgs: string[];
  ratings: Record<string, number>;
  lists: ReadingList[];
  wasteMyTime: boolean;
  theme: "dark" | "light";
  toggleBookmark: (id: string) => void;
  markRead: (id: string) => void;
  toggleTopic: (id: string) => void;
  toggleOrg: (id: string) => void;
  rate: (id: string, n: number) => void;
  setWaste: (v: boolean) => void;
  setTheme: (t: "dark" | "light") => void;
  addList: (name: string) => void;
  addToList: (listId: string, itemId: string) => void;
};

export const usePersonal = create<PersonalState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      read: [],
      topics: ["agents", "vlms", "robotics", "cuda", "llms"],
      orgs: ["openai", "anthropic", "google-deepmind", "nvidia", "huggingface"],
      ratings: {},
      lists: [{ id: "later", name: "Read later", itemIds: [] }],
      wasteMyTime: true,
      theme: "dark",
      toggleBookmark: (id) => {
        const has = get().bookmarks.includes(id);
        set({ bookmarks: has ? get().bookmarks.filter((x) => x !== id) : [...get().bookmarks, id] });
      },
      markRead: (id) => {
        if (get().read.includes(id)) return;
        set({ read: [...get().read, id] });
      },
      toggleTopic: (id) => {
        const has = get().topics.includes(id);
        set({ topics: has ? get().topics.filter((x) => x !== id) : [...get().topics, id] });
      },
      toggleOrg: (id) => {
        const has = get().orgs.includes(id);
        set({ orgs: has ? get().orgs.filter((x) => x !== id) : [...get().orgs, id] });
      },
      rate: (id, n) => set({ ratings: { ...get().ratings, [id]: n } }),
      setWaste: (v) => set({ wasteMyTime: v }),
      setTheme: (t) => set({ theme: t }),
      addList: (name) =>
        set({ lists: [...get().lists, { id: crypto.randomUUID(), name, itemIds: [] }] }),
      addToList: (listId, itemId) =>
        set({
          lists: get().lists.map((l) =>
            l.id === listId && !l.itemIds.includes(itemId)
              ? { ...l, itemIds: [...l.itemIds, itemId] }
              : l,
          ),
        }),
    }),
    { name: "meridian-personal", skipHydration: true },
  ),
);
