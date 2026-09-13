import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBigDave } from "@/lib/auth";
import { fetchOmdbDetail, fetchAllSeasons } from "@/lib/omdb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBigDave();

    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: "accept" | "reject" };

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const recommendation = await db.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    if (action === "reject") {
      const updated = await db.recommendation.update({
        where: { id },
        data: { status: "rejected", reviewedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    // Accept: fetch full OMDB data and create Item
    const detail = await fetchOmdbDetail(recommendation.imdbId);

    if (detail.Response === "False") {
      return NextResponse.json(
        { error: "Could not fetch OMDB data for this item" },
        { status: 500 }
      );
    }

    // Check if item already exists
    const existingItem = await db.item.findUnique({
      where: { imdbId: recommendation.imdbId },
    });

    if (existingItem) {
      // Item already in list, just mark recommendation as accepted
      await db.recommendation.update({
        where: { id },
        data: { status: "accepted", reviewedAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        message: "Item already in list",
        itemId: existingItem.id,
      });
    }

    // Get max sort order
    const maxItem = await db.item.findFirst({
      orderBy: { sortOrder: "desc" },
    });
    const nextSortOrder = (maxItem?.sortOrder ?? -1) + 1;

    // Create the item
    const item = await db.item.create({
      data: {
        imdbId: detail.imdbID,
        title: detail.Title,
        type: detail.Type,
        poster: detail.Poster !== "N/A" ? detail.Poster : null,
        year: detail.Year,
        genre: detail.Genre !== "N/A" ? detail.Genre : null,
        imdbRating: detail.imdbRating !== "N/A" ? detail.imdbRating : null,
        plot: detail.Plot !== "N/A" ? detail.Plot : null,
        director: detail.Director !== "N/A" ? detail.Director : null,
        actors: detail.Actors !== "N/A" ? detail.Actors : null,
        sortOrder: nextSortOrder,
      },
    });

    // For series, fetch all seasons and episodes
    if (detail.Type === "series" && detail.totalSeasons) {
      const totalSeasons = parseInt(detail.totalSeasons, 10);
      if (!isNaN(totalSeasons) && totalSeasons > 0) {
        const seasons = await fetchAllSeasons(detail.imdbID, totalSeasons);

        for (const seasonData of seasons) {
          const seasonNumber = parseInt(seasonData.Season, 10);
          if (isNaN(seasonNumber)) continue;

          const season = await db.season.create({
            data: {
              itemId: item.id,
              seasonNumber,
            },
          });

          if (seasonData.Episodes && seasonData.Episodes.length > 0) {
            await db.episode.createMany({
              data: seasonData.Episodes.map((ep) => ({
                seasonId: season.id,
                episodeNumber: parseInt(ep.Episode, 10),
                title: ep.Title,
                imdbId: ep.imdbID !== "N/A" ? ep.imdbID : null,
              })),
            });
          }
        }
      }
    }

    // Mark recommendation as accepted
    await db.recommendation.update({
      where: { id },
      data: { status: "accepted", reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true, itemId: item.id });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unauthorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("PATCH /api/recommendations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to process recommendation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBigDave();
    const { id } = await params;
    await db.recommendation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/recommendations/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
