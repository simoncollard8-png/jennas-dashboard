// app/syllabus-upload/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type ParsedSyllabus = {
  course_code: string;
  course_title: string;
  professor: string;
  term: string;
  assignments: Array<{
    title: string;
    due_date: string;
    notes?: string;
    type: string;
  }>;
  readings: Array<{
    week: number;
    title: string;
    source?: string;
    pages?: string;
    required: boolean;
  }>;
};

export default function SyllabusUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedSyllabus | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or Word document (.pdf, .docx, .doc)");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
  }

  async function parseSyllabus() {
    if (!file) return;

    setParsing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-syllabus", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse syllabus");
    } finally {
      setParsing(false);
    }
  }

  async function saveToDatabase() {
    if (!result) return;

    setSaving(true);

    try {
      const response = await fetch("/api/save-parsed-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Syllabus saved!\n\n${data.assignmentsAdded} assignments added\n${data.readingsAdded} readings added`
        );
        setFile(null);
        setResult(null);
      } else {
        alert("❌ Failed to save: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Nav */}
      <nav className="victorian-nav mb-6">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="nav-link">
            ← Dashboard
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-amber-100">Upload Syllabus</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="victorian-card p-6 fade-in-1">
          <h2 className="section-header">
            <span>📄</span> Syllabus Parser
          </h2>

          {/* Instructions */}
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(196,150,31,0.06)" }}>
            <p className="text-sm font-['Lora'] mb-2">
              <strong>How it works:</strong>
            </p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Upload your syllabus (PDF or Word document)</li>
              <li>Click "Parse Syllabus" to extract assignments and readings</li>
              <li>Review the parsed data</li>
              <li>Click "Save to Database" to add to your dashboard</li>
            </ol>
          </div>

          {/* Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-['Lora'] font-semibold text-stone-600 mb-2">
                Select Syllabus File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileSelect}
                className="victorian-input w-full"
              />
              {file && (
                <p className="text-xs text-stone-500 mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              onClick={parseSyllabus}
              disabled={!file || parsing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {parsing ? "Parsing..." : "Parse Syllabus"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-xl border border-rose-400 bg-rose-50">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Course Info */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(61,107,88,0.06)" }}>
                <h3 className="font-['Playfair_Display'] font-semibold text-lg mb-3">
                  Course Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Course:</strong> {result.course_title}
                  </div>
                  <div>
                    <strong>Code:</strong> {result.course_code}
                  </div>
                  <div>
                    <strong>Professor:</strong> {result.professor}
                  </div>
                  <div>
                    <strong>Term:</strong> {result.term}
                  </div>
                </div>
              </div>

              {/* Assignments Preview */}
              {result.assignments && result.assignments.length > 0 && (
                <div>
                  <h4 className="font-['Lora'] font-semibold mb-2">
                    Assignments Found: {result.assignments.length}
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {result.assignments.slice(0, 10).map((a, i) => (
                      <div
                        key={i}
                        className="text-sm p-3 rounded-lg"
                        style={{ background: "rgba(196,150,31,0.06)" }}
                      >
                        <div className="flex justify-between items-start">
                          <strong className="flex-1">{a.title}</strong>
                          <span className="text-stone-500 ml-2">
                            {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        </div>
                        {a.notes && <p className="text-xs text-stone-600 mt-1">{a.notes}</p>}
                      </div>
                    ))}
                    {result.assignments.length > 10 && (
                      <p className="text-xs text-stone-500 italic text-center">
                        ...and {result.assignments.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Readings Preview */}
              {result.readings && result.readings.length > 0 && (
                <div>
                  <h4 className="font-['Lora'] font-semibold mb-2">
                    Readings Found: {result.readings.length}
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.readings.slice(0, 5).map((r, i) => (
                      <div
                        key={i}
                        className="text-sm p-3 rounded-lg"
                        style={{ background: "rgba(61,107,88,0.06)" }}
                      >
                        <div>
                          <strong>Week {r.week}:</strong> {r.title}
                        </div>
                        {r.source && <p className="text-xs text-stone-600 mt-1">{r.source}</p>}
                        {r.pages && <p className="text-xs text-stone-500">Pages: {r.pages}</p>}
                      </div>
                    ))}
                    {result.readings.length > 5 && (
                      <p className="text-xs text-stone-500 italic text-center">
                        ...and {result.readings.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveToDatabase}
                disabled={saving}
                className="btn-primary w-full mt-4 disabled:opacity-50"
              >
                {saving ? "Saving..." : "✅ Save to Database"}
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 text-xs font-['Lora'] text-stone-500 italic p-4 rounded-lg" style={{ background: "rgba(196,150,31,0.06)" }}>
            <p className="font-semibold mb-2">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use clear, well-formatted syllabi with dates</li>
              <li>PDF works best (Word docs are also supported)</li>
              <li>Consistent date formats help (MM/DD/YYYY preferred)</li>
              <li>If parsing fails, you can manually add assignments via the dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
