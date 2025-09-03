// components/AssignmentList.tsx
"use client";

import React from "react";
import type { Assignment } from "@/lib/types";

type Props = {
  assignments: Assignment[];
  showCourseName?: boolean;
  hideDone?: boolean;
  onSelect?: (a: any) => void; // ModalAssignment-compatible
};

const isDone = (a: Assignment) => (a.status || "").toLowerCase() === "done";
const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";

const formatDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

export default function AssignmentList({
  assignments,
  showCourseName,
  hideDone,
  onSelect,
}: Props) {
  let list = assignments;
  if (hideDone) list = list.filter(a => !isDone(a));

  if (!list.length) {
    return <p className="text-sm text-gray-500 italic">Nothing to show.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {list.map((a) => {
        const course = (a as any).courses || {}; // joined via supabase select
        const courseTitle: string = course?.title || a.course_id;
        const courseColor: string = course?.color || "#1F2937";

        return (
          <button
            key={a.id}
            onClick={() => onSelect?.(a)}
            className="w-full text-left py-2 hover:bg-rose-50 rounded-lg px-2 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {showCourseName && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-semibold border"
                      style={{
                        backgroundColor: `${courseColor}20`,
                        color: courseColor,
                        borderColor: courseColor,
                      }}
                    >
                      {courseTitle}
                    </span>
                  )}
                  <span
                    className={`font-medium truncate ${
                      isNoClass(a) ? "text-emerald-700" : "text-gray-900"
                    }`}
                  >
                    {a.title}
                  </span>
                </div>
                {a.notes && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{a.notes}</div>
                )}
              </div>
              <div className="shrink-0 text-sm font-semibold text-gray-700">
                {formatDate(a.due_date as any)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}









