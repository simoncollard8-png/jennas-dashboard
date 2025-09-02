"use client";

import Link from "next/link";

export default function GradesPage() {
  return (
    <main
      className="min-h-screen p-6 font-sans bg-fixed bg-cover"
      style={{ backgroundImage: "url('/flower-bg.jpg')" }}
    >
      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/80 rounded-xl shadow-lg border border-rose-200">
        <Link href="/" className="font-bold hover:text-rose-600">Dashboard</Link>
        <Link href="/calendar" className="font-bold hover:text-rose-600">Calendar</Link>
        <Link href="/grades" className="font-bold text-rose-700 underline">Grades</Link>
      </nav>

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-5xl font-serif font-bold drop-shadow-sm">Grades Overview</h1>
        <p className="italic text-lg text-gray-700">Track GPA and course performance</p>
      </header>

      {/* Placeholder GPA Card */}
      <section className="bg-white/95 p-6 rounded-2xl shadow-lg border border-gray-200 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-serif mb-4 border-b pb-2">Current GPA</h2>
        <p className="text-6xl font-bold text-rose-700 drop-shadow">3.72</p>
        <p className="italic text-gray-600 mt-2">On track for Magna Cum Laude</p>
      </section>
    </main>
  );
}

