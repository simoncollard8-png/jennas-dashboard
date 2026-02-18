// app/api/save-parsed-syllabus/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Generate course ID
    const courseId = data.course_code || 
      `${data.course_title.substring(0, 6).toUpperCase()}-${data.term.replace(/\s/g, '')}`;

    // Insert/update course
    const { error: courseError } = await supabase
      .from('courses')
      .upsert({
        id: courseId,
        title: data.course_title,
        professor: data.professor,
        color: getRandomCourseColor(),
      }, { onConflict: 'id' });

    if (courseError) throw courseError;

    // Insert assignments
    if (data.assignments && data.assignments.length > 0) {
      const assignmentRows = data.assignments.map((a: any) => ({
        course_id: courseId,
        title: a.title,
        due_date: a.due_date,
        notes: a.notes || null,
        status: a.type === 'no-class' ? 'no-class' : 'scheduled',
      }));

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert(assignmentRows);

      if (assignmentError) throw assignmentError;
    }

    // Insert readings
    if (data.readings && data.readings.length > 0) {
      const readingRows = data.readings.map((r: any) => ({
        course_id: courseId,
        week: r.week || null,
        title: r.title,
        source: r.source || null,
        pages: r.pages || null,
        is_required: r.required !== false,
        completed: false,
      }));

      const { error: readingError } = await supabase
        .from('readings')
        .insert(readingRows);

      if (readingError) throw readingError;
    }

    return Response.json({ 
      success: true, 
      courseId,
      assignmentsAdded: data.assignments?.length || 0,
      readingsAdded: data.readings?.length || 0,
    });

  } catch (error: any) {
    console.error('Save syllabus error:', error);
    return Response.json({ 
      error: error.message || 'Failed to save syllabus data' 
    }, { status: 500 });
  }
}

function getRandomCourseColor(): string {
  const colors = [
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#A855F7', // Purple
    '#14B8A6', // Teal
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#10B981', // Green
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
