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

// ---------- EST helpers ----------
const TZ = "America/New_York";

const toESTDate = (isoOrDate: string | Date): Date => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || "";
  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
};

const todayEST = (): Date => toESTDate(new Date());
const startOfWeekEST = (ref: Date): Date => {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(ref);
  const idxMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const idx = idxMap[weekday as keyof typeof idxMap] ?? 0;
  const deltaToMonday = idx === 0 ? 6 : idx - 1;
  const start = new Date(ref);
  start.setDate(start.getDate() - deltaToMonday);
  return toESTDate(start);
};
const endOfWeekEST = (start: Date): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
};

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<ModalAssignment | null>(null);

  async function load() {
    const { data: c } = await supabase.from("courses").select("*");
    setCourses((c ?? []) as Course[]);

    // join to get course color/title for pills
    const { data: a } = await supabase
      .from("assignments")
      .select("*, courses(id,title,professor,color)");

    const normalized = (a ?? []).map((x: any) => ({
      ...x,
      status: toStatus(x.status),
    })) as Assignment[];

    setAssignments(normalized);
  }

  useEffect(() => {
    load();
  }, []);

  // ---------- Filters for Upcoming & This Week (EST-aware) ----------
  const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";
  const normalizeDate = (a: Assignment) => toESTDate(a.due_date);

  const today = todayEST();
  const weekStart = startOfWeekEST(today);
  const weekEnd = endOfWeekEST(weekStart);

  // Coming This Week: Mon–Sun, exclude no-class
  const comingThisWeek = useMemo(
    () =>
      assignments
        .filter(a => !isNoClass(a))
        .filter(a => {
          const d = normalizeDate(a);
          return d >= weekStart && d <= weekEnd;
        })
        .sort((a, b) => +normalizeDate(a) - +normalizeDate(b) || a.title.localeCompare(b.title)),
    [assignments, weekStart, weekEnd]
  );

  // Upcoming Deadlines: from start of this week forward, exclude no-class, cap to 6
  const upcoming = useMemo(
    () =>
      assignments
        .filter(a => !isNoClass(a) && normalizeDate(a) >= weekStart)
        .sort((a, b) => +normalizeDate(a) - +normalizeDate(b) || a.title.localeCompare(b.title))
        .slice(0, 6),
    [assignments, weekStart]
  );

  return (
    <main className="min-h-screen p-6">
      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold text-rose-700 underline">Dashboard</Link>
        <Link href="/calendar" className="font-bold hover:text-rose-600">Calendar</Link>
        <Link href="/grades" className="font-bold hover:text-rose-600">Grades</Link>
      </nav>

      <header className="text-center mb-8">
        <h1 className="text-5xl font-serif font-bold drop-shadow-sm">Jenna’s Semester Dashboard</h1>
        <p className="italic text-lg text-gray-700">University of Mary Washington — Fall 2025</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Courses */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 lg:col-span-2">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">My Courses</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="bg-white/95 shadow rounded-xl p-4 border hover:shadow-2xl">
                <h3
                  className="font-bold text-lg"
                  style={{ color: c.color || "#1F2937" }}
                >
                  {c.title}
                </h3>
                <p className="text-sm text-gray-600">Prof. {c.professor ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Deadlines (includes Add form) */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200">
          <AssignmentForm
            courses={courses}
            onCreated={() => load()}
          />

          {/* Coming This Week */}
          <h2 className="text-2xl font-serif mt-6 mb-3 border-b pb-2">Coming This Week</h2>
          {comingThisWeek.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No deadlines this week 🎉</p>
          ) : (
            <AssignmentList
              assignments={comingThisWeek}
              showCourseName
              hideDone
              onSelect={(a) => setSelected(a)}
            />
          )}

          {/* Upcoming Deadlines */}
          <h2 className="text-2xl font-serif mt-6 mb-3 border-b pb-2">Upcoming Deadlines</h2>
          <AssignmentList
            assignments={upcoming}
            showCourseName
            hideDone
            onSelect={(a) => setSelected(a)}
          />
        </section>

        {/* GPA */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 text-center">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">Current GPA</h2>
          <p className="text-5xl font-bold text-rose-700 drop-shadow">3.72</p>
          <p className="italic text-gray-600">On track for Magna Cum Laude</p>
        </section>

        {/* Frederick */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 text-center">
          <Image
            src="/frederick.png"
            alt="Frederick"
            width={140}
            height={140}
            className="mx-auto rounded-full border-4 border-rose-500 shadow-md"
          />
          <p className="mt-2 italic text-rose-800">“Paws and reflect before deadlines sneak up.”</p>
        </section>
      </div>

      {selected && (
        <AssignmentModal assignment={selected} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </main>
  );
}





















