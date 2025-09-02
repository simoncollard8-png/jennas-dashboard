"use client";

import React, { useState } from "react";

interface AssignmentFormProps {
  onAdd: (
    course: string,
    assignment: string,
    due: string,
    notes: string,
    grade: number | null
  ) => void;
}

const courses = [
  "HISP 485",
  "HISP 355",
  "ARTH 330",
  "ARTH 420",
  "HISP 404",
  "ARTH 350",
  "IDLS 499"
];

export default function AssignmentForm({ onAdd }: AssignmentFormProps) {
  const [course, setCourse] = useState("");
  const [assignment, setAssignment] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [grade, setGrade] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !assignment || !due) return;
    onAdd(course, assignment, due, notes, grade);
    setCourse("");
    setAssignment("");
    setDue("");
    setNotes("");
    setGrade(null);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3">
      {/* Course Dropdown */}
      <select
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">Select Course</option>
        {courses.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Assignment */}
      <input
        type="text"
        placeholder="Assignment"
        value={assignment}
        onChange={(e) => setAssignment(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />

      {/* Due Date */}
      <input
        type="text"
        placeholder="Due Date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />

      {/* Notes */}
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />

      {/* Grade */}
      <input
        type="number"
        placeholder="Grade (optional)"
        value={grade ?? ""}
        onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-rose-500 text-white px-3 py-2 rounded hover:bg-rose-600 transition"
      >
        Add Assignment
      </button>
    </form>
  );
}



