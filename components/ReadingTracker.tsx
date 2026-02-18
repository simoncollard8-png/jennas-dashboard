// components/ReadingTracker.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReadingTracker() {
  const [readings, setReadings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadCourses();
    loadReadings();
  }, []);

  async function loadCourses() {
    const { data } = await supabase.from("courses").select("*");
    setCourses(data || []);
  }

  async function loadReadings() {
    const { data } = await supabase
      .from("readings")
      .select("*, courses(title,color)")
      .order("session_date", { ascending: true });
    setReadings(data || []);
  }

  async function toggleComplete(id: string, currentStatus: boolean) {
    await supabase
      .from("readings")
      .update({ completed: !currentStatus })
      .eq("id", id);
    loadReadings();
  }

  const filtered = readings.filter(r => {
    if (selectedCourse !== "all" && r.course_id !== selectedCourse) return false;
    if (!showCompleted && r.completed) return false;
    return true;
  });

  const weeklyGroups = filtered.reduce((acc, r) => {
    const week = r.week || "Unassigned";
    if (!acc[week]) acc[week] = [];
    acc[week].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="victorian-card p-5">
      <h2 className="section-header mb-4">
        <span>📚</span> Reading Tracker
      </h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
          className="victorian-input text-sm flex-1"
        >
          <option value="all">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="btn-secondary px-3 py-1 text-xs"
        >
          {showCompleted ? "Hide" : "Show"} Completed
        </button>
      </div>

      {/* Readings by Week */}
      <div className="space-y-4">
        {Object.keys(weeklyGroups).sort().map(week => (
          <div key={week}>
            <h3 className="font-['Playfair_Display'] font-semibold text-sm mb-2 text-stone-700">
              Week {week}
            </h3>
            <div className="space-y-2">
              {weeklyGroups[week].map((r: any) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border transition-all ${
                    r.completed ? "opacity-50" : ""
                  }`}
                  style={{
                    borderColor: r.courses?.color || "var(--parchment-deep)",
                    background: r.completed
                      ? "rgba(61,107,88,0.06)"
                      : `${r.courses?.color || "#8b6914"}08`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={r.completed || false}
                      onChange={() => toggleComplete(r.id, r.completed)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-['Source_Sans_3'] text-sm font-medium ${
                          r.completed ? "line-through" : ""
                        }`}
                      >
                        {r.title}
                      </p>
                      {r.source && (
                        <p className="text-xs text-stone-500 font-['Lora'] italic mt-0.5">
                          {r.source} {r.pages && `(pp. ${r.pages})`}
                        </p>
                      )}
                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-700 hover:underline mt-1 inline-block"
                        >
                          View Link →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(weeklyGroups).length === 0 && (
          <p className="text-sm font-['Lora'] italic text-stone-400 text-center py-4">
            No readings found. Add readings via syllabus parser or manually in the database.
          </p>
        )}
      </div>
    </div>
  );
}
