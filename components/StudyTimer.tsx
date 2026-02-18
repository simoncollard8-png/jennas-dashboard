// components/StudyTimer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type TimerMode = "work" | "break";
type TimerStatus = "idle" | "running" | "paused";

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [task, setTask] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    loadCourses();
    loadSessions();
  }, []);

  useEffect(() => {
    if (status === "running" && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && status === "running") {
      handleTimerComplete();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, timeLeft]);

  async function loadCourses() {
    const { data } = await supabase.from("courses").select("*");
    setCourses(data || []);
  }

  async function loadSessions() {
    const { data } = await supabase
      .from("study_sessions")
      .select("*, courses(title,color)")
      .order("started_at", { ascending: false })
      .limit(10);
    setSessions(data || []);
  }

  async function handleTimerComplete() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Play notification sound
    if (typeof Audio !== "undefined") {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfzznksBSN2x+/ekkAKFF+z6eysWRQLRp/g8r5sIQYpfsTu25JRFBU="); 
      audio.play().catch(() => {});
    }
    
    if (mode === "work") {
      // Log work session
      if (startTimeRef.current) {
        await supabase.from("study_sessions").insert({
          course_id: selectedCourse || null,
          task_description: task || "Focus session",
          duration_minutes: 25,
          started_at: startTimeRef.current.toISOString(),
          ended_at: new Date().toISOString(),
        });
        loadSessions();
      }
      
      setMode("break");
      setTimeLeft(BREAK_DURATION);
      setStatus("idle");
      alert("🎉 Work session complete! Time for a break.");
    } else {
      setMode("work");
      setTimeLeft(WORK_DURATION);
      setStatus("idle");
      alert("☕ Break complete! Ready for another session?");
    }
  }

  function startTimer() {
    if (status === "idle") {
      startTimeRef.current = new Date();
    }
    setStatus("running");
  }

  function pauseTimer() {
    setStatus("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function resetTimer() {
    setStatus("idle");
    setTimeLeft(mode === "work" ? WORK_DURATION : BREAK_DURATION);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 btn-primary px-4 py-2 shadow-lg"
          style={{ fontSize: "12px" }}
        >
          ⏱️ Study Timer
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 victorian-card"
          style={{ width: "350px", maxWidth: "calc(100vw - 48px)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: mode === "work" 
                ? "linear-gradient(135deg, var(--green-deep), var(--green-mid))"
                : "linear-gradient(135deg, var(--rose-deep), var(--rose-mid))",
              borderColor: "var(--gold-mid)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            }}
          >
            <div>
              <p className="font-['Playfair_Display'] font-bold text-amber-100 text-sm">
                {mode === "work" ? "⏱️ Focus Session" : "☕ Break Time"}
              </p>
              <p className="text-xs text-green-200 font-['Lora'] italic">
                Pomodoro Timer
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-200 hover:text-amber-100 transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Timer Display */}
          <div className="p-6 text-center">
            <div
              className="font-['Playfair_Display'] text-6xl font-bold mb-4"
              style={{ color: mode === "work" ? "var(--green-deep)" : "var(--rose-deep)" }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2 mb-4">
              {status === "idle" || status === "paused" ? (
                <button onClick={startTimer} className="btn-primary px-6 py-2">
                  {status === "paused" ? "Resume" : "Start"}
                </button>
              ) : (
                <button onClick={pauseTimer} className="btn-secondary px-6 py-2">
                  Pause
                </button>
              )}
              <button onClick={resetTimer} className="btn-secondary px-4 py-2">
                Reset
              </button>
            </div>

            {/* Task Input */}
            {mode === "work" && status === "idle" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="victorian-input text-sm w-full"
                />
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="victorian-input text-sm w-full"
                >
                  <option value="">Select course (optional)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-xs font-['Lora'] font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                Recent Sessions
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sessions.slice(0, 5).map((s, i) => (
                  <div
                    key={i}
                    className="text-xs p-2 rounded"
                    style={{ background: "rgba(45,74,62,0.06)" }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-['Source_Sans_3'] truncate flex-1">
                        {s.task_description}
                      </span>
                      <span className="text-stone-400 ml-2">{s.duration_minutes}m</span>
                    </div>
                    {s.courses && (
                      <div className="text-[10px] mt-0.5" style={{ color: s.courses.color }}>
                        {s.courses.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
