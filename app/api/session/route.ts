// app/api/session/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // (Optionally) read body if client sends JSON (not required here)
    // const body = await req.json().catch(() => ({}));

    const session_id = 'sess_' + Math.random().toString(36).slice(2, 10);
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    return NextResponse.json({ session_id, created_at, expires_at }, { status: 201 });
  } catch (err) {
    console.error('session POST error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
