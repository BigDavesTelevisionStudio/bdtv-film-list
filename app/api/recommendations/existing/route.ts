import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — returns a status map for every imdbId that has ever been
// recommended or accepted, so the recommend page can block re-submissions and
// show the right label per item.
export async function GET() {
  try {
    const [recs, items] = await Promise.all([
      db.recommendation.findMany({
        select: { imdbId: true, status: true },
      }),
      db.item.findMany({
        select: { imdbId: true },
      }),
    ]);

    const statuses: Record<string, string> = {};

    // If multiple recs exist for same imdbId, highest priority wins
    const priority: Record<string, number> = { accepted: 3, pending: 2, rejected: 1 };
    for (const r of recs) {
      const current = statuses[r.imdbId];
      if (!current || (priority[r.status] ?? 0) > (priority[current] ?? 0)) {
        statuses[r.imdbId] = r.status;
      }
    }

    // Items on the live list are always "accepted"
    for (const item of items) {
      statuses[item.imdbId] = "accepted";
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("GET /api/recommendations/existing error:", error);
    return NextResponse.json({ statuses: {} });
  }
}
