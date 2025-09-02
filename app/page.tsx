"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AssignmentForm from "../components/AssignmentForm";
import AssignmentList from "../components/AssignmentList";
import AssignmentModal from "../components/AssignmentModal";

// Shared interface
export interface Assignment {
  id: number;
  course: string;
  assignment: string;
  date?: string;
  due?: string;
  notes?: string;
  grade?: number | null;
  color: string;
}

const initialCourses = [
  { code: "HISP 485", title: "Preservation Studio", prof: "Dr. Whitaker", grade: "92%", nextDue: "Field Survey Report – Sep 12", color: "text-rose-700" },
  { code: "HISP 355", title: "Museum Design", prof: "Dr. Rivera", grade: "88%", nextDue: "Exhibit Proposal – Sep 18", color: "text-emerald-700" },
  { code: "ARTH 330", title: "19th Century Art", prof: "Dr. Hughes", grade: "95%", nextDue: "Essay – Sep 14", color: "text-indigo-700" },
  { code: "ARTH 420", title: "Women in Art History", prof: "Dr. Patel", grade: "90%", nextDue: "Research Paper – Sep 22", color: "text-purple-700" }
];

const initialDeadlines: Assignment[] = [
  { id: 1, date: "Sep 12", course: "HISP 485", assignment: "Field Survey Report", notes: "Submit field notes via Canvas.", grade: null, color: "text-rose-700" },
  { id: 2, date: "Sep 14", course: "ARTH 330", assignment: "Essay", notes: "5-page essay on Impressionism.", grade: null, color: "text-indigo-700" },
];

const thisWeekData: Assignment[] = [
  { id: 3, course: "HISP 355", assignment: "Exhibit Proposal", date: "Sep 18", notes: "Draft due to professor by email.", grade: null, color: "text-emerald-700" }
];

export default function Home() {
  const [deadlines, setDeadlines] = useState<Assignment[]>(initialDeadlines);
  const [weekTasks, setWeekTasks] = useState<Assignment[]>(thisWeekData);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const handleCheckOff = (id: number) => {
    setWeekTasks(weekTasks.filter((task) => task.id !== id));
  };

  return (
    <main className="min-h-screen p-6 font-sans">
      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold text-rose-700 underline">Dashboard</Link>
        <Link href="/calendar" className="font-bold hover:text-rose-600">Calendar</Link>
        <Link href="/grades" className="font-bold hover:text-rose-600">Grades</Link>
      </nav>

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-5xl font-serif font-bold drop-shadow-sm">Jenna’s Semester Dashboard</h1>
        <p className="italic text-lg text-gray-700">University of Mary Washington — Fall 2025</p>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Courses */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 lg:col-span-2">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">My Courses</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {initialCourses.map((c) => (
              <div 
                key={c.code} 
                className="cursor-pointer bg-white/95 shadow rounded-xl p-4 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition transform duration-200"
              >
                <h3 className={`font-bold text-lg ${c.color}`}>{c.code}: {c.title}</h3>
                <p className="text-sm text-gray-600">Prof. {c.prof}</p>
                <p className="text-sm italic text-gray-500">Next: {c.nextDue}</p>
                <p className="text-sm">Grade: {c.grade}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Deadlines */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 lg:col-span-1">
          <AssignmentForm 
            onAdd={(course, assignment, due) => {
              const courseObj = initialCourses.find(c => c.code === course);
              const color = courseObj ? courseObj.color : "text-gray-700";

              const newItem: Assignment = {
                id: Date.now(),
                date: due,
                course,
                assignment,
                notes: "",
                grade: null,
                color
              };

              setDeadlines([...deadlines, newItem]);
              setWeekTasks([...weekTasks, newItem]);
            }}
          />
          <AssignmentList assignments={deadlines} onClickAssignment={setSelectedAssignment} />
        </section>

        {/* This Week */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 lg:col-span-1 text-center">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">This Week</h2>
          <AssignmentList assignments={weekTasks} showCheckOff onCheckOff={handleCheckOff} onClickAssignment={setSelectedAssignment} />
        </section>

        {/* GPA */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 text-center lg:col-span-1">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">Current GPA</h2>
          <p className="text-5xl font-bold text-rose-700 drop-shadow">{3.72}</p>
          <p className="italic text-gray-600">On track for Magna Cum Laude</p>
        </section>

        {/* Frederick */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 text-center lg:col-span-1">
          <Image 
            src="/frederick.png" 
            alt="Frederick" 
            width={140} 
            height={140} 
            className="mx-auto rounded-full border-4 border-rose-500 shadow-md" 
          />
          <FrederickQuote />
        </section>
      </div>

      {/* Modal */}
      {selectedAssignment && (
        <AssignmentModal 
          assignment={selectedAssignment} 
          onClose={() => setSelectedAssignment(null)} 
        />
      )}
    </main>
  );
}

/* ---------------- Helper Component ---------------- */
function FrederickQuote() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const quotes = [
      "Even the smallest paw leaves an imprint on history.",
      "The cat who studies today naps in peace tomorrow.",
      "Paws and reflect before deadlines sneak up."
    ];
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(random);
  }, []);

  if (!quote) return null;
  return <p className="mt-2 italic text-rose-800">“{quote}”</p>;
}






