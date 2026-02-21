// app/Courses/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, Course, ModalAssignment } from "@/lib/types";
import { toStatus } from "@/lib/types";
import AssignmentList from "@/components/AssignmentList";
import AssignmentModal from "@/components/AssignmentModal";
import NotesPanel from "@/components/NotesPanel";
import ChatWidget from "@/components/ChatWidget";

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab = "assignments" | "readings" | "notes";

interface Reading {
  id: string;
  course_id: string;
  title: string;
  week_number: number | null;
  type: string | null;
  url: string | null;
  notes: string | null;
  status: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function hexToRgba(hex?: string | null, alpha = 0.12) {
  if (!hex || hex.length !== 7) return `rgba(139,105,20,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const FloralDivider = () => (
  <div className="flex items-center gap-2 my-1 opacity-40">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-700" />
    <span className="text-amber-700 text-xs">✦</span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-700" />
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = params.id;

  const [course, setCourse]           = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [readings, setReadings]       = useState<Reading[]>([]);
  const [selected, setSelected]       = useState<ModalAssignment | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("assignments");
  const [loading, setLoading]         = useState(true);

  // ── Load data ─────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);

    const [{ data: courseData }, { data: assignData }, { data: readData }] =
      await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase
          .from("assignments")
          .select("*, courses(id,title,professor,color)")
          .eq("course_id", courseId)
          .order("due_date", { ascending: true }),
        supabase
          .from("readings")
          .select("*")
          .eq("course_id", courseId)
          .order("week_number", { ascending: true }),
      ]);

    if (courseData) setCourse(courseData as Course);
    setAssignments(
      ((assignData ?? []) as any[]).map((x) => ({
        ...x,
        status: toStatus(x.status),
      })) as Assignment[]
    );
    setReadings((readData ?? []) as Reading[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [courseId]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = todayMidnight();
    const real  = assignments.filter(
      (a) => (a.status || "").toLowerCase() !== "no-class"
    );
    return {
      total:     real.length,
      completed: real.filter((a) => a.status === "done").length,
      upcoming:  real.filter(
        (a) => a.status !== "done" && new Date(a.due_date + "T00:00:00") >= today
      ).length,
      overdue: real.filter(
        (a) => a.status !== "done" && new Date(a.due_date + "T00:00:00") < today
      ).length,
    };
  }, [assignments]);

  const completionPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // ── Readings grouped by week ──────────────────────────────────────────────
  const readingsByWeek = useMemo(() => {
    const groups: Record<string, Reading[]> = {};
    readings.forEach((r) => {
      const key =
        r.week_number != null ? `Week ${r.week_number}` : "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [readings]);

  const color = course?.color || "#8b6914";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-16">

      {/* ── Nav ── */}
      <nav className="victorian-nav">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">✦</span>
            <span className="font-['Playfair_Display'] italic text-amber-200 text-sm tracking-wide">
              Jenna's Dashboard
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/"          className="nav-link">Dashboard</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/calendar"  className="nav-link">Calendar</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/grades"    className="nav-link">Grades</Link>
            <Link href="/todos"     className="nav-link">To-Dos</Link>
          </div>
          <div className="text-xs text-green-300 opacity-60 font-['Lora'] italic">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── Back link ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-['Lora'] italic mb-6 transition-colors"
          style={{ color: color }}
        >
          ← Back to Dashboard
        </Link>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="victorian-card p-8 text-center">
            <p className="font-['Lora'] italic text-stone-400 animate-pulse">
              Loading course…
            </p>
          </div>
        )}

        {/* ── 404 state ── */}
        {!loading && !course && (
          <div className="victorian-card p-8 text-center">
            <p className="font-['Playfair_Display'] text-xl font-bold text-stone-700 mb-2">
              Course not found
            </p>
            <p className="font-['Lora'] italic text-stone-400 text-sm">
              We couldn't find a course with ID "{courseId}".
            </p>
            <Link href="/" className="btn-primary inline-block mt-4">
              Return to Dashboard
            </Link>
          </div>
        )}

        {!loading && course && (
          <>
            {/* ── Course Header ── */}
            <div
              className="victorian-card p-6 mb-6 fade-in fade-in-1"
              style={{
                borderColor: `${color}30`,
                background: hexToRgba(color, 0.04),
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  {/* Course ID pill */}
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-['Lora'] font-semibold border mb-2"
                    style={{
                      color,
                      borderColor: `${color}40`,
                      background: hexToRgba(color, 0.12),
                    }}
                  >
                    {courseId}
                  </span>

                  <h1
                    className="font-['Playfair_Display'] text-3xl font-bold leading-tight text-stone-800"
                  >
                    {course.title}
                  </h1>

                  {course.professor && (
                    <p className="font-['Lora'] italic text-stone-500 text-sm mt-1">
                      Prof. {course.professor}
                    </p>
                  )}
                </div>

                {/* Completion ring */}
                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <p
                      className="font-['Playfair_Display'] text-3xl font-bold"
                      style={{ color }}
                    >
                      {completionPct}%
                    </p>
                    <p className="text-xs font-['Lora'] italic text-stone-400">
                      complete
                    </p>
                  </div>
                  {/* Progress arc */}
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle
                      cx="28" cy="28" r="22"
                      fill="none"
                      stroke={hexToRgba(color, 0.15)}
                      strokeWidth="5"
                    />
                    <circle
                      cx="28" cy="28" r="22"
                      fill="none"
                      stroke={color}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionPct / 100)}`}
                      transform="rotate(-90 28 28)"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                  </svg>
                </div>
              </div>

