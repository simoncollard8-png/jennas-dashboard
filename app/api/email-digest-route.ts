// app/api/email-digest/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint should be called by a cron job every Sunday at 6pm
export async function POST(req: NextRequest) {
  try {
    // Verify secret token to prevent unauthorized calls
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upcoming assignments for the week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, courses(title,color)')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .neq('status', 'done')
      .order('due_date');

    // Get study sessions from the past week
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*, courses(title)')
      .gte('started_at', lastWeek.toISOString())
      .order('started_at', { ascending: false });

    const totalStudyMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

    // Build email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; background: #f7efe2; color: #1a1209; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h1 { font-family: 'Playfair Display', serif; color: #2d4a3e; border-bottom: 2px solid #c4961f; padding-bottom: 10px; }
    h2 { font-family: 'Playfair Display', serif; color: #3d2e1a; font-size: 18px; margin-top: 30px; }
    .assignment { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 8px; background: rgba(196,150,31,0.06); }
    .date { font-weight: bold; color: #8b6914; }
    .stat { display: inline-block; padding: 10px 20px; background: #2d4a3e; color: #e8c96a; border-radius: 8px; margin: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #d4c4a8; font-size: 12px; color: #6b5a3e; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 Your Weekly Study Digest</h1>
    <p style="font-style: italic; color: #6b5a3e;">Frederick's weekly summary for Jenna</p>

    <h2>📅 Coming Up This Week</h2>
    ${assignments && assignments.length > 0 
      ? assignments.map(a => `
        <div class="assignment" style="border-color: ${a.courses?.color || '#8b6914'}">
          <div class="date">${new Date(a.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div><strong>${a.title}</strong></div>
          <div style="font-size: 13px; color: #6b5a3e;">${a.courses?.title || ''}</div>
        </div>
      `).join('')
      : '<p>No assignments due this week! 🎉 Time to get ahead or take a well-deserved break.</p>'
    }

    <h2>⏱️ Last Week's Study Stats</h2>
    <div>
      <span class="stat">⏱️ ${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m studied</span>
      <span class="stat">📚 ${sessions?.length || 0} focus sessions</span>
    </div>

    <h2>💭 Frederick's Note</h2>
    <p style="font-style: italic; background: rgba(61,107,88,0.06); padding: 15px; border-radius: 8px; border-left: 4px solid #3d6b58;">
      "${getFredQuote(assignments?.length || 0)}"
    </p>

    <div class="footer">
      <p>📧 You're receiving this because you're using Jenna's Dashboard</p>
      <p>🐾 With wisdom from Frederick, Chief Morale Officer</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via your email service (Resend, SendGrid, etc.)
    // For now, we'll just return the HTML for testing
    // In production, integrate with Resend:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Frederick <frederick@jennas-dashboard.com>',
      to: process.env.JENNA_EMAIL!,
      subject: `📚 Your Weekly Study Digest - ${new Date().toLocaleDateString()}`,
      html: emailHTML,
    });
    */

    return Response.json({ 
      success: true, 
      assignmentsCount: assignments?.length || 0,
      studyMinutes: totalStudyMinutes,
      // Remove this in production, only for testing:
      previewHTML: emailHTML
    });

  } catch (error: any) {
    console.error('Email digest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getFredQuote(assignmentCount: number): string {
  if (assignmentCount === 0) {
    return "A light week ahead, meow! Perfect time to explore beyond the syllabus or simply rest your paws.";
  } else if (assignmentCount <= 3) {
    return "A manageable week ahead. Pace yourself, and remember - even the sharpest claws need regular sharpening.";
  } else {
    return "Quite the busy week! Break it into smaller mice to catch. One task at a time, one paw in front of the other.";
  }
}
