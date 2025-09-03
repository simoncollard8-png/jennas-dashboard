// lib/types.ts
export type Status = "todo" | "in-progress" | "done";

export interface Course {
  id: string;                 // uuid (text in DB is ok; TS cares it's a string)
  title: string;
  professor: string | null;
  color: string | null;       // e.g. "text-rose-700"
}

export interface Assignment {
  id: string;                 // uuid
  course_id: string;
  title: string;
  due_date: string;           // ISO date or yyyy-mm-dd
  notes: string | null;
  status: Status;             // union type - not plain string
  course?: Course;            // populated when we join on courses
}

// Convenient alias so Modal uses the same thing
export type ModalAssignment = Assignment;

// Helper to coerce any DB value into the union type
export function toStatus(s: unknown): Status {
  return s === "in-progress" || s === "done" ? s : "todo";
}
