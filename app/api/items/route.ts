import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.item.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
