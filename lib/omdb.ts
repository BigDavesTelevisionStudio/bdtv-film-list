const OMDB_BASE = "https://www.omdbapi.com/";

function getApiKey(): string {
  const key = process.env.OMDB_API_KEY;
  if (!key) throw new Error("OMDB_API_KEY is not set");
  return key;
}

export interface OmdbSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface OmdbDetail {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
  Genre: string;
  imdbRating: string;
  Plot: string;
  Director: string;
  Actors: string;
  totalSeasons?: string;
  Response: string;
  Error?: string;
}

export interface OmdbEpisode {
  Title: string;
  Released: string;
  Episode: string;
  imdbRating: string;
  imdbID: string;
}

export interface OmdbSeason {
  Title: string;
  Season: string;
  Episodes: OmdbEpisode[];
  Response: string;
  Error?: string;
}

export async function searchOmdb(
  query: string,
  type?: "movie" | "series"
): Promise<OmdbSearchResponse> {
  const params = new URLSearchParams({
    apikey: getApiKey(),
    s: query,
    ...(type ? { type } : {}),
  });

  const res = await fetch(`${OMDB_BASE}?${params.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`OMDB search failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchOmdbDetail(imdbId: string): Promise<OmdbDetail> {
  const params = new URLSearchParams({
    apikey: getApiKey(),
    i: imdbId,
    plot: "full",
  });

  const res = await fetch(`${OMDB_BASE}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`OMDB detail fetch failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchOmdbSeason(
  imdbId: string,
  season: number
): Promise<OmdbSeason> {
  const params = new URLSearchParams({
    apikey: getApiKey(),
    i: imdbId,
    Season: String(season),
  });

  const res = await fetch(`${OMDB_BASE}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`OMDB season fetch failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAllSeasons(
  imdbId: string,
  totalSeasons: number
): Promise<OmdbSeason[]> {
  const seasons: OmdbSeason[] = [];

  for (let s = 1; s <= totalSeasons; s++) {
    try {
      const season = await fetchOmdbSeason(imdbId, s);
      if (season.Response === "False") break;
      seasons.push(season);
    } catch {
      break;
    }
  }

  return seasons;
}
