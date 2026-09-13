"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Film,
  Tv,
  Star,
  Loader2,
  MessageSquare,
  User,
  Calendar,
  Inbox,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  imdbId: string;
  title: string;
  type: string;
  poster: string | null;
  year: string | null;
  genre: string | null;
  imdbRating: string | null;
  suggestedBy: string;
  message: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export default function AdminDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecommendations(data);
    } catch {
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Clear selection when tab changes
  useEffect(() => {
    setSelected(new Set());
  }, [activeTab]);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Action failed");
      }

      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: action === "accept" ? "accepted" : "rejected" }
            : r
        )
      );

      toast.success(action === "accept" ? "Added to your list!" : "Recommendation rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch("/api/recommendations/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      const { count } = await res.json();
      setRecommendations((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
      toast.success(`Deleted ${count} recommendation${count !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to bulk delete");
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    if (ids.every((id) => selected.has(id))) {
      setSelected((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...ids]));
    }
  };

  const pending = recommendations.filter((r) => r.status === "pending");
  const accepted = recommendations.filter((r) => r.status === "accepted");
  const rejected = recommendations.filter((r) => r.status === "rejected");

  const filterMap: Record<string, Recommendation[]> = { pending, accepted, rejected };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const currentList = filterMap[activeTab] ?? [];
  const currentIds = currentList.map((r) => r.id);
  const allCurrentSelected = currentIds.length > 0 && currentIds.every((id) => selected.has(id));
  const selectedInTab = currentIds.filter((id) => selected.has(id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Recommendations Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Review what your friends want you to watch.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-white/10 bg-[#111118] p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-lg font-bold text-white">{pending.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Pending</p>
        </Card>
        <Card className="border border-white/10 bg-[#111118] p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-lg font-bold text-white">{accepted.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Accepted</p>
        </Card>
        <Card className="border border-white/10 bg-[#111118] p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-lg font-bold text-white">{rejected.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Rejected</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#111118] border border-white/10">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
          >
            Pending
            {pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="accepted"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
          >
            Accepted
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-xs"
          >
            Rejected
          </TabsTrigger>
        </TabsList>

        {["pending", "accepted", "rejected"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filterMap[tab].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="mb-3 h-10 w-10 text-gray-700" />
                <p className="text-gray-500">No {tab} recommendations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Bulk action bar */}
                <div className="flex items-center justify-between pb-1">
                  <button
                    onClick={() => toggleSelectAll(filterMap[tab].map((r) => r.id))}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                      allCurrentSelected && activeTab === tab
                        ? "border-amber-400 bg-amber-400"
                        : "border-gray-600 bg-transparent"
                    )}>
                      {allCurrentSelected && activeTab === tab && (
                        <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    Select all
                  </button>

                  {selectedInTab.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                      disabled={bulkProcessing}
                      className="h-7 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs gap-1"
                    >
                      {bulkProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete {selectedInTab.length} selected
                    </Button>
                  )}
                </div>

                {filterMap[tab].map((rec) => {
                  const isSeries = rec.type === "series";
                  const isProcessing = processing[rec.id];
                  const isSelected = selected.has(rec.id);

                  return (
                    <Card
                      key={rec.id}
                      className={cn(
                        "border overflow-hidden transition-colors cursor-pointer",
                        isSelected
                          ? "border-amber-500/40 bg-[#1a1a10]"
                          : "border-white/10 bg-[#111118]"
                      )}
                      onClick={() => toggleSelect(rec.id)}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 flex items-start pt-0.5" onClick={(e) => e.stopPropagation()}>
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors mt-1",
                              isSelected
                                ? "border-amber-400 bg-amber-400"
                                : "border-gray-600 bg-transparent"
                            )}
                            onClick={() => toggleSelect(rec.id)}
                          >
                            {isSelected && (
                              <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Poster */}
                        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
                          {rec.poster ? (
                            <Image src={rec.poster} alt={rec.title} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#1e1e2e]">
                              {isSeries ? (
                                <Tv className="h-5 w-5 text-gray-600" />
                              ) : (
                                <Film className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-white text-sm leading-tight">{rec.title}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                {rec.year && <span className="text-xs text-gray-500">{rec.year}</span>}
                                <Badge
                                  className={cn(
                                    "px-1 py-0 text-[9px] uppercase",
                                    isSeries ? "bg-blue-600/20 text-blue-400" : "bg-amber-600/20 text-amber-400"
                                  )}
                                >
                                  {isSeries ? "TV" : "Film"}
                                </Badge>
                                {rec.imdbRating && (
                                  <span className="flex items-center gap-0.5 text-xs text-amber-400">
                                    <Star className="h-3 w-3 fill-amber-400" />
                                    {rec.imdbRating}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status badge for non-pending */}
                            {rec.status !== "pending" && (
                              <Badge
                                className={cn(
                                  "flex-shrink-0 text-[10px]",
                                  rec.status === "accepted"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                )}
                              >
                                {rec.status === "accepted" ? "Accepted" : "Rejected"}
                              </Badge>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rec.suggestedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(rec.createdAt).toLocaleDateString()}
                            </span>
                            {rec.genre && <span className="text-gray-600">{rec.genre}</span>}
                          </div>

                          {/* Message */}
                          {rec.message && (
                            <div className="mt-1.5 flex items-start gap-1.5 rounded bg-[#0d0d14] px-2 py-1.5">
                              <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-600" />
                              <p className="text-[11px] italic text-gray-400">&ldquo;{rec.message}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className="flex gap-2 border-t border-white/5 px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rec.status !== "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(rec.id, "accept")}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs h-7"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Accept
                              </>
                            )}
                          </Button>
                        )}
                        {rec.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(rec.id, "reject")}
                            disabled={isProcessing}
                            className="flex-1 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs h-7"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(rec.id)}
                          disabled={isProcessing}
                          className="border-white/10 text-gray-500 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/50 text-xs h-7 px-2"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
