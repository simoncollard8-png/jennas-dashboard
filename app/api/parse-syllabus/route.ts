// app/api/parse-syllabus/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Ask Claude to parse the syllabus
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Parse this syllabus and extract the following information in JSON format:

{
  "course_code": "e.g., ARTH224",
  "course_title": "Full course name",
  "professor": "Professor name",
  "term": "e.g., Spring 2026",
  "assignments": [
    {
      "title": "Assignment name",
      "due_date": "YYYY-MM-DD format",
      "notes": "Any additional details",
      "type": "assignment|exam|paper|presentation|no-class"
    }
  ],
  "readings": [
    {
      "week": 1,
      "title": "Reading title",
      "source": "Book/article source",
      "pages": "Page numbers if available",
      "required": true
    }
  ]
}

Extract all assignments with dates, including exams, papers, presentations, and no-class days (holidays, breaks).
Extract all required readings organized by week if possible.
Use YYYY-MM-DD format for all dates.
Return ONLY the JSON, no markdown formatting or explanation.`,
            },
          ],
        },
      ],
    });

    const textContent = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    // Clean up JSON (remove markdown code fences if present)
    const cleanJson = textContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    return Response.json(parsed);

  } catch (error: any) {
    console.error('Syllabus parse error:', error);
    return Response.json({ 
      error: error.message || 'Failed to parse syllabus' 
    }, { status: 500 });
  }
}
