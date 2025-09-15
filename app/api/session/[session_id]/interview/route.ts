// app/api/session/[session_id]/interview/route.ts
import { NextResponse } from 'next/server';

type IncomingBody = {
  type?: string;
  category?: string;
  max_duration_seconds?: number;
  messages?: any; // we'll validate at runtime
};

export async function POST(req: Request, { params }: { params: { session_id: string } }) {
  try {
    const { session_id } = params;
    if (!session_id) {
      return NextResponse.json({ error: 'missing session_id' }, { status: 400 });
    }

    // parse body safely
    let body: IncomingBody = {};
    try {
      body = (await req.json()) as IncomingBody;
    } catch (err) {
      // if the client didn't send JSON, keep defaults
      console.warn('No JSON body or parse error for start interview', err);
    }

    // Normalize messages: ensure it's an array
    const rawMessages = body.messages;
    const messages = Array.isArray(rawMessages) ? rawMessages : [];

    // Optional: log for debugging (remove or reduce in production)
    console.log('Create interview for session:', session_id, 'payload:', {
      type: body.type,
      category: body.category,
      max_duration_seconds: body.max_duration_seconds,
      messages_count: messages.length
    });

    // Create interview metadata (in prod you'd persist to DB)
    const interview_id = 'intv_' + Math.random().toString(36).slice(2, 10);
    const start_at = new Date().toISOString();

    // If client sent prior messages, use them; otherwise seed a friendly first question
    const first_question = messages.length > 0
      ? { question_id: 'from_client', text: 'Continuing previous conversation...', source: 'client' }
      : { question_id: 'q_open', text: 'Tell me about a product you shipped — the problem, approach, and outcome.', source: 'system' };

    // Example response shape your frontend expects
    const responsePayload = {
      interview_id,
      session_id,
      start_at,
      max_duration_seconds: body.max_duration_seconds ?? 15 * 60,
      current_turn_id: 'turn_1',
      first_question,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err) {
    console.error('POST /api/session/[session_id]/interview error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
