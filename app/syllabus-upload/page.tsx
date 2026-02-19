"use client";

import { useState } from "react";
import Link from "next/link";

export default function SyllabusUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<any>(null);
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
      setError("Please upload a PDF or Word document");
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
      setError(err.message || "Failed to parse");
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
        alert(`✅ Syllabus saved! ${data.assignmentsAdded} assignments, ${data.readingsAdded} readings added`);
        setFile(null);
        setResult(null);
      } else {
        alert("❌ Failed: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <nav className="victorian-nav mb-6">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="nav-link">← Dashboard</Link>
          <h1 className="font-['Playfair_Display'] text-xl text-amber-100">Upload Syllabus</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="victorian-card p-6">
          <h2 className="section-header"><span>📄</span> Syllabus Parser</h2>

          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(196,150,31,0.06)" }}>
            <p className="text-sm font-['Lora'] mb-2"><strong>How it works:</strong></p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Upload syllabus (PDF or Word)</li>
              <li>Click Parse Syllabus</li>
              <li>Review data</li>
              <li>Save to database</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-['Lora'] font-semibold text-stone-600 mb-2">Select File</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="victorian-input w-full" />
              {file && <p className="text-xs text-stone-500 mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>

            <button onClick={parseSyllabus} disabled={!file || parsing} className="btn-primary w-full disabled:opacity-50">
              {parsing ? "Parsing..." : "Parse Syllabus"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl border border-rose-400 bg-rose-50">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "rgba(61,107,88,0.06)" }}>
                <h3 className="font-['Playfair_Display'] font-semibold mb-3">Course Info</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><strong>Course:</strong> {result.course_title}</div>
                  <div><strong>Code:</strong> {result.course_code}</div>
                  <div><strong>Professor:</strong> {result.professor}</div>
                  <div><strong>Term:</strong> {result.term}</div>
                </div>
              </div>

              {result.assignments && result.assignments.length > 0 && (
                <div>
                  <h4 className="font-['Lora'] font-semibold mb-2">Assignments: {result.assignments.length}</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {result.assignments.slice(0, 10).map((a: any, i: number) => (
                      <div key={i} className="text-sm p-3 rounded-lg" style={{ background: "rgba(196,150,31,0.06)" }}>
                        <strong>{a.title}</strong> — {new Date(a.due_date).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={saveToDatabase} disabled={saving} className="btn-primary w-full disabled:opacity-50">
                {saving ? "Saving..." : "✅ Save to Database"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
