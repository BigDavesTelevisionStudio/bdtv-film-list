import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBigDave } from "@/lib/auth";
import { anyFieldFlagged, BLOCKED_MESSAGE } from "@/lib/profanityFilter";
import { fetchOmdbDetail } from "@/lib/omdb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, suggestedBy, message } = body as {
      items: Array<{
        imdbId: string;
        title: string;
        type: string;
        poster?: string;
        year?: string;
        genre?: string;
        imdbRating?: string;
      }>;
      suggestedBy: string;
      message?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    if (!suggestedBy || suggestedBy.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (items.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 items per recommendation" },
        { status: 400 }
      );
    }

    // Check every user-supplied string field for racial slurs
    const flagged =
      anyFieldFlagged(suggestedBy, message) ||
      items.some((i) => anyFieldFlagged(i.title, i.genre));
    if (flagged) {
      return NextResponse.json({ error: BLOCKED_MESSAGE }, { status: 403 });
    }

    const omdbChecks = await Promise.all(
      items.map((i) => fetchOmdbDetail(i.imdbId).catch(() => ({ Response: "False" as const })))
    );
    const invalidIdx = omdbChecks.findIndex((r) => r.Response === "False");
    if (invalidIdx !== -1) {
      return NextResponse.json(
        { error: `"${items[invalidIdx].title}" was not found in IMDB.` },
        { status: 400 }
      );
    }

    const imdbIds = items.map((i) => i.imdbId);

    const [existingRecs, existingItems] = await Promise.all([
      db.recommendation.findMany({
        where: { imdbId: { in: imdbIds }, status: { in: ["pending", "approved"] } },
        select: { imdbId: true, title: true },
      }),
      db.item.findMany({
        where: { imdbId: { in: imdbIds } },
        select: { imdbId: true, title: true },
      }),
    ]);

    const duplicates = [
      ...existingRecs.map((r) => r.title),
      ...existingItems.map((i) => i.title),
    ];

    if (duplicates.length > 0) {
      const list = [...new Set(duplicates)].join(", ");
      return NextResponse.json(
        { error: `Already recommended: ${list}` },
        { status: 409 }
      );
    }

    const created = await db.recommendation.createMany({
      data: items.map((item, idx) => {
        const omdb = omdbChecks[idx] as Extract<(typeof omdbChecks)[number], { Title: string }>;
        return {
          imdbId: item.imdbId,
          title: omdb.Title ?? item.title,
          type: item.type,
          poster: omdb.Poster && omdb.Poster !== "N/A" ? omdb.Poster : null,
          year: omdb.Year ?? item.year,
          genre: omdb.Genre ?? item.genre,
          imdbRating: omdb.imdbRating && omdb.imdbRating !== "N/A" ? omdb.imdbRating : item.imdbRating,
          suggestedBy: suggestedBy.trim(),
          message: message?.trim() || null,
          status: "pending",
        };
      }),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to submit recommendations" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireBigDave();

    const recommendations = await db.recommendation.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unauthorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
