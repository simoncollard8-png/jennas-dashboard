// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Assignment, Course, ModalAssignment } from "@/lib/types";
import { toStatus } from "@/lib/types";
import AssignmentForm from "@/components/AssignmentForm";
import AssignmentList from "@/components/AssignmentList";
import AssignmentModal from "@/components/AssignmentModal";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<ModalAssignment | null>(null);

  async function load() {
    const { data: c } = await supabase.from("courses").select("*");
    setCourses((c ?? []) as Course[]);

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
                <h3 className={`font-bold text-lg ${c.color ?? ""}`}>{c.title}</h3>
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

          <h2 className="text-2xl font-serif mb-3 border-b pb-2">Upcoming Deadlines</h2>
          <AssignmentList
            assignments={assignments}
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



















