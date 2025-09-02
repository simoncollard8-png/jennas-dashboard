"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Assignment } from "../page"; // ✅ shared type
import AssignmentModal from "../../components/AssignmentModal";

// Sample calendar data
const septemberAssignments: Assignment[] = [
  { id: 1, course: "HISP 485", assignment: "Field Survey Report", date: "Sep 12", notes: "Submit via Canvas", grade: null, color: "text-rose-700" },
  { id: 2, course: "ARTH 330", assignment: "Essay", date: "Sep 14", notes: "5-page essay", grade: null, color: "text-indigo-700" },
  { id: 3, course: "HISP 355", assignment: "Exhibit Proposal", date: "Sep 18", notes: "Draft proposal due", grade: null, color: "text-emerald-700" },
  { id: 4, course: "ARTH 420", assignment: "Research Paper", date: "Sep 22", notes: "First draft", grade: null, color: "text-purple-700" },
];

export default function CalendarPage() {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  return (
    <main className="min-h-screen p-6 font-sans">
      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold hover:text-rose-600">Dashboard</Link>
        <Link href="/calendar" className="font-bold text-rose-700 underline">Calendar</Link>
        <Link href="/grades" className="font-bold hover:text-rose-600">Grades</Link>
      </nav>

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-5xl font-serif font-bold drop-shadow-sm">Semester Calendar</h1>
        <p className="italic text-lg text-gray-700">September – December 2025</p>
      </header>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-200 col-span-4">
          <h2 className="text-2xl font-serif mb-4 border-b pb-2">September 2025</h2>

          <div className="grid grid-cols-7 gap-4 text-center">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const dayAssignments = septemberAssignments.filter(a => a.date?.includes(`Sep ${day}`));

              return (
                <div key={day} className="border rounded-lg p-2 bg-white/70 shadow-sm hover:shadow-md transition">
                  <p className="font-bold mb-1">{day}</p>
                  {dayAssignments.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAssignment(a)}
                      className={`text-xs cursor-pointer ${a.color} hover:underline`}
                    >
                      {a.assignment}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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






