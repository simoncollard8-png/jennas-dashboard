// components/AssignmentList.tsx
"use client";

import { useMemo } from "react";
import type { Assignment } from "@/lib/types";
import { toStatus } from "@/lib/types";

interface Props {
  assignments: Assignment[];
  showCourseName?: boolean;
  hideDone?: boolean;
  onSelect?: (a: Assignment) => void;  // click to open modal (or anything)
}

export default function AssignmentList({ assignments, showCourseName, hideDone, onSelect }: Props) {
  const rows = useMemo(() => {
    return assignments
      .map((a) => ({ ...a, status: toStatus(a.status) }))
      .filter((a) => (hideDone ? a.status !== "done" : true))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [assignments, hideDone]);

  if (!rows.length) {
    return <p className="text-sm text-gray-500">Nothing yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((a) => (
        <li
          key={a.id}
          className="flex items-center justify-between gap-3 px-3 py-2 border rounded-lg bg-white/70 hover:bg-white transition cursor-pointer"
          onClick={() => onSelect?.(a)}
        >
          <div>
            <div className="font-semibold">
              {a.title}
              {showCourseName && a.course?.title ? (
                <span className="ml-2 text-sm text-gray-500">({a.course.title})</span>
              ) : null}
            </div>
            <div className="text-xs text-gray-600">Due {a.due_date}</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              a.status === "done"
                ? "bg-emerald-600 text-white border-emerald-600"
                : a.status === "in-progress"
                ? "bg-amber-500/20 border-amber-500 text-amber-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {a.status}
          </span>
        </li>
      ))}
    </ul>
  );
}








