import { NextResponse } from "next/server";
import { processDueSubscriptions } from "@/actions/subscriptions";
import { processDueSips } from "@/actions/investment-sips";

// Daily endpoint hit by Vercel Cron (configured in vercel.json).
// Idempotent: safe to call multiple times per day.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.NODE_ENV === "production" && secret !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const subs = await processDueSubscriptions();
  const sips = await processDueSips();
  return NextResponse.json({ ok: true, subscriptions: subs.created, sips: sips.created });
}

export const POST = GET;
