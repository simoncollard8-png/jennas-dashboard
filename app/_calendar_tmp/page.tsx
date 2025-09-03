// app/calendar/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, ModalAssignment } from "@/lib/types";
import { toStatus } from "@/lib/types";
import AssignmentModal from "@/components/AssignmentModal";

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cursor, setCursor] = useState(() => new Date()); // current view anchor
  const [mode, setMode] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<ModalAssignment | null>(null);

  async function load() {
    const { data } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");
    const normalized = (data ?? []).map((x: any) => ({
      ...x,
      status: toStatus(x.status),
    })) as Assignment[];
    setAssignments(normalized);
  }

  useEffect(() => {
    load();
  }, []);

  // Helpers
  function fmt(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  // Month grid days
  const monthDays = useMemo(() => {
    if (mode !== "month") return [];
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // start Monday

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [cursor, mode]);

  const listByDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const key = a.due_date; // expecting yyyy-mm-dd
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [assignments]);

  function incMonth(delta: number) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  }

  const todayStr = fmt(new Date());

  return (
    <main className="min-h-screen p-6">
      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-6 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold hover:text-rose-600">Dashboard</Link>
        <Link href="/calendar" className="font-bold text-rose-700 underline">Calendar</Link>
        <Link href="/grades" className="font-bold hover:text-rose-600">Grades</Link>
      </nav>

      <div className="max-w-6xl mx-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => setMode("month")} className={`px-3 py-1 rounded ${mode==="month"?"bg-rose-600 text-white":"border"}`}>Month</button>
            <button onClick={() => setMode("week")}  className={`px-3 py-1 rounded ${mode==="week" ?"bg-rose-600 text-white":"border"}`}>Week</button>
            <button onClick={() => setMode("day")}   className={`px-3 py-1 rounded ${mode==="day"  ?"bg-rose-600 text-white":"border"}`}>Day</button>
          </div>

          <div className="font-semibold text-lg">
            {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>

          <div className="flex gap-2">
            <button onClick={() => incMonth(-1)} className="px-3 py-1 rounded border">Prev</button>
            <button onClick={() => setCursor(new Date())} className="px-3 py-1 rounded border">Today</button>
            <button onClick={() => incMonth(1)} className="px-3 py-1 rounded border">Next</button>
          </div>
        </div>

        {/* Month view */}
        {mode === "month" && (
          <div className="grid grid-cols-7 gap-1 bg-white/70 rounded-xl border p-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="text-center text-sm font-semibold py-1">{d}</div>
            ))}
            {monthDays.map((d) => {
              const key = fmt(d);
              const items = listByDay.get(key) ?? [];
              const isToday = key === todayStr;
              const inMonth = d.getMonth() === cursor.getMonth();

              return (
                <div
                  key={key}
                  className={`min-h-[110px] border rounded-lg p-2 text-sm bg-white/80 hover:bg-white transition ${
                    inMonth ? "" : "opacity-60"
                  } ${isToday ? "ring-2 ring-rose-400" : ""}`}
                >
                  <div className="text-xs text-gray-600 mb-1">{d.getDate()}</div>
                  <ul className="space-y-1">
                    {items.map((a) => (
                      <li
                        key={a.id}
                        className="px-2 py-1 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer"
                        onClick={() => setSelected(a)}
                      >
                        <span className="font-medium">{a.title}</span>
                        {a.course?.title && (
                          <span className="text-xs text-gray-600 ml-1">({a.course.title})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Week view (simplified list for current week) */}
        {mode === "week" && (
          <div className="bg-white/80 rounded-xl border p-4">
            <h3 className="font-semibold mb-3">
              Week of {cursor.toLocaleDateString()}
            </h3>
            <ul className="space-y-2">
              {assignments
                .filter((a) => {
                  const d = new Date(a.due_date);
                  const start = new Date(cursor);
                  start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
                  const end = new Date(start);
                  end.setDate(start.getDate() + 7);
                  return d >= start && d < end;
                })
                .sort((a, b) => a.due_date.localeCompare(b.due_date))
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 border rounded-lg bg-white hover:bg-rose-50 cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-gray-600">
                        {a.due_date} {a.course?.title ? `— ${a.course.title}` : ""}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border">
                      {a.status}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Day view */}
        {mode === "day" && (
          <div className="bg-white/80 rounded-xl border p-4">
            <h3 className="font-semibold mb-3">
              {cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <ul className="space-y-2">
              {(listByDay.get(fmt(cursor)) ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 border rounded-lg bg-white hover:bg-rose-50 cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-gray-600">
                      {a.course?.title ? a.course.title : ""}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full border">{a.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selected && (
        <AssignmentModal assignment={selected} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </main>
  );
}
















