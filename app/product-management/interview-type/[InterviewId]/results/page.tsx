'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type RubricScore = {
  rubric: string;
  score: number;
  max?: number;
  comment?: string;
};

type ResultsPayload = {
  interview_id: string;
  transcript?: string;
  audio_url?: string;
  scores?: RubricScore[];
  feedback_text?: string;
  overall_score?: number; // optional normalized total 0..100
};

export default function ResultsPage({ params }: { params: { interviewId: string } }) {
  const { interviewId } = params;
  const router = useRouter();

  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/interview/${encodeURIComponent(interviewId)}/results`);
        if (res.status === 202) {
          // still processing: show friendly message and poll
          if (!mounted) return;
          setError('Results are being processed. This page will refresh automatically.');
          // poll until ready
          const poll = async () => {
            for (let i = 0; i < 12; i++) {
              await new Promise((r) => setTimeout(r, 2000));
              const r2 = await fetch(`/api/interview/${encodeURIComponent(interviewId)}/results`);
              if (r2.status === 200) {
                const j = await r2.json();
                if (!mounted) return;
                setData(j);
                setError(null);
                setLoading(false);
                return;
              }
            }
            if (mounted) {
              setError('Results still processing. Try again later.');
              setLoading(false);
            }
          };
          poll();
          return;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => 'Unknown error');
          throw new Error(txt || `Status ${res.status}`);
        }

        const j = await res.json();
        if (!mounted) return;
        setData(j);
      } catch (err: any) {
        console.error('fetch results error', err);
        if (mounted) setError(err.message || 'Could not fetch results');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResults();
    return () => {
      mounted = false;
    };
  }, [interviewId]);

  const downloadTranscript = () => {
    if (!data?.transcript) return;
    const blob = new Blob([data.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${interviewId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results_${interviewId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const overallScore = React.useMemo(() => {
    if (!data?.scores || data.scores.length === 0) {
      if (typeof data?.overall_score === 'number') return data.overall_score;
      return null;
    }
    // compute normalized overall as percent of sum(score/max)
    let total = 0;
    let maxTotal = 0;
    for (const s of data.scores) {
      const max = typeof s.max === 'number' ? s.max : 5;
      total += s.score;
      maxTotal += max;
    }
    if (maxTotal === 0) return null;
    return Math.round((total / maxTotal) * 100);
  }, [data]);

  return (
    <div className="container" style={{ paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Interview Results</h1>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            Interview ID: <code style={{ fontSize: 13 }}>{interviewId}</code>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/product-management')} style={{ padding: '8px 12px', borderRadius: 8 }}>
            ← Back to practice
          </button>
          <button onClick={downloadJson} disabled={!data} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none' }}>
            Export JSON
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {loading && <div style={{ color: 'var(--muted)' }}>Loading results…</div>}
        {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}

        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
            <main>
              <section style={{ marginBottom: 18, border: '1px solid var(--card-border)', padding: 14, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Overall</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {overallScore !== null ? `${overallScore}%` : typeof data.overall_score === 'number' ? `${data.overall_score}%` : '—'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Action</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                      <button onClick={downloadTranscript} disabled={!data.transcript} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                        Download transcript
                      </button>
                      <button onClick={() => downloadJson()} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none' }}>
                        Download all
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Rubric scores</h3>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Rubric</th>
                        <th style={{ width: 120, textAlign: 'center', padding: '10px 12px' }}>Score</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.scores && data.scores.length > 0) ? data.scores.map((s, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '12px' }}>{s.rubric}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{s.score}{s.max ? ` / ${s.max}` : ''}</td>
                          <td style={{ padding: '12px' }}>{s.comment ?? '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} style={{ padding: 12, color: 'var(--muted)' }}>No rubric scores available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>AI Feedback</h3>
                <div style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8, color: 'var(--muted)' }}>
                  {data.feedback_text ?? 'No detailed feedback available.'}
                </div>
              </section>

              <section style={{ marginBottom: 18 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Transcript</h3>
                <div style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
                  {data.transcript ?? 'Transcript not available.'}
                </div>
              </section>
            </main>

            <aside>
              <div style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Session</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Interview ID</div>
                <div style={{ fontFamily: 'monospace', marginTop: 6 }}>{interviewId}</div>
                {data.audio_url && (
                  <>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Audio</div>
                      <audio controls src={data.audio_url} style={{ width: '100%', marginTop: 8 }} />
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <a href={data.audio_url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--card-border)' }}>Open</a>
                        <a href={data.audio_url} download={`audio_${interviewId}.webm`} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--primary)', color: '#fff', textDecoration: 'none' }}>Download</a>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>Next steps</div>
                <ol style={{ marginTop: 8, color: 'var(--muted)', paddingLeft: 18 }}>
                  <li>Review the transcript and rubric comments.</li>
                  <li>Practice the highlighted weak areas (see rubric comments).</li>
                  <li>Re-run a bitesize practice focusing on the low-score rubrics.</li>
                </ol>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => router.push(`/product-management/interview/${interviewId}`)} style={{ padding: '8px 12px', borderRadius: 8, width: '100%' }}>
                    Re-run interview
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
