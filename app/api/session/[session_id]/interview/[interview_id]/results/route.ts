import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { interview_id: string } }) {
  try {
    const { interview_id } = params;
    if (!interview_id) return NextResponse.json({ error: 'missing interview_id' }, { status: 400 });

    // Simulate processing sometimes
    const ready = Math.random() > 0.4;
    if (!ready) return NextResponse.json({ message: 'Processing' }, { status: 202 });

    const payload = {
      interview_id,
      transcript: `Interviewer: Tell me about a product you shipped.\nYou: I led a team...`,
      audio_url: '',
      overall_score: 72,
      scores: [
        { rubric: 'Structure', score: 4, max: 5, comment: 'Clear framework used.' },
        { rubric: 'Metrics', score: 3, max: 5, comment: 'Need concrete numbers.' }
      ],
      feedback_text: 'Practice quantifying impact next time.'
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('results route error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
