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
- Generate study materials and exam prep
- Provide study tips and time management advice
- Track readings and notes

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
  {
    name: 'exam_prep_generator',
    description: 'Generate study materials for an upcoming exam: study guide, practice questions, or flashcards.',
    input_schema: {
      type: 'object',
      properties: {
        course_id: { type: 'string', description: 'Course ID for the exam' },
        exam_topic: { type: 'string', description: 'Main topic or chapter for the exam' },
        material_type: { 
          type: 'string', 
          enum: ['study_guide', 'practice_questions', 'flashcards'], 
          description: 'Type of study material to generate'
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Difficulty level. Default: medium'
        },
      },
      required: ['course_id', 'exam_topic', 'material_type'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for academic resources, research sources, or factual information. Use this when Jenna needs current information or research materials.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        focus: {
          type: 'string',
          enum: ['academic', 'news', 'general'],
          description: 'Search focus. Use academic for scholarly sources. Default: general'
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_todos',
    description: 'Get to-do list items. Can filter by completion status, category, or priority.',
    input_schema: {
      type: 'object',
      properties: {
        completed: { type: 'boolean', description: 'Filter by completion status. Optional.' },
        category: { type: 'string', enum: ['school', 'personal', 'errands', 'work', 'health', 'general'], description: 'Filter by category. Optional.' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority. Optional.' },
      },
    },
  },
  {
    name: 'add_todo',
    description: 'Add a new task to the to-do list.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional task description' },
        category: { type: 'string', enum: ['school', 'personal', 'errands', 'work', 'health', 'general'], description: 'Task category. Default: general' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority. Default: medium' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format. Optional.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_todo',
    description: 'Update a to-do item. Can mark as completed, change priority, or edit details.',
    input_schema: {
      type: 'object',
      properties: {
        todo_id: { type: 'string', description: 'UUID of the todo to update' },
        completed: { type: 'boolean', description: 'Mark as completed/uncompleted' },
        title: { type: 'string', description: 'New title' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'New priority' },
      },
      required: ['todo_id'],
    },
  },
  {
    name: 'delete_todo',
    description: 'Delete a to-do item.',
    input_schema: {
      type: 'object',
      properties: {
        todo_id: { type: 'string', description: 'UUID of the todo to delete' },
      },
      required: ['todo_id'],
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

    case 'exam_prep_generator':
      return JSON.stringify({
        instruction: `Generate ${toolInput.material_type} for ${toolInput.exam_topic} in course ${toolInput.course_id}. Difficulty: ${toolInput.difficulty || 'medium'}. 
        
        For study_guide: Create a comprehensive outline with key concepts, important dates/people/terms, and connections between topics.
        For practice_questions: Create 10-15 questions with answers. Include multiple choice, short answer, and essay prompts.
        For flashcards: Create 20-25 flashcard pairs (question/answer or term/definition).
        
        Format the output clearly with headings and structure.`
      });

    case 'web_search':
      return JSON.stringify({
        instruction: `I would search for "${toolInput.query}" but web search integration requires additional setup. For now, I can help you with:
        - Suggesting search terms and resources
        - Explaining concepts from my training data
        - Pointing you to reliable academic databases
        
        What specific information are you looking for about "${toolInput.query}"?`
      });

    case 'get_todos': {
      let query = supabase.from('todos').select('*').order('created_at', { ascending: false });
      
      if (toolInput.completed !== undefined) query = query.eq('completed', toolInput.completed);
      if (toolInput.category) query = query.eq('category', toolInput.category);
      if (toolInput.priority) query = query.eq('priority', toolInput.priority);
      
      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data);
    }

    case 'add_todo': {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          title: toolInput.title,
          description: toolInput.description || null,
          category: toolInput.category || 'general',
          priority: toolInput.priority || 'medium',
          due_date: toolInput.due_date || null,
          completed: false,
        }])
        .select()
        .single();
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, todo: data });
    }

    case 'update_todo': {
      const updates: any = {};
      if (toolInput.completed !== undefined) updates.completed = toolInput.completed;
      if (toolInput.title) updates.title = toolInput.title;
      if (toolInput.priority) updates.priority = toolInput.priority;
      
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', toolInput.todo_id)
        .select()
        .single();
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, todo: data });
    }

    case 'delete_todo': {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', toolInput.todo_id);
      
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, deleted: true });
    }
    
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
      const toolUseBlock = response.content.find((block: any) => block.type === 'tool_use') as any;
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
