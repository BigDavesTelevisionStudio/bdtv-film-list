import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// --- Simple sliding-window rate limiter (in-memory per edge instance) ---
// Good enough to stop casual hammering. Limits per IP.
const LIMITS: Record<string, { requests: number; windowMs: number }> = {
  "/api/imdb/search":      { requests: 20, windowMs: 60_000 },  // 20/min
  "/api/recommendations":  { requests: 5,  windowMs: 60_000 },  // 5/min
};

// ip -> { route -> timestamps[] }
const store = new Map<string, Record<string, number[]>>();

function isRateLimited(ip: string, route: string): boolean {
  const limit = LIMITS[route];
  if (!limit) return false;

  const now = Date.now();
  const windowStart = now - limit.windowMs;

  const ipData = store.get(ip) ?? {};
  const timestamps = (ipData[route] ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  ipData[route] = timestamps;
  store.set(ip, ipData);

  return timestamps.length > limit.requests;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export default clerkMiddleware(async (auth, req) => {
  // Rate limit public API routes
  const pathname = req.nextUrl.pathname;
  const limitedRoute = Object.keys(LIMITS).find((r) => pathname.startsWith(r));
  if (limitedRoute) {
    const ip = getIp(req);
    if (isRateLimited(ip, limitedRoute)) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Protect admin routes
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // NOSONAR: String.raw would break Next.js config parsing here
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
