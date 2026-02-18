// components/NotesPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type NoteType = "assignment" | "course" | "general";

export default function NotesPanel({ 
  type, 
  referenceId 
}: { 
  type: NoteType; 
  referenceId?: string;
}) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    loadNotes();
  }, [type, referenceId]);

  async function loadNotes() {
    let query = supabase
      .from("notes")
      .select("*")
      .eq("note_type", type)
      .order("created_at", { ascending: false });

    if (referenceId) {
      query = query.eq("reference_id", referenceId);
    }

    const { data } = await query;
    setNotes(data || []);
  }

  async function addNote() {
    if (!newNote.trim()) return;

    await supabase.from("notes").insert({
      note_type: type,
      reference_id: referenceId || null,
      content: newNote,
      created_at: new Date().toISOString(),
    });

    setNewNote("");
    loadNotes();
  }

  async function updateNote(id: string) {
    await supabase
      .from("notes")
      .update({ content: editText, updated_at: new Date().toISOString() })
      .eq("id", id);

    setEditing(null);
    setEditText("");
    loadNotes();
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    await supabase.from("notes").delete().eq("id", id);
    loadNotes();
  }

  return (
    <div className="space-y-3">
      {/* Add Note */}
      <div className="flex gap-2">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="victorian-input text-sm flex-1 resize-none"
          rows={2}
          onKeyDown={e => {
            if (e.key === "Enter" && e.ctrlKey) {
              addNote();
            }
          }}
        />
        <button
          onClick={addNote}
          className="btn-primary px-4 self-start"
          disabled={!newNote.trim()}
        >
          Add
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.map(note => (
          <div
            key={note.id}
            className="p-3 rounded-xl"
            style={{ background: "rgba(196,150,31,0.06)", border: "1px solid rgba(196,150,31,0.2)" }}
          >
            {editing === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="victorian-input text-sm w-full resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={() => updateNote(note.id)} className="btn-primary px-3 py-1 text-xs">
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setEditText("");
                    }}
                    className="btn-secondary px-3 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-['Source_Sans_3'] whitespace-pre-wrap mb-2">
                  {note.content}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-['Lora'] text-stone-400">
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(note.id);
                        setEditText(note.content);
                      }}
                      className="text-xs text-amber-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-xs text-rose-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-sm font-['Lora'] italic text-stone-400 text-center py-4">
            No notes yet. Add one above!
          </p>
        )}
      </div>

      <p className="text-[10px] font-['Lora'] text-stone-400 italic mt-2">
        Tip: Press Ctrl+Enter to quickly add a note
      </p>
    </div>
  );
}
