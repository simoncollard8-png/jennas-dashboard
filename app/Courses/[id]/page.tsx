import { useParams } from "next/navigation";

export default function CourseDetail() {
  const params = useParams();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-serif font-bold">Course: {params?.id}</h1>
      <p className="italic">Assignments and details for this course will show here.</p>
    </main>
  );
}
