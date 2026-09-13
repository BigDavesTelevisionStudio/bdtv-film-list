"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GripVertical, Save, Loader2, Film, Tv, Star } from "lucide-react";
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
  watched: boolean;
  seasons: Season[];
}

function SortableItem({ item, index }: { item: Item; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSeries = item.type === "series";
  const allEpisodes = item.seasons.flatMap((s) => s.episodes);
  const watchedCount = allEpisodes.filter((e) => e.watched).length;
  const totalCount = allEpisodes.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-white/10 bg-[#111118] p-2.5 transition-shadow",
        isDragging &&
          "border-amber-500/50 bg-[#1a1a1f] shadow-2xl shadow-amber-500/20 z-10 opacity-90"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-600 hover:text-gray-400 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Position number */}
      <span className="w-7 text-center text-xs font-mono text-gray-600">
        {index + 1}
      </span>

      {/* Poster */}
      <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded">
        {item.poster ? (
          <Image
            src={item.poster}
            alt={item.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1e1e2e]">
            {isSeries ? (
              <Tv className="h-3.5 w-3.5 text-gray-600" />
            ) : (
              <Film className="h-3.5 w-3.5 text-gray-600" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.year && (
            <span className="text-[11px] text-gray-500">{item.year}</span>
          )}
          <Badge
            className={cn(
              "px-1 py-0 text-[9px] uppercase",
              isSeries
                ? "bg-blue-600/20 text-blue-400"
                : "bg-amber-600/20 text-amber-400"
            )}
          >
            {isSeries ? "TV" : "Film"}
          </Badge>
          {item.imdbRating && item.imdbRating !== "N/A" && (
            <span className="flex items-center gap-0.5 text-[11px] text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {item.imdbRating}
            </span>
          )}
          {isSeries && totalCount > 0 && (
            <span className="text-[11px] text-gray-600">
              {watchedCount}/{totalCount} eps
            </span>
          )}
        </div>
      </div>

      {/* Watched indicator */}
      {item.watched && (
        <Badge className="flex-shrink-0 bg-green-500/10 text-[10px] text-green-400">
          Watched
        </Badge>
      )}
    </div>
  );
}

interface SortableListProps {
  initialItems: Item[];
}

export function SortableList({ initialItems }: SortableListProps) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setHasChanges(true);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/items/sort", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: items.map((i) => i.id) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setHasChanges(false);
      toast.success("Order saved!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save order"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Drag items to reorder. This is the order your public list will show.
        </p>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save Order
            </>
          )}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-gray-600">
          <Film className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No items in your list yet.</p>
          <p className="mt-1 text-sm">
            Accept some recommendations from the dashboard.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {items.map((item, index) => (
                <SortableItem key={item.id} item={item} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
