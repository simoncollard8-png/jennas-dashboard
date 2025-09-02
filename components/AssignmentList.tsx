"use client";

import React from "react";
import { Assignment } from "../app/page"; // ✅ import the shared type

interface AssignmentListProps {
  assignments: Assignment[];
  showCheckOff?: boolean;
  onCheckOff?: (id: number) => void;
  onClickAssignment?: (assignment: Assignment) => void;
}

export default function AssignmentList({
  assignments,
  showCheckOff,
  onCheckOff,
  onClickAssignment,
}: AssignmentListProps) {
  return (
    <ul className="space-y-2">
      {assignments.map((d) => (
        <li
          key={d.id}
          onClick={() => onClickAssignment && onClickAssignment(d)}
          className="cursor-pointer flex flex-col gap-1 px-2 py-2 rounded border hover:bg-rose-50 transition-all duration-300"
        >
          <span className={`font-bold ${d.color}`}>{d.assignment}</span>
          <span className="text-sm text-gray-600">{d.course} — {d.date}</span>

          {showCheckOff && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCheckOff && onCheckOff(d.id);
              }}
              className="mt-1 text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700"
            >
              Mark Done
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}




