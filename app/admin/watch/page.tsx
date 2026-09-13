"use client";

import { useState, useEffect, useCallback } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, Film, Tv } from "lucide-react";

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  imdbId: string | null;
  watched: boolean;
  watchedAt: string | null;
}

interface Season {
  id: string;
  seasonNumber: number;
  episodes: Episode[];
}

interface Item {
  id: string;
  imdbId: string;
  title: string;
  type: string;
  poster: string | null;
  year: string | null;
  genre: string | null;
  imdbRating: string | null;
  plot: string | null;
  director: string | null;
  actors: string | null;
  watched: boolean;
  watchedAt: string | null;
  seasons: Season[];
}

export default function AdminWatchPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleWatched = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/watch`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to toggle watched");
      }

      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, watched: updated.watched, watchedAt: updated.watchedAt }
            : item
        )
      );
      toast.success(updated.watched ? "Marked as watched!" : "Marked as unwatched");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
      // Revert the optimistic update by refetching
      fetchItems();
    }
  }, [fetchItems]);

  const handleToggleEpisode = useCallback(async (episodeId: string) => {
    try {
      const res = await fetch(`/api/episodes/${episodeId}/watch`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to toggle episode");
      }

      // Refetch to get updated series watched status
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
      fetchItems();
    }
  }, [fetchItems]);

  const movies = items.filter((i) => i.type === "movie");
  const series = items.filter((i) => i.type === "series");

  const tabItems: Record<string, Item[]> = {
    all: items,
    movies,
    series,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mark as Watched</h1>
        <p className="mt-1 text-sm text-gray-400">
          Track your progress. Toggle films or individual episodes.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Eye className="mb-3 h-10 w-10 text-gray-700" />
          <p className="text-gray-500">No items in your list yet.</p>
          <p className="mt-1 text-sm text-gray-600">
            Accept some recommendations from the dashboard first.
          </p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#111118] border border-white/10">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
            >
              All ({items.length})
            </TabsTrigger>
            <TabsTrigger
              value="movies"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
            >
              <Film className="mr-1 h-3 w-3" />
              Films ({movies.length})
            </TabsTrigger>
            <TabsTrigger
              value="series"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
            >
              <Tv className="mr-1 h-3 w-3" />
              Series ({series.length})
            </TabsTrigger>
          </TabsList>

          {["all", "movies", "series"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {tabItems[tab].map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isAdmin={true}
                    onToggleWatched={handleToggleWatched}
                    onToggleEpisode={handleToggleEpisode}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
