"use client";

import React, { useState } from "react";

interface AssignmentFormProps {
  onAdd: (assignment: {
    course: string;
    assignment: string;
    due: string;
    notes: string;
    grade: number | null;
    color: string;
  }) => void;
}

export default function AssignmentForm({ onAdd }: AssignmentFormProps) {
  const [course, setCourse] = useState("");
  const [assignment, setAssignment] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [grade, setGrade] = useState<string>("");

  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !assignment || !due) return;

    onAdd({
      course,
      assignment,
      due,
      notes,
      grade: grade ? Number(grade) : null,
      color: "text-rose-700",
    });

    setCourse("");
    setAssignment("");
    setDue("");
    setNotes("");
    setGrade("");
    setOpen(false); // collapse after submit
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700"
      >
        {open ? "Close Form" : "➕ Add Assignment"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 mt-2 border rounded-lg p-4 bg-white/80"
        >
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="Course"
            className="w-full border rounded p-2"
          />
          <input
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
            placeholder="Assignment"
            className="w-full border rounded p-2"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full border rounded p-2"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full border rounded p-2"
            rows={3}
          />
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (optional)"
            className="w-full border rounded p-2"
          />
          <button
            type="submit"
            className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700"
          >
            Save Assignment
          </button>
        </form>
      )}
    </div>
  );
}


