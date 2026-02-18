// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, Course, ModalAssignment } from "@/lib/types";
import { toStatus } from "@/lib/types";
import AssignmentForm from "@/components/AssignmentForm";
import AssignmentList from "@/components/AssignmentList";
import AssignmentModal from "@/components/AssignmentModal";
import ChatWidget from "@/components/ChatWidget";

// ─── EST helpers ───────────────────────────────────────────────
const TZ = "America/New_York";
const toESTDate = (val: string | Date): Date => {
  const d = typeof val === "string" ? new Date(val) : val;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const g = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return new Date(`${g("year")}-${g("month")}-${g("day")}T00:00:00`);
};
const todayEST = () => toESTDate(new Date());
const startOfWeekEST = (ref: Date): Date => {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(ref);
  const map: Record<string, number> = { Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6 };
  const idx = map[wd] ?? 0;
  const delta = idx === 0 ? 6 : idx - 1;
  const s = new Date(ref); s.setDate(s.getDate() - delta);
  return toESTDate(s);
};
const endOfWeekEST = (start: Date): Date => {
  const e = new Date(start); e.setDate(e.getDate() + 6); return e;
};

// ─── Frederick quotes ───────────────────────────────────────────
const QUOTES = [
  "Even the smallest paw leaves an imprint on history.",
  "Paws and reflect before deadlines sneak up.",
  "The paw that studies today catches the grade tomorrow.",
  "A well-rested cat knows when to chase and when to rest.",
  "Every archive holds a story waiting to be discovered.",
  "Curl up with your notes. Knowledge is warmth.",
  "Procrastination is a mouse that never stops running.",
];

// ─── Floral ornament ────────────────────────────────────────────
const FloralDivider = () => (
  <div className="flex items-center gap-2 my-1 opacity-40">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-700" />
    <span className="text-amber-700 text-xs">✦</span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-700" />
  </div>
);

// ─── Semester progress ──────────────────────────────────────────
const SEMESTER_START = new Date("2025-08-25");
const SEMESTER_END   = new Date("2025-12-12");
const getSemesterProgress = () => {
  const now = Date.now();
  const total = SEMESTER_END.getTime() - SEMESTER_START.getTime();
  const elapsed = now - SEMESTER_START.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const week = Math.ceil(elapsed / (7 * 24 * 60 * 60 * 1000));
  const totalWeeks = Math.ceil(total / (7 * 24 * 60 * 60 * 1000));
  return { pct, week: Math.min(week, totalWeeks), totalWeeks };
};

