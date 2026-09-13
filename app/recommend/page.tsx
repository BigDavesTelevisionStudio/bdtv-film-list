import Link from "next/link";
import { RecommendSearch } from "@/components/RecommendSearch";
import { Button } from "@/components/ui/button";
import { Tv2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Recommend — BigDaveTV",
  description: "Recommend films and TV shows to BigDave",
};

export default function RecommendPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000" }}>
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex h-12 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Tv2 className="h-4.5 w-4.5 text-amber-400" />
              <span className="text-sm font-semibold tracking-tight text-white">
                BigDave<span className="text-amber-400">TV</span>
              </span>
            </Link>
            <Link href="/">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-full px-3 text-[12px] text-[#86868b] hover:text-white hover:bg-white/8"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-14 pb-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5">
          <p className="text-sm font-medium tracking-widest text-amber-400/70 uppercase">
            Suggest something
          </p>
          <h1
            className="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            Recommend to BigDave
          </h1>
          <p className="mt-2 text-[15px] text-[#86868b] max-w-md">
            Search IMDB, pick your titles, and send them through. BigDave
            reviews everything before it hits the list.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        <RecommendSearch />
      </main>
    </div>
  );
}
