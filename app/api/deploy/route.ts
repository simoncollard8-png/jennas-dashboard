import { NextResponse } from "next/server";

export async function POST() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return NextResponse.json({ error: "Missing VERCEL_DEPLOY_HOOK_URL" }, { status: 500 });
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 });
  return NextResponse.json({ ok: true });
}