export default function DashboardPage() {
  const [courses, setCourses]       = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected]     = useState<ModalAssignment | null>(null);
  const [quote, setQuote]           = useState(QUOTES[0]);
  const [addOpen, setAddOpen]       = useState(false);

  const { pct, week, totalWeeks } = getSemesterProgress();

  async function load() {
    const { data: c } = await supabase.from("courses").select("*");
    setCourses((c ?? []) as Course[]);
    const { data: a } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");
    setAssignments(
      (a ?? []).map((x: any) => ({ ...x, status: toStatus(x.status) })) as Assignment[]
    );
  }

  useEffect(() => {
    load();
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // ─── Filters ───────────────────────────────────────────────────
  const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";
  const nd = (a: Assignment) => toESTDate(a.due_date);
  const today     = todayEST();
  const weekStart = startOfWeekEST(today);
  const weekEnd   = endOfWeekEST(weekStart);

  const thisWeek = useMemo(() =>
    assignments
      .filter(a => !isNoClass(a))
      .filter(a => { const d = nd(a); return d >= weekStart && d <= weekEnd; })
      .sort((a,b) => +nd(a) - +nd(b) || a.title.localeCompare(b.title)),
    [assignments, weekStart, weekEnd]
  );

  const upcoming = useMemo(() =>
    assignments
      .filter(a => !isNoClass(a) && nd(a) >= weekStart)
      .sort((a,b) => +nd(a) - +nd(b) || a.title.localeCompare(b.title))
      .slice(0, 8),
    [assignments, weekStart]
  );

  return (
    <main className="min-h-screen pb-16">
      {/* ── NAV ── */}
      <nav className="victorian-nav">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">✦</span>
            <span className="font-['Playfair_Display'] italic text-amber-200 text-sm tracking-wide">
              Jenna's Dashboard
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" className="nav-link active">Dashboard</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/calendar" className="nav-link">Calendar</Link>
            <span className="text-green-700 text-xs">·</span>
            <Link href="/grades" className="nav-link">Grades</Link>
          </div>
          <div className="text-xs text-green-300 opacity-60 font-['Lora'] italic">
            {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── HEADER ── */}
        <div className="text-center mb-8 fade-in fade-in-1">
          <p className="font-['Lora'] text-xs tracking-[3px] uppercase text-amber-700 opacity-70 mb-2">
            University of Mary Washington
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl font-bold italic text-stone-800 leading-tight">
            Jenna's Semester
          </h1>
          <p className="font-['Lora'] text-sm text-stone-500 mt-1 italic">Spring 2026</p>

          {/* Semester progress */}
          <div className="max-w-lg mx-auto mt-5">
            <div className="flex justify-between text-xs font-['Lora'] text-stone-500 mb-2">
              <span>Week {week} of {totalWeeks}</span>
              <span>{Math.round(pct)}% complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── COURSES (left col) ── */}
          <section className="lg:col-span-4 fade-in fade-in-2">
            <div className="victorian-card p-5 h-full">
              <h2 className="section-header">
                <span>✦</span> My Courses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {courses.length === 0 && (
                  <p className="text-sm text-stone-400 italic col-span-2">No courses loaded yet.</p>
                )}
                {courses.map((c, i) => (
                  <div
                    key={c.id}
                    className="group relative rounded-xl p-3.5 border transition-all duration-200 hover:shadow-md cursor-default"
                    style={{
                      borderColor: `${c.color || "#8b6914"}40`,
                      background: `${c.color || "#8b6914"}08`,
                    }}
                  >
                    <div
                      className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                      style={{ backgroundColor: c.color || "#8b6914" }}
                    />
                    <div className="pl-3">
                      <p
                        className="font-['Playfair_Display'] font-semibold text-sm leading-tight"
                        style={{ color: c.color || "#3d2e1a" }}
                      >
                        {c.title}
                      </p>
                      {c.professor && (
                        <p className="text-xs text-stone-500 mt-0.5 font-['Lora'] italic">
                          {c.professor}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CENTER col: deadlines ── */}
          <section className="lg:col-span-5 flex flex-col gap-5 fade-in fade-in-3">

            {/* This week */}
            <div className="victorian-card p-5">
              <h2 className="section-header">
                <span className="text-amber-600">◈</span> This Week
              </h2>
              {thisWeek.length === 0 ? (
                <p className="text-sm text-stone-400 italic">Nothing due this week 🎉</p>
              ) : (
                <AssignmentList
                  assignments={thisWeek}
                  showCourseName
                  hideDone
                  onSelect={setSelected}
                />
              )}
            </div>

            {/* Upcoming */}
            <div className="victorian-card p-5">
              <h2 className="section-header">
                <span className="text-rose-600">◈</span> Upcoming Deadlines
              </h2>
              <AssignmentList
                assignments={upcoming}
                showCourseName
                hideDone
                onSelect={setSelected}
              />
            </div>

            {/* Add assignment */}
            <div className="victorian-card p-5">
              <button
                onClick={() => setAddOpen(v => !v)}
                className="btn-primary w-full text-center"
              >
                {addOpen ? "✕ Cancel" : "+ Add Assignment"}
              </button>
              {addOpen && (
                <div className="mt-4">
                  <AssignmentForm
                    courses={courses}
                    onCreated={() => { load(); setAddOpen(false); }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT col ── */}
          <section className="lg:col-span-3 flex flex-col gap-5 fade-in fade-in-4">

            {/* Frederick */}
            <div className="victorian-card p-5 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238b6914' fill-opacity='1'%3E%3Cpath d='M30 5 C20 5 12 13 12 23 C12 33 20 38 30 38 C40 38 48 33 48 23 C48 13 40 5 30 5Z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="relative">
                <div className="inline-block rounded-full p-1 mb-3" style={{ background: "linear-gradient(135deg, #c4961f, #e8c96a, #c4961f)" }}>
                  <div className="rounded-full overflow-hidden w-24 h-24 mx-auto border-2 border-amber-100">
                    <Image
                      src="/frederick.png"
                      alt="Frederick"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <p className="font-['Playfair_Display'] font-bold text-stone-700 text-sm">Frederick</p>
                <p className="text-xs text-stone-400 font-['Lora'] italic mb-3">Chief Morale Officer</p>
                <FloralDivider />
                <p className="font-['Lora'] italic text-stone-600 text-xs mt-3 leading-relaxed px-2">
                  "{quote}"
                </p>
              </div>
            </div>

            {/* GPA card */}
            <div className="victorian-card p-5 text-center">
              <h2 className="section-header justify-center">
                <span>★</span> Current GPA
              </h2>
              <p
                className="font-['Playfair_Display'] text-5xl font-bold mt-2"
                style={{ color: "var(--green-mid)" }}
              >
                3.72
              </p>
              <p className="font-['Lora'] italic text-stone-500 text-xs mt-2">
                On track for Magna Cum Laude
              </p>
              <FloralDivider />
              <Link
                href="/grades"
                className="text-xs font-['Lora'] text-amber-700 hover:text-amber-900 mt-1 inline-block transition-colors"
              >
                View full grade tracker →
              </Link>
            </div>

            {/* Quick stats */}
            <div className="victorian-card p-5">
              <h2 className="section-header">
                <span className="text-green-700">◈</span> Semester Pulse
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-['Lora'] text-stone-500">Total Courses</span>
                  <span className="font-['Playfair_Display'] font-bold text-stone-700">{courses.length}</span>
                </div>
                <FloralDivider />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-['Lora'] text-stone-500">Due This Week</span>
                  <span className="font-['Playfair_Display'] font-bold text-rose-700">{thisWeek.length}</span>
                </div>
                <FloralDivider />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-['Lora'] text-stone-500">Upcoming</span>
                  <span className="font-['Playfair_Display'] font-bold text-amber-700">{upcoming.length}</span>
                </div>
                <FloralDivider />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-['Lora'] text-stone-500">Completed</span>
                  <span className="font-['Playfair_Display'] font-bold text-green-700">
                    {assignments.filter(a => a.status === "done").length}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

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
