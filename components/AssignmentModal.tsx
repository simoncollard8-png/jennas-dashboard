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

export default function AssignmentModal({ assignment, onClose, onUpdated }: Props) {
  const [local, setLocal] = useState<ModalAssignment>({
    ...assignment,
    status: toStatus(assignment.status),
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("assignments")
      .update({
        title: local.title,
        notes: local.notes,
        due_date: local.due_date,
        status: local.status,
      })
      .eq("id", local.id);

    setSaving(false);
    if (!error) {
      onUpdated?.();
      onClose();
    } else {
      console.error(error);
      alert("Save failed.");
    }
  }

  function setStatus(s: Status) {
    setLocal((p) => ({ ...p, status: s }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">{local.title}</h2>
        <p className="text-sm text-gray-600 mb-4">
          Due: {local.due_date} {local.course?.title ? `— ${local.course.title}` : ""}
        </p>

        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={local.notes ?? ""}
          onChange={(e) => setLocal({ ...local, notes: e.target.value })}
          className="w-full border rounded-lg p-2 text-sm mb-4"
          rows={5}
          placeholder="Add notes…"
        />

        <label className="block text-sm font-medium mb-1">Status</label>
        <div className="flex gap-2 mb-6">
          {(["todo", "in-progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-full border text-sm ${
                local.status === s ? "bg-rose-600 text-white border-rose-600" : "border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}








