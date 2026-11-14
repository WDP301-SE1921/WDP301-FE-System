import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public deployment readiness; exposes only the immutable source revision. */
export function GET() {
  return NextResponse.json(
    { status: "ok", commit: process.env.APP_COMMIT_SHA || "unknown" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