              <FloralDivider />

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {[
                  { label: "Total",     value: stats.total,     accent: color },
                  { label: "Completed", value: stats.completed, accent: "#3d6b58" },
                  { label: "Upcoming",  value: stats.upcoming,  accent: "#8b6914" },
                  { label: "Overdue",   value: stats.overdue,   accent: "#7a3040" },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: hexToRgba(accent, 0.07),
                      border: `1px solid ${hexToRgba(accent, 0.2)}`,
                    }}
                  >
                    <p
                      className="font-['Playfair_Display'] text-2xl font-bold"
                      style={{ color: accent }}
                    >
                      {value}
                    </p>
                    <p className="text-[10px] font-['Lora'] text-stone-500 uppercase tracking-wide mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl fade-in fade-in-2"
              style={{ background: hexToRgba(color, 0.06), border: `1px solid ${color}20` }}
            >
              {(["assignments", "readings", "notes"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-lg text-sm font-['Lora'] capitalize transition-all"
                  style={
                    activeTab === tab
                      ? {
                          background: color,
                          color: "#fff",
                          fontWeight: 600,
                          boxShadow: `0 2px 8px ${color}40`,
                        }
                      : { color: "var(--ink-light)" }
                  }
                >
                  {tab}
                  {tab === "assignments" && (
                    <span
                      className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                      style={
                        activeTab === tab
                          ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                          : { background: hexToRgba(color, 0.15), color }
                      }
                    >
                      {assignments.filter(
                        (a) => (a.status || "").toLowerCase() !== "no-class"
                      ).length}
                    </span>
                  )}
                  {tab === "readings" && readings.length > 0 && (
                    <span
                      className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                      style={
                        activeTab === tab
                          ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                          : { background: hexToRgba(color, 0.15), color }
                      }
                    >
                      {readings.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab Panels ── */}

            {/* Assignments */}
            {activeTab === "assignments" && (
              <div className="victorian-card p-5 fade-in fade-in-3">
                <h2 className="section-header mb-4">
                  <span style={{ color }}>◈</span> Assignments
                </h2>
                {assignments.length === 0 ? (
                  <p className="font-['Lora'] italic text-stone-400 text-sm py-4 text-center">
                    No assignments found for this course.
                  </p>
                ) : (
                  <AssignmentList
                    assignments={assignments}
                    onSelect={setSelected}
                  />
                )}
              </div>
            )}

            {/* Readings */}
            {activeTab === "readings" && (
              <div className="victorian-card p-5 fade-in fade-in-3">
                <h2 className="section-header mb-4">
                  <span style={{ color }}>◈</span> Readings
                </h2>

                {readings.length === 0 ? (
                  <p className="font-['Lora'] italic text-stone-400 text-sm py-4 text-center">
                    No readings found for this course.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(readingsByWeek).map(([week, items]) => (
                      <div key={week}>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="text-xs font-['Lora'] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                            style={{
                              color,
                              background: hexToRgba(color, 0.12),
                              border: `1px solid ${color}30`,
                            }}
                          >
                            {week}
                          </span>
                          <div className="flex-1 h-px" style={{ background: `${color}20` }} />
                        </div>

                        <div className="space-y-2 pl-1">
                          {items.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl px-4 py-3"
                              style={{
                                background: hexToRgba(color, 0.05),
                                border: `1px solid ${color}20`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {r.type && (
                                      <span
                                        className="text-[10px] font-['Lora'] uppercase tracking-wide px-1.5 py-0.5 rounded"
                                        style={{
                                          color,
                                          background: hexToRgba(color, 0.12),
                                        }}
                                      >
                                        {r.type}
                                      </span>
                                    )}
                                    <span
                                      className="text-sm font-['Source_Sans_3'] font-medium"
                                      style={{ color: "var(--ink)" }}
                                    >
                                      {r.title}
                                    </span>
                                  </div>
                                  {r.notes && (
                                    <p className="text-xs font-['Lora'] italic text-stone-400 mt-1 truncate">
                                      {r.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Status badge */}
                                  {r.status && (
                                    <span
                                      className="text-[10px] font-['Lora'] px-2 py-0.5 rounded-full"
                                      style={
                                        r.status === "done"
                                          ? {
                                              background: "rgba(61,107,88,0.12)",
                                              color: "#3d6b58",
                                            }
                                          : {
                                              background: hexToRgba(color, 0.1),
                                              color,
                                            }
                                      }
                                    >
                                      {r.status === "done" ? "✓ Done" : r.status}
                                    </span>
                                  )}

                                  {r.url && (
                                    <a
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-['Lora'] underline transition-colors"
                                      style={{ color }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Open →
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === "notes" && (
              <div className="victorian-card p-5 fade-in fade-in-3">
                <h2 className="section-header mb-4">
                  <span style={{ color }}>◈</span> Course Notes
                </h2>
                <NotesPanel type="course" referenceId={courseId} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Assignment modal */}
      {selected && (
        <AssignmentModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}

      <ChatWidget />
    </main>
  );
}
