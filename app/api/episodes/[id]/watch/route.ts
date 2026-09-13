import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBigDave } from "@/lib/auth";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBigDave();

    const { id } = await params;

    const episode = await db.episode.findUnique({
      where: { id },
      include: {
        season: {
          include: {
            item: {
              include: {
                seasons: {
                  include: {
                    episodes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const newWatched = !episode.watched;

    await db.episode.update({
      where: { id },
      data: {
        watched: newWatched,
        watchedAt: newWatched ? new Date() : null,
      },
    });

    // Auto-update series watched status based on all episodes
    const item = episode.season.item;
    const allEpisodes = item.seasons.flatMap((s) => s.episodes);

    // If we're marking this episode as watched, check if all are now watched
    // If we're unmarking, the series definitely isn't fully watched
    let seriesWatched = false;
    if (newWatched) {
      const otherEpisodes = allEpisodes.filter((ep) => ep.id !== id);
      seriesWatched = otherEpisodes.every((ep) => ep.watched);
    }

    if (seriesWatched !== item.watched) {
      await db.item.update({
        where: { id: item.id },
        data: {
          watched: seriesWatched,
          watchedAt: seriesWatched ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ success: true, watched: newWatched });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unauthorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("PATCH /api/episodes/[id]/watch error:", error);
    return NextResponse.json(
      { error: "Failed to toggle episode watched status" },
      { status: 500 }
    );
  }
}
