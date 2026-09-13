import { NextRequest, NextResponse } from "next/server";
import { fetchOmdbDetail } from "@/lib/omdb";
import { anyFieldFlagged, BLOCKED_MESSAGE } from "@/lib/profanityFilter";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ imdbId: string }> }
) {
  const { imdbId } = await params;

  if (!imdbId || !imdbId.startsWith("tt")) {
    return NextResponse.json({ error: "Invalid IMDB ID" }, { status: 400 });
  }

  if (anyFieldFlagged(imdbId)) {
    return NextResponse.json({ error: BLOCKED_MESSAGE }, { status: 403 });
  }

  try {
    const data = await fetchOmdbDetail(imdbId);

    if (data.Response === "False") {
      return NextResponse.json(
        { error: data.Error ?? "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("OMDB detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OMDB details" },
      { status: 500 }
    );
  }
}
