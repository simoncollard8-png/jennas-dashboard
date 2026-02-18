// app/calendar/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, ModalAssignment } from "@/lib/types";
import { toStatus } from "@/lib/types";
import AssignmentModal from "@/components/AssignmentModal";

type ViewMode = "month" | "week" | "day";

// ─── helpers ───────────────────────────────────────────────────
const TZ = "America/New_York";
const toESTDate = (val: string | Date): Date => {
  const d = typeof val === "string" ? new Date(val) : val;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return new Date(`${g("year")}-${g("month")}-${g("day")}T00:00:00`);
};

function hexToRgba(hex?: string, alpha = 0.12) {
  if (!hex || hex.length !== 7) return `rgba(139,105,20,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";
const fmt = (d: Date) => d.toISOString().slice(0,10);

const FloralDivider = () => (
  <div className="flex items-center gap-2 my-2 opacity-30">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-700" />
    <span className="text-amber-700 text-xs">✦</span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-700" />
  </div>
);

export default function CalendarPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cursor, setCursor]           = useState(() => new Date());
  const [mode, setMode]               = useState<ViewMode>("month");
  const [selected, setSelected]       = useState<ModalAssignment | null>(null);

  async function load() {
    const { data } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");
    setAssignments(
      (data ?? []).map((x: any) => ({ ...x, status: toStatus(x.status) })) as Assignment[]
    );
  }

  useEffect(() => { load(); }, []);

  // Month grid
  const monthDays = useMemo(() => {
    if (mode !== "month") return [];
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i); days.push(d);
    }
    return days;
  }, [cursor, mode]);

  const listByDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const key = a.due_date;
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [assignments]);

  const todayStr = fmt(new Date());

  function incMonth(delta: number) {
    const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d);
  }

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen pb-16">
      {/* NAV */}
      <nav className="victorian-nav">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">✦</span>
            <span className="font-['Playfair_Display'] italic text-amber-200 text-sm tracking-wide">
              Jenna's Dashboard
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" className="nav-link">Dashboard</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/calendar" className="nav-link active">Calendar</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/grades" className="nav-link">Grades</Link>
          </div>
          <div className="text-xs text-green-300 opacity-60 font-['Lora'] italic">
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <div className="text-center mb-6 fade-in fade-in-1">
          <p className="font-['Lora'] text-xs tracking-[3px] uppercase text-amber-700 opacity-70 mb-1">Academic Calendar</p>
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold italic text-stone-800">
            {monthLabel}
          </h1>
        </div>

        {/* Controls */}
        <div className="victorian-card p-3 mb-5 flex items-center justify-between flex-wrap gap-3 fade-in fade-in-2">
          {/* View mode */}
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            {(["month","week","day"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className="px-4 py-1.5 rounded-md text-xs font-['Lora'] capitalize transition-all"
                style={mode === v ? {
                  background: "var(--green-deep)",
                  color: "var(--gold-light)",
                  boxShadow: "0 1px 4px rgba(45,74,62,0.3)"
                } : { color: "var(--ink-light)" }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => incMonth(-1)} className="btn-secondary px-3 py-1.5 text-xs">‹ Prev</button>
            <button onClick={() => setCursor(new Date())} className="btn-secondary px-3 py-1.5 text-xs">Today</button>
            <button onClick={() => incMonth(1)} className="btn-secondary px-3 py-1.5 text-xs">Next ›</button>
          </div>
        </div>

        {/* MONTH VIEW */}
        {mode === "month" && (
          <div className="victorian-card overflow-hidden fade-in fade-in-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--parchment-deep)" }}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                <div key={d} className="py-2 text-center text-xs font-['Lora'] font-semibold text-stone-500 tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {monthDays.map((d, i) => {
                const key   = fmt(d);
                const items = listByDay.get(key) ?? [];
                const isToday   = key === todayStr;
                const inMonth   = d.getMonth() === cursor.getMonth();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                return (
                  <div
                    key={i}
                    className="min-h-[110px] p-1.5 border-r border-b transition-colors"
                    style={{
                      borderColor: "var(--parchment-deep)",
                      background: isToday
                        ? "rgba(196,150,31,0.06)"
                        : isWeekend && inMonth
                          ? "rgba(26,18,9,0.015)"
                          : !inMonth
                            ? "rgba(26,18,9,0.01)"
                            : "transparent",
                      outline: isToday ? "2px solid rgba(196,150,31,0.4)" : "none",
                      outlineOffset: "-2px",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1 px-0.5">
                      <span
                        className="text-xs font-['Playfair_Display'] font-semibold"
                        style={{
                          color: isToday ? "var(--gold-deep)" : inMonth ? "var(--ink)" : "var(--parchment-deep)",
                          fontWeight: isToday ? 700 : 600,
                        }}
                      >
                        {d.getDate()}
                        {isToday && <span className="ml-1 text-[10px] text-amber-600">●</span>}
                      </span>
                      {items.length > 2 && (
                        <span className="text-[10px] text-stone-400">+{items.length - 2}</span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {items.slice(0, 2).map(a => {
                        const course = (a as any).courses || {};
                        const color  = course?.color || "#8b6914";
                        return (
                          <button
                            key={a.id}
                            onClick={() => setSelected(a)}
                            className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-semibold truncate transition-opacity hover:opacity-80"
                            title={`${course?.title} — ${a.title}`}
                            style={{
                              background: isNoClass(a) ? "rgba(61,107,88,0.12)" : hexToRgba(color, 0.15),
                              borderLeft: `2px solid ${isNoClass(a) ? "#3d6b58" : color}`,
                              color: isNoClass(a) ? "var(--green-mid)" : color,
                            }}
                          >
                            {a.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {mode === "week" && (
          <div className="victorian-card p-5 fade-in fade-in-3">
            <h3 className="font-['Playfair_Display'] font-semibold text-stone-700 mb-4">
              Week of {cursor.toLocaleDateString("en-US", { month:"long", day:"numeric" })}
            </h3>
            <FloralDivider />
            <ul className="space-y-2 mt-3">
              {assignments
                .filter(a => {
                  const d = new Date(a.due_date);
                  const start = new Date(cursor);
                  start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
                  const end = new Date(start); end.setDate(start.getDate() + 7);
                  return d >= start && d < end;
                })
                .sort((a,b) => a.due_date.localeCompare(b.due_date))
                .map(a => {
                  const course = (a as any).courses || {};
                  const color  = course?.color || "#8b6914";
                  return (
                    <li
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                      style={{
                        borderColor: isNoClass(a) ? "rgba(61,107,88,0.3)" : `${color}40`,
                        background: isNoClass(a) ? "rgba(61,107,88,0.06)" : hexToRgba(color, 0.06),
                      }}
                    >
                      <div>
                        <div className="font-['Playfair_Display'] font-semibold text-sm" style={{ color: isNoClass(a) ? "var(--green-mid)" : color }}>
                          {a.title}
                        </div>
                        <div className="text-xs font-['Lora'] text-stone-500 mt-0.5">
                          {a.due_date}{course?.title ? ` — ${course.title}` : ""}
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-['Lora']"
                        style={{
                          color: isNoClass(a) ? "var(--green-mid)" : color,
                          border: `1px solid ${isNoClass(a) ? "rgba(61,107,88,0.3)" : `${color}50`}`,
                          background: isNoClass(a) ? "rgba(61,107,88,0.08)" : hexToRgba(color, 0.08),
                        }}
                      >
                        {a.status}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {/* DAY VIEW */}
        {mode === "day" && (
          <div className="victorian-card p-5 fade-in fade-in-3">
            <h3 className="font-['Playfair_Display'] font-semibold text-stone-700 mb-4">
              {cursor.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
            </h3>
            <FloralDivider />
            {(listByDay.get(fmt(cursor)) ?? []).length === 0 ? (
              <p className="text-sm font-['Lora'] italic text-stone-400 mt-3">Nothing due today 🎉</p>
            ) : (
              <ul className="space-y-2 mt-3">
                {(listByDay.get(fmt(cursor)) ?? []).map(a => {
                  const course = (a as any).courses || {};
                  const color  = course?.color || "#8b6914";
                  return (
                    <li
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                      style={{
                        borderColor: isNoClass(a) ? "rgba(61,107,88,0.3)" : `${color}40`,
                        background: isNoClass(a) ? "rgba(61,107,88,0.06)" : hexToRgba(color, 0.06),
                      }}
                    >
                      <div>
                        <div className="font-['Playfair_Display'] font-semibold text-sm" style={{ color: isNoClass(a) ? "var(--green-mid)" : color }}>
                          {a.title}
                        </div>
                        {course?.title && (
                          <div className="text-xs font-['Lora'] text-stone-500 mt-0.5">{course.title}</div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-['Lora']"
                        style={{
                          color: isNoClass(a) ? "var(--green-mid)" : color,
                          border: `1px solid ${isNoClass(a) ? "rgba(61,107,88,0.3)" : `${color}50`}`,
                        }}
                      >
                        {a.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-5 fade-in fade-in-4">
          <div className="victorian-card p-3 flex flex-wrap gap-3 items-center">
            <span className="text-xs font-['Lora'] text-stone-500 italic">Courses:</span>
            {Array.from(new Set(assignments.map(a => (a as any).courses?.id).filter(Boolean)))
              .map(cid => {
                const a = assignments.find(x => (x as any).courses?.id === cid);
                const course = (a as any)?.courses;
                if (!course) return null;
                return (
                  <div key={cid} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.color || "#8b6914" }} />
                    <span className="text-xs font-['Lora'] text-stone-600">{course.title}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {selected && (
        <AssignmentModal assignment={selected} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </main>
  );
}
