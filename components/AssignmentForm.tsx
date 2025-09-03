// components/AssignmentForm.tsx
"use client";

import { useState } from "react";
import type { Course, Assignment, Status } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  courses: Course[];
  onCreated?: (a: Assignment) => void;
}

export default function AssignmentForm({ courses, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [course_id, setCourse] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [due_date, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!course_id || !title || !due_date) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("assignments")
      .insert([{ course_id, title, due_date, notes: notes || null, status }])
      .select("*, courses(id,title,professor,color)")
      .single();

    setSaving(false);
    if (error) {
      console.error(error);
      alert("Failed to add");
      return;
    }
    onCreated?.(data as any);
    setOpen(false);
    setTitle("");
    setDueDate("");
    setNotes("");
    setStatus("todo");
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm px-3 py-1 rounded bg-rose-600 text-white"
      >
        {open ? "Cancel" : "Add Assignment"}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 border rounded-xl p-4 bg-white/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 font-medium">Course</span>
              <select
                value={course_id}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full border rounded-lg p-2"
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="block mb-1 font-medium">Due date</span>
              <input
                type="date"
                value={due_date}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg p-2"
                required
              />
            </label>
          </div>

          <label className="text-sm block">
            <span className="block mb-1 font-medium">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Essay Draft"
              required
            />
          </label>

          <label className="text-sm block">
            <span className="block mb-1 font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={3}
              placeholder="Optional"
            />
          </label>

          <div className="text-sm">
            <span className="block mb-1 font-medium">Status</span>
            <div className="flex gap-2">
              {(["todo", "in-progress", "done"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded-full border ${
                    status === s ? "bg-rose-600 text-white border-rose-600" : "border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}







