import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBigDave } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    await requireBigDave();
    const { ids } = (await request.json()) as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    const { count } = await db.recommendation.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/recommendations/bulk error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
