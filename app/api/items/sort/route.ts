import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBigDave } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    await requireBigDave();

    const body = await request.json();
    const { order } = body as { order: string[] };

    if (!order || !Array.isArray(order)) {
      return NextResponse.json(
        { error: "order must be an array of item IDs" },
        { status: 400 }
      );
    }

    // Update each item's sortOrder in a transaction
    await db.$transaction(
      order.map((id, index) =>
        db.item.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unauthorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("PATCH /api/items/sort error:", error);
    return NextResponse.json(
      { error: "Failed to update sort order" },
      { status: 500 }
    );
  }
}
