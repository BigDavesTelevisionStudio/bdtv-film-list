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

    const item = await db.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const newWatched = !item.watched;

    const updated = await db.item.update({
      where: { id },
      data: {
        watched: newWatched,
        watchedAt: newWatched ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unauthorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("PATCH /api/items/[id]/watch error:", error);
    return NextResponse.json(
      { error: "Failed to toggle watched status" },
      { status: 500 }
    );
  }
}
