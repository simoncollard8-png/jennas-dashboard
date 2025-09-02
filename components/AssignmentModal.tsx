"use client";

import React from "react";
import { Assignment } from "../app/page"; // ✅ import shared type

interface AssignmentModalProps {
  assignment: Assignment | null;
  onClose: () => void;
}

export default function AssignmentModal({ assignment, onClose }: AssignmentModalProps) {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h2 className={`text-2xl font-bold mb-2 ${assignment.color}`}>
          {assignment.course}
        </h2>

        <p className="text-lg font-semibold mb-1">{assignment.assignment}</p>
        <p className="text-sm text-gray-600 mb-2">
          Due: {assignment.date || "N/A"}
        </p>

        {assignment.notes && (
          <p className="text-sm mb-2">{assignment.notes}</p>
        )}

        {assignment.grade !== null && assignment.grade !== undefined && (
          <p className="text-sm">Grade: {assignment.grade}</p>
        )}
      </div>
    </div>
  );
}

