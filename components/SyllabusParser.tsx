// components/SyllabusParser.tsx
"use client";

import { useState } from "react";

export default function SyllabusParser() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;

    setParsing(true);
    setError("");
    setResult(null);

    try {
      // Convert PDF to text (simplified - in production use pdf-parse or similar)
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

    try {
      const response = await fetch("/api/save-parsed-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Syllabus data saved! Refresh the dashboard to see updates.");
        setFile(null);
        setResult(null);
      } else {
        alert("❌ Failed to save: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  }

  return (
    <div className="victorian-card p-5">
      <h2 className="section-header mb-4">
        <span>📄</span> Syllabus Parser
      </h2>

      <div className="space-y-4">
        {/* Upload */}
        <div>
          <label className="block text-xs font-['Lora'] font-semibold text-stone-600 mb-2 uppercase tracking-wide">
            Upload PDF Syllabus
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="victorian-input text-sm w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || parsing}
          className="btn-primary w-full disabled:opacity-50"
        >
          {parsing ? "Parsing..." : "Parse Syllabus"}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl border border-rose-400 bg-rose-50">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl" style={{ background: "rgba(61,107,88,0.06)" }}>
              <h3 className="font-['Playfair_Display'] font-semibold mb-2">Parsed Data</h3>
              <div className="text-sm space-y-1">
                <p><strong>Course:</strong> {result.course_title}</p>
                <p><strong>Professor:</strong> {result.professor}</p>
                <p><strong>Assignments Found:</strong> {result.assignments?.length || 0}</p>
                <p><strong>Readings Found:</strong> {result.readings?.length || 0}</p>
              </div>
            </div>

            {/* Preview Assignments */}
            {result.assignments && result.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-['Lora'] font-semibold mb-2">Assignments Preview:</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.assignments.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="text-xs p-2 rounded" style={{ background: "rgba(196,150,31,0.06)" }}>
                      <strong>{a.title}</strong> — {a.due_date}
                    </div>
                  ))}
                  {result.assignments.length > 5 && (
                    <p className="text-xs text-stone-500 italic">...and {result.assignments.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={saveToDatabase}
              className="btn-primary w-full"
            >
              ✅ Save to Database
            </button>
          </div>
        )}

        <div className="text-xs font-['Lora'] text-stone-500 italic mt-4 p-3 rounded" style={{ background: "rgba(196,150,31,0.06)" }}>
          <p className="mb-2"><strong>Note:</strong> The parser works best with well-formatted syllabi that have:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Clear assignment titles and dates</li>
            <li>Consistent date formats (MM/DD/YYYY)</li>
            <li>Readable text (not scanned images)</li>
          </ul>
          <p className="mt-2">If parsing fails, you can still manually add assignments via the dashboard.</p>
        </div>
      </div>
    </div>
  );
}
