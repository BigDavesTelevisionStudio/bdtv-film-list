import { db } from "@/lib/db";
import { SortableList } from "@/components/SortableList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sort List — BigDaveTV Admin",
};

async function getItems() {
  return db.item.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
          },
        },
      },
    },
  });
}

export default async function AdminListPage() {
  const items = await getItems();

  const serialized = items.map((item) => ({
    ...item,
    addedAt: item.addedAt.toISOString(),
    watchedAt: item.watchedAt?.toISOString() ?? null,
    seasons: item.seasons.map((s) => ({
      ...s,
      episodes: s.episodes.map((e) => ({
        ...e,
        watchedAt: e.watchedAt?.toISOString() ?? null,
      })),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Sort Your List</h1>
        <p className="mt-1 text-sm text-gray-400">
          Drag and drop to arrange items in the order you want them displayed.
        </p>
      </div>

      <SortableList initialItems={serialized} />
    </div>
  );
}
