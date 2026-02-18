// components/AssignmentList.tsx
"use client";

import React from "react";
import type { Assignment } from "@/lib/types";

type Props = {
  assignments: Assignment[];
  showCourseName?: boolean;
  hideDone?: boolean;
  onSelect?: (a: any) => void;
};

const isDone    = (a: Assignment) => (a.status || "").toLowerCase() === "done";
const isNoClass = (a: Assignment) => (a.status || "").toLowerCase() === "no-class";

function hexToRgba(hex?: string, alpha = 0.12) {
  if (!hex || hex.length !== 7) return `rgba(139,105,20,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const formatDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

const isUrgent = (d: string) => {
  const due  = new Date(d + "T00:00:00").getTime();
  const now  = Date.now();
  const diff = due - now;
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
};

export default function AssignmentList({ assignments, showCourseName, hideDone, onSelect }: Props) {
  let list = assignments;
  if (hideDone) list = list.filter(a => !isDone(a));

  if (!list.length) {
    return (
      <p className="text-sm font-['Lora'] italic text-stone-400 py-2">
        Nothing to show.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {list.map(a => {
        const course       = (a as any).courses || {};
        const courseTitle  = course?.title || a.course_id;
        const courseColor  = course?.color || "#8b6914";
        const urgent       = isUrgent(a.due_date as string);
        const noclass      = isNoClass(a);

        return (
          <button
            key={a.id}
            onClick={() => onSelect?.(a)}
            className="w-full text-left rounded-xl px-3 py-2.5 transition-all hover:shadow-sm group"
            style={{
              background: noclass
                ? "rgba(61,107,88,0.06)"
                : urgent
                  ? "rgba(122,48,64,0.06)"
                  : hexToRgba(courseColor, 0.06),
              border: `1px solid ${noclass ? "rgba(61,107,88,0.2)" : urgent ? "rgba(122,48,64,0.25)" : `${courseColor}30`}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Course pill */}
                {showCourseName && !noclass && (
                  <span
                    className="inline-block px-2 py-0.5 rounded-md text-[10px] font-['Lora'] font-semibold border mb-1 truncate max-w-full"
                    style={{
                      backgroundColor: hexToRgba(courseColor, 0.15),
                      color: courseColor,
                      borderColor: `${courseColor}40`,
                    }}
                  >
                    {courseTitle}
                  </span>
                )}

                {/* Title */}
                <div className="flex items-center gap-1.5">
                  {urgent && !noclass && (
                    <span className="text-rose-600 text-xs flex-shrink-0" title="Due soon">⚠</span>
                  )}
                  <span
                    className="text-sm font-['Source_Sans_3'] font-medium truncate"
                    style={{ color: noclass ? "var(--green-mid)" : "var(--ink)" }}
                  >
                    {a.title}
                  </span>
                </div>

                {/* Notes */}
                {a.notes && (
                  <p className="text-xs font-['Lora'] italic text-stone-400 mt-0.5 truncate">
                    {a.notes}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="text-xs font-['Lora'] font-semibold"
                  style={{
                    color: urgent ? "var(--rose-deep)" : noclass ? "var(--green-mid)" : "var(--ink-light)",
                  }}
                >
                  {formatDate(a.due_date as string)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
