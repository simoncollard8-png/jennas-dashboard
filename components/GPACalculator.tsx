// components/GPACalculator.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type GradeEntry = {
  course_id: string;
  course_title: string;
  credits: number;
  current_grade: number | null;
  projected_grade: number | null;
};

export default function GPACalculator() {
  const [courses, setCourses] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    const { data: coursesData } = await supabase.from("courses").select("*");
    const { data: gradesData } = await supabase.from("course_grades").select("*");

    const gradesMap = new Map(gradesData?.map(g => [g.course_id, g]) || []);

    const entries: GradeEntry[] = (coursesData || []).map(c => {
      const grade = gradesMap.get(c.id);
      return {
        course_id: c.id,
        course_title: c.title,
        credits: grade?.credits || 3,
        current_grade: grade?.current_grade || null,
        projected_grade: grade?.projected_grade || null,
      };
    });

    setCourses(entries);
    setLoading(false);
  }

  async function updateGrade(course_id: string, field: string, value: number) {
    await supabase
      .from("course_grades")
      .upsert({ course_id, [field]: value }, { onConflict: "course_id" });
    loadGrades();
  }

  function gradeToPoints(grade: number): number {
    if (grade >= 93) return 4.0;
    if (grade >= 90) return 3.7;
    if (grade >= 87) return 3.3;
    if (grade >= 83) return 3.0;
    if (grade >= 80) return 2.7;
    if (grade >= 77) return 2.3;
    if (grade >= 73) return 2.0;
    if (grade >= 70) return 1.7;
    if (grade >= 67) return 1.3;
    if (grade >= 65) return 1.0;
    return 0.0;
  }

  function calculateGPA(useProjected: boolean): string {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(c => {
      const grade = useProjected ? (c.projected_grade || c.current_grade) : c.current_grade;
      if (grade !== null) {
        totalPoints += gradeToPoints(grade) * c.credits;
        totalCredits += c.credits;
      }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "—";
  }

  const currentGPA = calculateGPA(false);
  const projectedGPA = calculateGPA(true);

  if (loading) return <div className="victorian-card p-4">Loading...</div>;

  return (
    <div className="victorian-card p-5">
      <h2 className="section-header mb-4">
        <span>★</span> GPA Calculator
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 rounded-xl" style={{ background: "rgba(61,107,88,0.1)" }}>
          <p className="text-xs font-['Lora'] text-stone-500 mb-1">Current GPA</p>
          <p className="font-['Playfair_Display'] text-3xl font-bold" style={{ color: "var(--green-mid)" }}>
            {currentGPA}
          </p>
        </div>
        <div className="text-center p-4 rounded-xl" style={{ background: "rgba(196,150,31,0.1)" }}>
          <p className="text-xs font-['Lora'] text-stone-500 mb-1">Projected GPA</p>
          <p className="font-['Playfair_Display'] text-3xl font-bold" style={{ color: "var(--gold-deep)" }}>
            {projectedGPA}
          </p>
        </div>
      </div>

      {/* Course Grades */}
      <div className="space-y-3">
        {courses.map(c => (
          <div key={c.course_id} className="p-3 rounded-xl border" style={{ borderColor: "var(--parchment-deep)" }}>
            <p className="font-['Playfair_Display'] font-semibold text-sm mb-2">{c.course_title}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-['Lora'] text-stone-500 uppercase tracking-wide">Credits</label>
                <input
                  type="number"
                  value={c.credits}
                  onChange={e => updateGrade(c.course_id, "credits", Number(e.target.value))}
                  className="victorian-input text-sm w-full"
                  min="1"
                  max="6"
                />
              </div>
              <div>
                <label className="text-[10px] font-['Lora'] text-stone-500 uppercase tracking-wide">Current %</label>
                <input
                  type="number"
                  value={c.current_grade || ""}
                  onChange={e => updateGrade(c.course_id, "current_grade", Number(e.target.value))}
                  className="victorian-input text-sm w-full"
                  placeholder="—"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-[10px] font-['Lora'] text-stone-500 uppercase tracking-wide">Projected %</label>
                <input
                  type="number"
                  value={c.projected_grade || ""}
                  onChange={e => updateGrade(c.course_id, "projected_grade", Number(e.target.value))}
                  className="victorian-input text-sm w-full"
                  placeholder="—"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
