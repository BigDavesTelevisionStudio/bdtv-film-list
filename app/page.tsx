import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Tv2, Send, Film, Tv, CheckCircle } from "lucide-react";

async function getItems() {
  return db.item.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
      },
    },
  });
}

export default async function HomePage() {
  const items = await getItems();
  const movies = items.filter((i) => i.type === "movie");
  const series = items.filter((i) => i.type === "series");
  const watchedCount = items.filter((i) => i.watched).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000" }}>
      {/* Nav */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Tv2 className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold tracking-tight text-white">
                BigDave<span className="text-amber-400">TV</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/recommend">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-full px-3 text-[13px] text-[#86868b] hover:text-white hover:bg-white/8"
                >
                  <Send className="mr-1.5 h-3 w-3" />
                  Recommend
                </Button>
              </Link>
              {/* Admin button intentionally removed — use /iambigdave */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,166,35,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium tracking-widest text-amber-400/70 uppercase">
              BigDaveTV
            </p>
            <h1
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.025em" }}
            >
              The Curated
              <br />
              <span
                className="text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #f5a623 0%, #f5c842 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                Watchlist.
              </span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#86868b] max-w-md">
              Hand-picked films and series. Sorted exactly how BigDave
              intended.
            </p>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                {
                  icon: Film,
                  count: movies.length,
                  label: "Films",
                  color: "text-amber-400",
                },
                {
                  icon: Tv,
                  count: series.length,
                  label: "Series",
                  color: "text-blue-400",
                },
                ...(watchedCount > 0
                  ? [
                      {
                        icon: CheckCircle,
                        count: watchedCount,
                        label: "Watched",
                        color: "text-green-400",
                      },
                    ]
                  : []),
              ].map(({ icon: Icon, count, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span className="text-[13px] font-medium text-white">
                    {count}
                  </span>
                  <span className="text-[13px] text-[#48484a]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <main className="mx-auto max-w-5xl px-5 pb-16">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="rounded-full p-6 mb-5"
              style={{ background: "rgba(245,166,35,0.08)" }}
            >
              <Tv2 className="h-10 w-10 text-amber-400/40" />
            </div>
            <h2
              className="text-xl font-semibold text-white tracking-tight"
              style={{ letterSpacing: "-0.01em" }}
            >
              Nothing here yet
            </h2>
            <p className="mt-2 text-[15px] text-[#86868b] max-w-xs">
              Be the first to recommend something great for BigDave to watch.
            </p>
            <Link href="/recommend" className="mt-6">
              <Button className="rounded-full bg-amber-500 text-black hover:bg-amber-400 px-5 font-medium">
                <Send className="mr-2 h-4 w-4" />
                Make a Recommendation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={{
                  ...item,
                  watchedAt: item.watchedAt?.toISOString() ?? null,
                  seasons: item.seasons.map((s) => ({
                    ...s,
                    episodes: s.episodes.map((e) => ({
                      ...e,
                      watchedAt: e.watchedAt?.toISOString() ?? null,
                    })),
                  })),
                }}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-5xl px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv2 className="h-4 w-4 text-amber-400/50" />
            <span className="text-[13px] text-[#48484a]">BigDaveTV</span>
          </div>
          <Link
            href="/recommend"
            className="text-[13px] text-[#48484a] hover:text-amber-400 transition-colors"
          >
            Recommend something →
          </Link>
        </div>
      </footer>
    </div>
  );
}
