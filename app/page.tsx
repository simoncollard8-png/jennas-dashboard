import Image from "next/image";
import Link from "next/link";

const courses = [
  { code: "HISP 485", title: "Preservation Studio", prof: "Dr. Whitaker", grade: "92%", nextDue: "Field Report – Sep 12" },
  { code: "HISP 355", title: "Museum Design", prof: "Dr. Rivera", grade: "88%", nextDue: "Exhibit Proposal – Sep 18" },
  { code: "ARTH 330", title: "19th Century Art", prof: "Dr. Hughes", grade: "95%", nextDue: "Essay – Sep 14" },
  { code: "ARTH 420", title: "Women in Art History", prof: "Dr. Patel", grade: "90%", nextDue: "Research Paper – Sep 22" }
];

const deadlines = [
  { date: "Sep 12", course: "HISP 485", assignment: "Field Report" },
  { date: "Sep 14", course: "ARTH 330", assignment: "Essay" },
  { date: "Sep 18", course: "HISP 355", assignment: "Exhibit Proposal" }
];

const frederickQuotes = [
  "Even the smallest paw leaves an imprint on history.",
  "The cat who studies today naps in peace tomorrow.",
  "Paws and reflect before deadlines sneak up."
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fdfbf6] p-6 font-sans">

      {/* Nav */}
      <nav className="flex gap-6 justify-center mb-8 p-4 bg-rose-100/70 rounded-xl shadow border border-rose-300">
        <Link href="/" className="font-bold hover:text-rose-600">Dashboard</Link>
        <Link href="/calendar" className="font-bold hover:text-rose-600">Calendar</Link>
        <Link href="/grades" className="font-bold hover:text-rose-600">Grades</Link>
      </nav>

      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-serif font-bold">Jenna’s Semester Dashboard</h1>
        <p className="italic">University of Mary Washington — Fall 2025</p>
        <div className="mt-2 w-full bg-gray-200 h-2 rounded">
          <div className="bg-rose-600 h-2 rounded" style={{ width: "18%" }} />
        </div>
        <p className="text-sm mt-1">Week 3 of 16</p>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Courses */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-300 col-span-2">
          <h2 className="text-xl font-serif mb-2">My Courses</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Link key={c.code} href={`/courses/${c.code.replace(" ", "")}`}>
                <div className="cursor-pointer bg-white/95 shadow rounded-lg p-4 border border-rose-200 hover:shadow-xl transition">
                  <h3 className="font-bold text-rose-800">{c.code}</h3>
                  <p className="text-sm">{c.title}</p>
                  <p className="text-xs italic">Next: {c.nextDue}</p>
                  <p className="text-xs">Grade: {c.grade}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Deadlines */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-300">
          <h2 className="text-xl font-serif mb-2">Upcoming Deadlines</h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {deadlines.map((d, i) => (
              <li key={i} className="flex justify-between hover:text-rose-700">
                <span>{d.date}</span>
                <span>{d.course} — {d.assignment}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* GPA */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-300 text-center">
          <h2 className="text-xl font-serif mb-2">Current GPA</h2>
          <p className="text-4xl font-bold text-rose-700">3.72</p>
          <p className="italic">On track for Magna Cum Laude</p>
        </section>

        {/* Frederick */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-300 text-center">
          <Image src="/frederick.png" alt="Frederick" width={120} height={120} className="mx-auto rounded-full border-4 border-rose-500" />
          <p className="mt-2 italic text-rose-800">“{frederickQuotes[Math.floor(Math.random() * frederickQuotes.length)]}”</p>
        </section>

        {/* Calendar strip */}
        <section className="bg-white/90 p-6 rounded-2xl shadow-lg border border-rose-300 col-span-2 text-center">
          <h2 className="text-xl font-serif mb-2">This Week</h2>
          <div className="flex gap-2 justify-center">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xs">{day}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-100 border border-rose-400 text-xs font-bold">
                  {10 + i}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

