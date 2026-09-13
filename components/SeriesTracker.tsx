"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface SeriesTrackerProps {
  seasons: Season[];
  isAdmin?: boolean;
  onToggleEpisode?: (episodeId: string) => void;
}

export function SeriesTracker({
  seasons,
  isAdmin = false,
  onToggleEpisode,
}: SeriesTrackerProps) {
  const [openSeasons, setOpenSeasons] = useState<Record<number, boolean>>({
    1: true,
  });
  const [localEpisodes, setLocalEpisodes] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      seasons.forEach((s) =>
        s.episodes.forEach((e) => {
          map[e.id] = e.watched;
        })
      );
      return map;
    }
  );

  const toggleSeason = (seasonNumber: number) => {
    setOpenSeasons((prev) => ({
      ...prev,
      [seasonNumber]: !prev[seasonNumber],
    }));
  };

  const handleToggleEpisode = (episodeId: string) => {
    if (!isAdmin || !onToggleEpisode) return;
    setLocalEpisodes((prev) => ({ ...prev, [episodeId]: !prev[episodeId] }));
    onToggleEpisode(episodeId);
  };

  return (
    <div className="divide-y divide-white/5">
      {seasons.map((season) => {
        const watchedCount = season.episodes.filter(
          (e) => localEpisodes[e.id]
        ).length;
        const totalCount = season.episodes.length;
        const progress =
          totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;
        const isOpen = openSeasons[season.seasonNumber];

        return (
          <div key={season.id}>
            <button
              onClick={() => toggleSeason(season.seasonNumber)}
              className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              )}
              <span className="text-xs font-medium text-gray-300">
                Season {season.seasonNumber}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-gray-600">
                  {watchedCount}/{totalCount}
                </span>
                <div className="w-16">
                  <Progress
                    value={progress}
                    className="h-1 bg-[#1a1a24]"
                  />
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="pb-1">
                {season.episodes.map((episode) => {
                  const isWatched = localEpisodes[episode.id];
                  return (
                    <div
                      key={episode.id}
                      className={cn(
                        "flex items-center gap-3 px-6 py-1.5 transition-colors",
                        isAdmin && "hover:bg-white/5",
                        isWatched && "opacity-60"
                      )}
                    >
                      {isAdmin ? (
                        <Checkbox
                          checked={isWatched}
                          onCheckedChange={() => handleToggleEpisode(episode.id)}
                          className="h-3.5 w-3.5 border-gray-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-3 w-3 rounded-sm border border-gray-700 flex-shrink-0",
                            isWatched && "bg-amber-500/60 border-amber-500/60"
                          )}
                        />
                      )}
                      <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">
                        E{String(episode.episodeNumber).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] text-gray-400 truncate",
                          isWatched && "line-through text-gray-600"
                        )}
                      >
                        {episode.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
