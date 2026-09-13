"use client";

import { useState } from "react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { SeriesTracker } from "@/components/SeriesTracker";
import { Star, CheckCircle, Clock, ChevronDown, ChevronUp, Tv, Film } from "lucide-react";
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

interface ItemCardProps {
  item: Item;
  isAdmin?: boolean;
  onToggleWatched?: (itemId: string) => void;
  onToggleEpisode?: (episodeId: string) => void;
}

export function ItemCard({ item, isAdmin = false, onToggleWatched, onToggleEpisode }: Readonly<ItemCardProps>) {
  const [expanded, setExpanded] = useState(false);
  const [localWatched, setLocalWatched] = useState(item.watched);

  const isSeries = item.type === "series";
  const allEpisodes = item.seasons.flatMap((s) => s.episodes);
  const watchedEpisodes = allEpisodes.filter((e) => e.watched).length;
  const totalEpisodes = allEpisodes.length;
  const watchProgress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
  const genreList = item.genre?.split(", ").slice(0, 2) ?? [];

  const handleToggleWatched = () => {
    if (!isAdmin || !onToggleWatched) return;
    setLocalWatched(!localWatched);
    onToggleWatched(item.id);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-300",
        "hover:shadow-xl hover:shadow-black/40 hover:-translate-y-px",
        localWatched && "opacity-60"
      )}
      style={{
        background: "rgba(28,28,30,0.55)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex gap-0">
        {/* Poster */}
        <div className="relative w-[100px] flex-shrink-0 overflow-hidden rounded-l-2xl">
          {item.poster ? (
            <Image
              src={item.poster}
              alt={item.title}
              width={100}
              height={148}
              className="h-full w-full object-cover"
              style={{ minHeight: "148px" }}
            />
          ) : (
            <div
              className="flex h-full min-h-[148px] w-full items-center justify-center"
              style={{ background: "rgba(44,44,46,0.8)" }}
            >
              {isSeries ? (
                <Tv className="h-8 w-8 text-[#48484a]" />
              ) : (
                <Film className="h-8 w-8 text-[#48484a]" />
              )}
            </div>
          )}
          {/* Type pill */}
          <div className="absolute left-1.5 top-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                isSeries
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/25"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/25"
              )}
            >
              {isSeries ? "TV" : "Film"}
            </span>
          </div>
          {/* Watched overlay */}
          {localWatched && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-l-2xl">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="truncate text-[13px] font-semibold text-white leading-snug"
                style={{ letterSpacing: "-0.01em" }}
              >
                {item.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#86868b]">
                {item.year && <span>{item.year}</span>}
                {item.imdbRating && item.imdbRating !== "N/A" && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                    {item.imdbRating}
                  </span>
                )}
              </div>
            </div>

            {isAdmin && !isSeries && (
              <button
                onClick={handleToggleWatched}
                className={cn(
                  "flex-shrink-0 rounded-full p-0.5 transition-colors",
                  localWatched ? "text-green-400" : "text-[#3a3a3c] hover:text-green-400"
                )}
              >
                <CheckCircle className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {genreList.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {genreList.map((g) => (
                <span
                  key={g}
                  className="rounded-full px-2 py-0.5 text-[10px] text-[#86868b]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {g.trim()}
                </span>
              ))}
            </div>
          )}

          {item.plot && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#636366]">
              {item.plot}
            </p>
          )}

          {isSeries && totalEpisodes > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px] text-[#636366]">
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {watchedEpisodes}/{totalEpisodes} eps
                </span>
                <span>{Math.round(watchProgress)}%</span>
              </div>
              <Progress
                value={watchProgress}
                className="h-0.5"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              />
            </div>
          )}

          {isSeries && item.seasons.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" />Hide seasons</>
              ) : (
                <><ChevronDown className="h-3 w-3" />{item.seasons.length} season{item.seasons.length === 1 ? "" : "s"}</>
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && isSeries && (
        <div
          className="border-t"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <SeriesTracker
            seasons={item.seasons}
            isAdmin={isAdmin}
            onToggleEpisode={onToggleEpisode}
          />
        </div>
      )}
    </div>
  );
}
