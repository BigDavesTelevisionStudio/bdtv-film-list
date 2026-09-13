"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, X, CheckCircle, Film, Tv, Send, Loader2, Info, Star, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
  imdbRating?: string;
}

interface SelectedItem extends SearchResult {
  genre?: string;
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending:  { text: "Pending review", color: "text-amber-400" },
  accepted: { text: "On the list",    color: "text-green-400" },
  rejected: { text: "Not accepted",   color: "text-red-400" },
};

export function RecommendSearch() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "movie" | "series">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedItems, setSubmittedItems] = useState<SelectedItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatuses = useCallback(() => {
    fetch("/api/recommendations/existing")
      .then((r) => r.json())
      .then((data) => setStatuses(data.statuses ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const doSearch = useCallback(async (q: string, type: string) => {
    if (q.trim().length >= 2) {
      setLoading(true);
      try {
        const typeParam = type === "all" ? "" : `&type=${type}`;
        const res = await fetch(`/api/imdb/search?q=${encodeURIComponent(q)}${typeParam}`);
        const data = await res.json();
        if (res.status === 403 && data.error) {
          toast.error(data.error, { duration: 6000 });
          setResults([]);
        } else {
          setResults(data.results ?? []);
        }
      } catch {
        toast.error("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(value, searchType), 400);
  };

  const handleTypeChange = (value: string) => {
    const t = value as "all" | "movie" | "series";
    setSearchType(t);
    if (query.trim().length >= 2) doSearch(query, t);
  };

  const toggleSelect = (item: SearchResult) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.imdbID === item.imdbID);
      if (exists) return prev.filter((s) => s.imdbID !== item.imdbID);
      if (prev.length < 10) return [...prev, item];
      toast.error("Max 10 items per batch");
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { toast.error("Select at least one title"); return; }
    if (!name.trim()) { toast.error("Enter your name"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((item) => ({
            imdbId: item.imdbID,
            title: item.Title,
            type: item.Type,
            poster: item.Poster === "N/A" ? undefined : item.Poster,
            year: item.Year,
          })),
          suggestedBy: name.trim(),
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmittedItems(selected);
      setSubmitted(true);
      fetchStatuses(); // refresh so re-search shows updated statuses
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="rounded-full p-5 mb-4" style={{ background: "rgba(52,199,89,0.1)" }}>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            Sent to BigDave
          </h2>
          <p className="mt-1.5 text-[15px] text-[#86868b]">
            {submittedItems.length} recommendation{submittedItems.length === 1 ? "" : "s"} submitted for review. BigDave will take a look.
          </p>
        </div>

        {/* List of what was sent */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(28,28,30,0.6)" }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">Your picks</p>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {submittedItems.map((item) => {
              const isSeries = item.Type === "series";
              return (
                <div key={item.imdbID} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                    {item.Poster && item.Poster !== "N/A" ? (
                      <Image src={item.Poster} alt={item.Title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: "rgba(44,44,46,0.8)" }}>
                        {isSeries ? <Tv className="h-3.5 w-3.5 text-[#48484a]" /> : <Film className="h-3.5 w-3.5 text-[#48484a]" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{item.Title}</p>
                    <p className="text-[11px] text-[#636366]">{item.Year}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400/70">
                    <Clock className="h-3 w-3" />
                    <span>Pending</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              setSubmitted(false);
              setSubmittedItems([]);
              setSelected([]);
              setQuery("");
              setResults([]);
              setName("");
              setMessage("");
            }}
            className="rounded-full border-white/10 bg-transparent text-[#86868b] hover:bg-white/5 hover:text-white"
            variant="outline"
          >
            Send more recommendations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Search panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#48484a]" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search IMDB..."
              className="rounded-xl border-white/8 pl-9 text-[13px] text-white placeholder:text-[#48484a] focus-visible:ring-amber-500/40"
              style={{ background: "rgba(28,28,30,0.8)" }}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[#48484a]" />
            )}
          </div>

          <Tabs value={searchType} onValueChange={handleTypeChange} className="flex-shrink-0">
            <TabsList
              className="rounded-xl border-white/8 text-xs"
              style={{ background: "rgba(28,28,30,0.8)" }}
            >
              {(["all", "movie", "series"] as const).map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-lg text-[11px] capitalize data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400"
                >
                  {t === "all" && "All"}
                  {t === "movie" && "Films"}
                  {t === "series" && "TV"}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {results.map((item) => {
              const isSelected = selected.some((s) => s.imdbID === item.imdbID);
              const existingStatus = statuses[item.imdbID];
              const isSeries = item.Type === "series";
              const statusInfo = existingStatus ? STATUS_LABEL[existingStatus] : null;

              return (
                <button
                  key={item.imdbID}
                  onClick={() => { if (!existingStatus) toggleSelect(item); }}
                  disabled={!!existingStatus}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2.5 text-left transition-all",
                    existingStatus && "cursor-not-allowed opacity-50",
                    !existingStatus && isSelected && "bg-amber-500/10 border border-amber-500/30",
                    !existingStatus && !isSelected && "border border-white/6 hover:border-white/12"
                  )}
                  style={{ background: isSelected && !existingStatus ? undefined : "rgba(28,28,30,0.5)" }}
                >
                  <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                    {item.Poster && item.Poster !== "N/A" ? (
                      <Image src={item.Poster} alt={item.Title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: "rgba(44,44,46,0.8)" }}>
                        {isSeries ? <Tv className="h-4 w-4 text-[#48484a]" /> : <Film className="h-4 w-4 text-[#48484a]" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{item.Title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-[#636366]">{item.Year}</span>
                      {item.imdbRating && (
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-400">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          {item.imdbRating}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          isSeries ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"
                        )}
                      >
                        {isSeries ? "TV" : "Film"}
                      </span>
                      {statusInfo && (
                        <span className={cn("flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide", statusInfo.color)}>
                          <Ban className="h-2.5 w-2.5" />
                          {statusInfo.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && !existingStatus && (
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="py-10 text-center text-[#48484a] text-sm">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length === 0 && (
          <div className="py-10 text-center">
            <Search className="mx-auto mb-2.5 h-7 w-7 text-[#3a3a3c]" />
            <p className="text-sm text-[#48484a]">Search for movies and TV shows</p>
            <p className="mt-1 text-[12px] text-[#3a3a3c]">Select up to 10 titles to recommend</p>
          </div>
        )}
      </div>

      {/* Submission panel */}
      <div className="space-y-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-[13px] font-semibold text-white mb-3" style={{ letterSpacing: "-0.01em" }}>
            Your picks
            {selected.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">
                {selected.length}
              </span>
            )}
          </h3>

          {selected.length === 0 ? (
            <p className="text-[12px] text-[#48484a]">Select titles from search results</p>
          ) : (
            <div className="space-y-1.5">
              {selected.map((item) => (
                <div
                  key={item.imdbID}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-white font-medium">{item.Title}</p>
                    <p className="text-[10px] text-[#636366]">{item.Year}</p>
                  </div>
                  <button onClick={() => toggleSelect(item)} className="text-[#3a3a3c] hover:text-red-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div>
            <label htmlFor="rec-name" className="mb-1.5 block text-[12px] font-medium text-[#86868b]">
              Your name <span className="text-red-400">*</span>
            </label>
            <Input
              id="rec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              className="rounded-xl border-white/8 text-[13px] text-white placeholder:text-[#48484a] focus-visible:ring-amber-500/40"
              style={{ background: "rgba(28,28,30,0.8)" }}
            />
          </div>
          <div>
            <label htmlFor="rec-message" className="mb-1.5 block text-[12px] font-medium text-[#86868b]">
              Message <span className="text-[#3a3a3c]">(optional)</span>
            </label>
            <textarea
              id="rec-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why should BigDave watch this?"
              rows={3}
              className="w-full resize-none rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-[#48484a] focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0 || !name.trim()}
            className="w-full rounded-full bg-amber-500 text-black hover:bg-amber-400 font-medium disabled:opacity-40 text-[13px]"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Sending...</>
            ) : (
              <><Send className="mr-2 h-3.5 w-3.5" />Send {selected.length > 0 ? selected.length : ""} Recommendation{selected.length === 1 ? "" : "s"}</>
            )}
          </Button>
        </div>

        <div
          className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: "rgba(28,28,30,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#636366]" />
          <p className="text-[11px] leading-relaxed text-[#636366]">
            Only IMDB-verified titles can be recommended. BigDave reviews all
            suggestions before they go on the list.
          </p>
        </div>
      </div>
    </div>
  );
}
