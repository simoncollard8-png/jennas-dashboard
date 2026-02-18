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
  const [course_id, setCourse]  = useState(courses[0]?.id ?? "");
  const [title, setTitle]       = useState("");
  const [due_date, setDueDate]  = useState("");
  const [notes, setNotes]       = useState("");
  const [status, setStatus]     = useState<Status>("todo");
  const [saving, setSaving]     = useState(false);

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
    if (error) { console.error(error); alert("Failed to add"); return; }
    onCreated?.(data as any);
    setTitle(""); setDueDate(""); setNotes(""); setStatus("todo");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Course select */}
        <label className="block">
          <span className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
            Course
          </span>
          <select
            value={course_id}
            onChange={e => setCourse(e.target.value)}
            className="victorian-input"
            required
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>

        {/* Due date */}
        <label className="block">
          <span className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
            Due Date
          </span>
          <input
            type="date"
            value={due_date}
            onChange={e => setDueDate(e.target.value)}
            className="victorian-input"
            required
          />
        </label>
      </div>

      {/* Title */}
      <label className="block">
        <span className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
          Assignment Title
        </span>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="victorian-input"
          placeholder="e.g., Research Paper Draft"
          required
        />
      </label>

      {/* Notes */}
      <label className="block">
        <span className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="victorian-input resize-none"
          rows={2}
          placeholder="Optional notes…"
        />
      </label>

      {/* Status */}
      <div>
        <span className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
          Status
        </span>
        <div className="flex gap-2">
          {(["todo","in-progress","done"] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-['Lora'] capitalize transition-all"
              style={status === s ? {
                background: "var(--green-deep)",
                color: "var(--gold-light)",
                border: "1px solid var(--gold-mid)",
              } : {
                background: "transparent",
                color: "var(--ink-light)",
                border: "1px solid var(--parchment-deep)",
              }}
            >
              {s === "in-progress" ? "In Progress" : s === "todo" ? "To Do" : "Done"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add Assignment"}
        </button>
      </div>
    </form>
  );
}
