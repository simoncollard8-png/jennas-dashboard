import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  // simple shared-secret auth
  if (req.headers.get("x-loader-secret") !== process.env.LOADER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { 
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); 
  }

  const { mode = "replace", course, assignments = [], readings = [] } = body || {};
  if (!course?.id || !course?.title) {
    return NextResponse.json({ error: "Missing course.id or course.title" }, { status: 400 });
  }

  // 1) Upsert course
  {
    const { error } = await supabaseAdmin.from("courses").upsert(course);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2) Optional replace
  if (mode === "replace") {
    const { error: e1 } = await supabaseAdmin.from("assignments").delete().eq("course_id", course.id);
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    // If you created `readings` table, remove this block if not used
    const { error: e2 } = await supabaseAdmin.from("readings").delete().eq("course_id", course.id);
    if (e2 && !/relation .* does not exist/i.test(e2.message)) {
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }
  }

  // 3) Insert assignments
  if (assignments.length) {
    const rows = assignments.map((a: any) => ({ id: a.id ?? crypto.randomUUID(), ...a }));
    const { error } = await supabaseAdmin.from("assignments").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4) Insert readings (if table exists)
  if (readings.length) {
    const rows = readings.map((r: any) => ({
      id: r.id ?? crypto.randomUUID(),
      course_id: r.course_id ?? course.id,
      ...r
    }));
    const { error } = await supabaseAdmin.from("readings").insert(rows);
    if (error && !/relation .* does not exist/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, inserted: { assignments: assignments.length, readings: readings.length } });
}
