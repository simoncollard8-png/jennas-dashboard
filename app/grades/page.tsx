// app/grades/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, Course } from "@/lib/types";
import { toStatus } from "@/lib/types";

const FloralDivider = () => (
  <div className="flex items-center gap-2 my-2 opacity-30">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-700" />
    <span className="text-amber-700 text-xs">✦</span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-700" />
  </div>
);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: "status-done",
    "in-progress": "status-in-progress",
    todo: "status-todo",
    "no-class": "status-no-class",
  };
  const label: Record<string, string> = {
    done: "Complete",
    "in-progress": "In Progress",
    todo: "To Do",
    "no-class": "No Class",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-['Lora'] ${map[status] || "status-todo"}`}>
      {label[status] || status}
    </span>
  );
}

function hexToRgba(hex?: string | null, alpha = 0.12) {
  if (!hex || hex.length !== 7) return `rgba(139,105,20,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function GradesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    const { data: a } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");
    setAssignments(
      (a ?? []).map((x: any) => ({ ...x, status: toStatus(x.status) })) as Assignment[]
    );
    const { data: c } = await supabase.from("courses").select("*");
    setCourses((c ?? []) as Course[]);
  }

  useEffect(() => { load(); }, []);

  const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";

  const filteredRows = useMemo(() => {
    return assignments
      .filter(a => !isNoClass(a))
      .filter(a => filter === "all" || a.course_id === filter)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [assignments, filter]);

  const completedCount = assignments.filter(a => a.status === "done").length;
  const totalCount     = assignments.filter(a => !isNoClass(a)).length;
  const inProgressCount = assignments.filter(a => a.status === "in-progress").length;

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
            <Link href="/calendar" className="nav-link">Calendar</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/grades" className="nav-link active">Grades</Link>
          </div>
          <div className="text-xs text-green-300 opacity-60 font-['Lora'] italic">
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <div className="text-center mb-8 fade-in fade-in-1">
          <p className="font-['Lora'] text-xs tracking-[3px] uppercase text-amber-700 opacity-70 mb-2">
            Academic Progress
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl font-bold italic text-stone-800">
            Grade Tracker
          </h1>
          <p className="font-['Lora'] italic text-stone-500 text-sm mt-1">Fall 2025 · University of Mary Washington</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 fade-in fade-in-2">
          {[
            { label: "Current GPA", value: "3.72", sub: "Magna Cum Laude track", color: "var(--green-mid)" },
            { label: "Completed", value: `${completedCount}/${totalCount}`, sub: "assignments", color: "var(--green-mid)" },
            { label: "In Progress", value: String(inProgressCount), sub: "assignments", color: "var(--gold-deep)" },
            { label: "Courses", value: String(courses.length), sub: "enrolled", color: "var(--rose-deep)" },
          ].map(s => (
            <div key={s.label} className="victorian-card p-4 text-center">
              <p className="text-xs font-['Lora'] text-stone-500 mb-1">{s.label}</p>
              <p className="font-['Playfair_Display'] text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-stone-400 font-['Lora'] italic mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Course progress bars */}
        <div className="victorian-card p-5 mb-5 fade-in fade-in-3">
          <h2 className="section-header mb-4">
            <span>★</span> Progress by Course
          </h2>
          <div className="space-y-4">
            {courses.map(c => {
              const courseAssignments = assignments.filter(a => a.course_id === c.id && !isNoClass(a));
              const done = courseAssignments.filter(a => a.status === "done").length;
              const total = courseAssignments.length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              const color = c.color || "#8b6914";
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-['Playfair_Display'] font-semibold" style={{ color }}>
                      {c.title}
                    </span>
                    <span className="text-xs font-['Lora'] text-stone-500">
                      {done}/{total} complete
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: hexToRgba(color, 0.15) }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter */}
        <div className="victorian-card p-3 mb-4 flex flex-wrap gap-2 items-center fade-in fade-in-4">
          <span className="text-xs font-['Lora'] text-stone-500 italic mr-1">Filter:</span>
          <button
            onClick={() => setFilter("all")}
            className="px-3 py-1 rounded-lg text-xs font-['Lora'] transition-all"
            style={filter === "all" ? {
              background: "var(--green-deep)",
              color: "var(--gold-light)",
            } : { color: "var(--ink-light)", border: "1px solid var(--parchment-deep)" }}
          >
            All Courses
          </button>
          {courses.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className="px-3 py-1 rounded-lg text-xs font-['Lora'] transition-all border"
              style={filter === c.id ? {
                background: c.color || "var(--green-deep)",
                color: "#fff",
                borderColor: c.color || "var(--green-deep)",
              } : {
                color: c.color || "var(--ink-light)",
                borderColor: `${c.color || "#8b6914"}40`,
                background: hexToRgba(c.color, 0.06),
              }}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Assignment table */}
        <div className="victorian-card overflow-hidden fade-in fade-in-5">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b text-xs font-['Lora'] font-semibold text-stone-500 uppercase tracking-wide"
            style={{ borderColor: "var(--parchment-deep)" }}>
            <div className="col-span-5">Assignment</div>
            <div className="col-span-3">Course</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Status</div>
          </div>

          {filteredRows.length === 0 && (
            <p className="text-sm font-['Lora'] italic text-stone-400 p-6 text-center">No assignments found.</p>
          )}

          {filteredRows.map((r, i) => {
            const course = (r as any).courses || {};
            const color  = course?.color || "#8b6914";
            return (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b transition-colors hover:bg-amber-50/30"
                style={{ borderColor: "var(--parchment-deep)" }}
              >
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-['Source_Sans_3'] text-stone-700 truncate">{r.title}</span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-stone-400 font-['Lora'] italic mt-0.5 ml-3.5 truncate">{r.notes}</p>
                  )}
                </div>
                <div className="col-span-3 flex items-center">
                  <span
                    className="text-xs font-['Lora'] truncate"
                    style={{ color }}
                  >
                    {course?.title || r.course_id}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-xs font-['Lora'] text-stone-500">
                    {new Date(r.due_date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short", day: "numeric"
                    })}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="mt-4 text-center fade-in fade-in-6">
          <p className="text-xs font-['Lora'] italic text-stone-400">
            Grade weights and earned scores can be added when syllabi are loaded. GPA projection will update automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
