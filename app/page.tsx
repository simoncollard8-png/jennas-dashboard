import Image from "next/image";

const courses = [
  { code: "HISP 485", title: "Preservation Studio", prof: "Dr. Whitaker", grade: "92%", nextDue: "Field Report – Sep 12" },
  { code: "HISP 355", title: "Museum Design", prof: "Dr. Rivera", grade: "88%", nextDue: "Exhibit Proposal – Sep 18" },
  { code: "ARTH 330", title: "19th Century Art", prof: "Dr. Hughes", grade: "95%", nextDue: "Essay – Sep 14" },
  { code: "ARTH 420", title: "Women in Art History", prof: "Dr. Patel", grade: "90%", nextDue: "Research Paper – Sep 22" },
  { code: "HISP 404", title: "Urban Preservation Policy", prof: "Dr. Chen", grade: "85%", nextDue: "Case Study – Oct 3" },
  { code: "ARTH 350", title: "Italian Renaissance", prof: "Dr. Rossi", grade: "93%", nextDue: "Presentation – Oct 10" },
  { code: "IDLS 499", title: "Senior Capstone", prof: "Dr. Grant", grade: "N/A", nextDue: "Proposal – Oct 15" },
];

const deadlines = [
  { date: "Sep 12", course: "HISP 485", assignment: "Field Report" },
  { date: "Sep 14", course: "ARTH 330", assignment: "Essay" },
  { date: "Sep 18", course: "HISP 355", assignment: "Exhibit Proposal" },
  { date: "Sep 22", course: "ARTH 420", assignment: "Research Paper" },
  { date: "Oct 3", course: "HISP 404", assignment: "Case Study" },
];

const frederickQuotes = [
  "Even the smallest paw leaves an imprint on history.",
  "The cat who studies today naps in peace tomorrow.",
  "Paws and reflect before deadlines sneak up."
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fdfbf6] text-gray-800 p-6 flex flex-col gap-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-serif font-bold">Jenna’s Semester Dashboard</h1>
        <p className="text-lg italic">University of Mary Washington — Fall 2025</p>
        <div className="mt-2 w-full bg-gray-200 h-2 rounded">
          <div className="bg-rose-600 h-2 rounded" style={{ width: "18%" }} />
        </div>
        <p className="text-sm mt-1">Week 3 of 16</p>
      </header>

      {/* Courses */}
      <section>
        <h2 className="text-xl font-serif mb-2">My Courses</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.code} className="bg-white shadow rounded-xl p-4 border">
              <h3 className="font-bold">{c.code}: {c.title}</h3>
              <p className="text-sm">Prof. {c.prof}</p>
              <p className="text-sm">Grade: {c.grade}</p>
              <p className="text-sm italic">Next Due: {c.nextDue}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deadlines */}
      <section>
        <h2 className="text-xl font-serif mb-2">Upcoming Deadlines</h2>
        <ul className="bg-white shadow rounded-xl p-4 border space-y-2">
          {deadlines.map((d, i) => (
            <li key={i} className="flex justify-between">
              <span>{d.date}</span>
              <span>{d.course} — {d.assignment}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* GPA Snapshot & Frederick */}
      <section className="flex gap-4">
        <div className="flex-1 bg-white shadow rounded-xl p-4 border text-center">
          <h2 className="text-xl font-serif mb-2">Current GPA</h2>
          <p className="text-3xl font-bold text-rose-600">3.72</p>
          <p className="text-sm italic">On track for Magna Cum Laude</p>
        </div>
        <div className="flex-1 bg-white shadow rounded-xl p-4 border text-center">
          <Image src="/frederick.png" alt="Frederick" width={120} height={120} className="mx-auto rounded-full border" />
          <p className="mt-2 italic">“{frederickQuotes[0]}”</p>
        </div>
      </section>

      {/* Mini Calendar */}
      <section>
        <h2 className="text-xl font-serif mb-2">This Week</h2>
        <div className="flex gap-2 justify-center">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-sm">{day}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-100 border text-sm">
                {10 + i}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
