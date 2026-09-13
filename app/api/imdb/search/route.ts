import { NextRequest, NextResponse } from "next/server";
import { searchOmdb, fetchOmdbDetail } from "@/lib/omdb";
import { filterRacistContent, anyFieldFlagged, BLOCKED_MESSAGE } from "@/lib/profanityFilter";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") as
    | "movie"
    | "series"
    | null;

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (anyFieldFlagged(q, type)) {
    return NextResponse.json(
      { error: BLOCKED_MESSAGE, results: [], total: 0 },
      { status: 403 }
    );
  }

  try {
    const data = await searchOmdb(q.trim(), type ?? undefined);

    if (data.Response === "False") {
      return NextResponse.json({ results: [], total: 0 });
    }

    const rawResults = data.Search ?? [];

    const enriched = await Promise.allSettled(
      rawResults.map((item) => fetchOmdbDetail(item.imdbID))
    );

    const results = rawResults.map((item, i) => {
      const detail = enriched[i];
      return {
        ...item,
        imdbRating:
          detail.status === "fulfilled" &&
          detail.value.imdbRating !== "N/A"
            ? detail.value.imdbRating
            : undefined,
      };
    });

    const filtered = filterRacistContent(results);

    return NextResponse.json({
      results: filtered,
      total: Number.parseInt(data.totalResults ?? "0", 10),
    });
  } catch (error) {
    console.error("OMDB search error:", error);
    return NextResponse.json(
      { error: "Failed to search OMDB" },
      { status: 500 }
    );
  }
}
