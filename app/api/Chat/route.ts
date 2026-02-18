// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are Frederick, Jenna's personal academic assistant. You're a wise, encouraging Norwegian Forest cat who helps Jenna manage her semester at the University of Mary Washington.

JENNA'S CONTEXT:
- Senior student studying Historical Preservation and Art History
- Spring 2026 semester (5 courses)
- Courses: ARTH224 (Arts of Japan & Korea), ARTH305 (Egyptian & Near Eastern Art), ARTH315 (Art Museum Studies), HISP205 (Documentation and Field Work), HISP208 (Introduction to Conservation)
- Also taking French 3 and needs help passing

YOUR PERSONALITY:
- Warm, encouraging, slightly playful
- Use cat-related metaphors occasionally ("paws and reflect", "curiosity never killed this cat")
- Keep responses concise and actionable
- Always prioritize Jenna's wellbeing and stress management

CAPABILITIES:
- Query and manage assignments
- Help with French (vocabulary, grammar, conversation practice, essay feedback)
- Provide study tips and time management advice
- Search the web for research sources
- Generate study materials

Be helpful, be encouraging, be Frederick.`;

const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'get_assignments',
    description: 'Get assignments filtered by date range, course, or status. Returns upcoming, overdue, or all assignments.',
    input_schema: {
      type: 'object',
      properties: {
        course_id: { type: 'string', description: 'Filter by course ID (e.g., ARTH224-F25). Optional.' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done', 'scheduled', 'no-class'], description: 'Filter by status. Optional.' },
        date_range: { type: 'string', enum: ['today', 'this_week', 'this_month', 'overdue', 'all'], description: 'Date range filter. Default: this_week' },
      },
    },
  },
  {
    name: 'update_assignment_status',
    description: 'Update the status of an assignment. Use this when Jenna completes work or wants to track progress.',
    input_schema: {
      type: 'object',
      properties: {
        assignment_id: { type: 'string', description: 'UUID of the assignment to update' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'New status' },
        notes: { type: 'string', description: 'Optional notes to add/update' },
      },
      required: ['assignment_id', 'status'],
    },
  },
  {
    name: 'add_assignment',
    description: 'Create a new assignment. Use when Jenna mentions a new deadline.',
    input_schema: {
      type: 'object',
      properties: {
        course_id: { type: 'string', description: 'Course ID (e.g., ARTH224-F25)' },
        title: { type: 'string', description: 'Assignment title' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        notes: { type: 'string', description: 'Optional notes' },
      },
      required: ['course_id', 'title', 'due_date'],
    },
  },
  {
    name: 'get_calendar',
    description: 'Get a calendar view of assignments for a specific time period.',
    input_schema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: ['week', 'month'], description: 'Calendar view type. Default: week' },
      },
    },
  },
  {
    name: 'french_vocab_quiz',
    description: 'Generate a French vocabulary quiz with translations and example sentences.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic or theme (e.g., "food", "travel", "subjunctive verbs")' },
        count: { type: 'number', description: 'Number of words. Default: 10' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'french_grammar_help',
    description: 'Explain French grammar concepts with examples and exercises.',
    input_schema: {
      type: 'object',
      properties: {
        concept: { type: 'string', description: 'Grammar concept (e.g., "subjunctive", "passé composé", "pronouns")' },
      },
      required: ['concept'],
    },
  },
  {
    name: 'french_conversation',
    description: 'Start a French conversation practice session. Respond in French and provide corrections.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Conversation topic (e.g., "daily routine", "travel plans")' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'french_essay_feedback',
    description: 'Review a French essay for grammar, vocabulary, and style. Provide corrections and suggestions.',
    input_schema: {
      type: 'object',
      properties: {
        essay_text: { type: 'string', description: 'The French essay text to review' },
      },
      required: ['essay_text'],
    },
  },
];

async function handleToolCall(toolName: string, toolInput: any): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  switch (toolName) {
    case 'get_assignments': {
      let query = supabase.from('assignments').select('*, courses(id,title,color)');
      
      if (toolInput.course_id) query = query.eq('course_id', toolInput.course_id);
      if (toolInput.status) query = query.eq('status', toolInput.status);
      
      const range = toolInput.date_range || 'this_week';
      if (range === 'today') {
        query = query.eq('due_date', today);
      } else if (range === 'this_week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        query = query.gte('due_date', weekStart.toISOString().split('T')[0])
                     .lte('due_date', weekEnd.toISOString().split('T')[0]);
      } else if (range === 'overdue') {
        query = query.lt('due_date', today).neq('status', 'done');
      }
      
      const { data, error } = await query.order('due_date');
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data);
    }
    
    case 'update_assignment_status': {
      const updates: any = { status: toolInput.status };
      if (toolInput.notes) updates.notes = toolInput.notes;
      
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', toolInput.assignment_id)
        .select('*, courses(title)')
        .single();
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, assignment: data });
    }
    
    case 'add_assignment': {
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          course_id: toolInput.course_id,
          title: toolInput.title,
          due_date: toolInput.due_date,
          notes: toolInput.notes || null,
          status: 'todo',
        }])
        .select('*, courses(title)')
        .single();
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, assignment: data });
    }
    
    case 'get_calendar': {
      const view = toolInput.view || 'week';
      const start = new Date();
      const end = new Date(start);
      
      if (view === 'week') {
        start.setDate(start.getDate() - start.getDay() + 1);
        end.setDate(start.getDate() + 6);
      } else {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
      }
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*, courses(title,color)')
        .gte('due_date', start.toISOString().split('T')[0])
        .lte('due_date', end.toISOString().split('T')[0])
        .order('due_date');
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ view, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], assignments: data });
    }
    
    // French tools return instructions for Claude to handle
    case 'french_vocab_quiz':
      return JSON.stringify({ 
        instruction: `Generate a French vocabulary quiz on "${toolInput.topic}" with ${toolInput.count || 10} words. Include French word, English translation, and an example sentence for each.`
      });
    
    case 'french_grammar_help':
      return JSON.stringify({
        instruction: `Explain the French grammar concept "${toolInput.concept}" with clear examples and practice exercises.`
      });
    
    case 'french_conversation':
      return JSON.stringify({
        instruction: `Start a French conversation about "${toolInput.topic}". Respond in French and provide gentle corrections to Jenna's responses.`
      });
    
    case 'french_essay_feedback':
      return JSON.stringify({
        instruction: `Review this French essay and provide detailed feedback on grammar, vocabulary, and style:\n\n${toolInput.essay_text}`
      });
    
    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
    
    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find((block: any) => block.type === 'tool_use');
      if (toolUseBlock) {
        const toolResult = await handleToolCall(toolUseBlock.name, toolUseBlock.input);
        
        // Continue conversation with tool result
        const followUp = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          tools,
          messages: [
            ...messages,
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: toolResult,
              }],
            },
          ],
        });
        
        return Response.json({ content: followUp.content });
      }
    }
    
    return Response.json({ content: response.content });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
