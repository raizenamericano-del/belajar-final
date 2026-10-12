import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return NextResponse.json({
    app: "KayuUkur Pro",
    status: "ok",
    mode: configured ? "supabase-configured" : "local-demo",
    timestamp: new Date().toISOString(),
  }, { headers: { "cache-control": "no-store" } });
}
