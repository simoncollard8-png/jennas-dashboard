// app/grades/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment } from "@/lib/types";
import { toStatus } from "@/lib/types";

export default function GradesPage() {
  const [rows, setRows] = useState<Assignment[]>([]);

  async function load() {
    const { data } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");
    setRows(
      (data ?? []).map((x: any) => ({ ...x, status: toStatus(x.status) }))
    );
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen p-6">
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold hover:text-rose-600">Dashboard</Link>
        <Link href="/calendar" className="font-bold hover:text-rose-600">Calendar</Link>
        <Link href="/grades" className="font-bold text-rose-700 underline">Grades</Link>
      </nav>

      <div className="max-w-3xl mx-auto bg-white/80 rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Grades (placeholder)</h1>
          <p className="text-sm text-gray-600">Wire this to your real grade calc when ready.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Assignment</th>
              <th className="text-left p-3">Course</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.title}</td>
                <td className="p-3">{r.course?.title ?? "—"}</td>
                <td className="p-3">{r.due_date}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}




