// components/AssignmentModal.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ModalAssignment, Status } from "@/lib/types";
import { toStatus } from "@/lib/types";

interface Props {
  assignment: ModalAssignment;
  onClose: () => void;
  onUpdated?: () => void;
}

function hexToRgba(hex?: string, alpha = 0.12) {
  if (!hex || hex.length !== 7) return `rgba(139,105,20,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AssignmentModal({ assignment, onClose, onUpdated }: Props) {
  const [local, setLocal] = useState<ModalAssignment>({
    ...assignment,
    status: toStatus(assignment.status),
  });
  const [saving, setSaving] = useState(false);

  const course = (assignment as any).courses || {};
  const color  = course?.color || "#8b6914";

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("assignments")
      .update({
        title:    local.title,
        notes:    local.notes,
        due_date: local.due_date,
        status:   local.status,
      })
      .eq("id", local.id);
    setSaving(false);
    if (!error) { onUpdated?.(); onClose(); }
    else { console.error(error); alert("Save failed."); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,18,9,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--parchment)",
          border: `1px solid ${color}40`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b relative"
          style={{
            background: hexToRgba(color, 0.1),
            borderColor: `${color}30`,
          }}
        >
          {/* Course pill */}
          {course?.title && (
            <span
              className="inline-block px-2 py-0.5 rounded-md text-xs font-['Lora'] font-semibold border mb-2"
              style={{
                color,
                borderColor: `${color}50`,
                background: hexToRgba(color, 0.15),
              }}
            >
              {course.title}
            </span>
          )}
          <h2 className="font-['Playfair_Display'] text-xl font-bold text-stone-800 pr-8">
            {local.title}
          </h2>
          <p className="text-xs font-['Lora'] italic text-stone-500 mt-0.5">
            Due: {new Date(local.due_date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric"
            })}
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Notes */}
          <div>
            <label className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Notes
            </label>
            <textarea
              value={local.notes ?? ""}
              onChange={e => setLocal({ ...local, notes: e.target.value })}
              className="victorian-input resize-none"
              rows={4}
              placeholder="Add notes, reminders, or thoughts…"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-2 uppercase tracking-wide">
              Status
            </label>
            <div className="flex gap-2">
              {(["todo","in-progress","done"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setLocal(p => ({ ...p, status: s }))}
                  className="flex-1 py-2 rounded-xl text-xs font-['Lora'] capitalize transition-all border"
                  style={local.status === s ? {
                    background: s === "done"
                      ? "rgba(61,107,88,0.15)"
                      : s === "in-progress"
                        ? "rgba(139,105,20,0.15)"
                        : "rgba(26,18,9,0.08)",
                    color: s === "done"
                      ? "var(--green-mid)"
                      : s === "in-progress"
                        ? "var(--gold-deep)"
                        : "var(--ink)",
                    borderColor: s === "done"
                      ? "rgba(61,107,88,0.4)"
                      : s === "in-progress"
                        ? "rgba(139,105,20,0.4)"
                        : "rgba(26,18,9,0.2)",
                    fontWeight: 600,
                  } : {
                    color: "var(--ink-light)",
                    borderColor: "var(--parchment-deep)",
                    background: "transparent",
                  }}
                >
                  {s === "in-progress" ? "In Progress" : s === "todo" ? "To Do" : "✓ Done"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-3 border-t"
          style={{ borderColor: "var(--parchment-deep)" }}
        >
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
