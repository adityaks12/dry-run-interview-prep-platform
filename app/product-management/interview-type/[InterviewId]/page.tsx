// app/product-management/interview/[interviewId]/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Recorder from '../../../../components/Recorder';
import AudioVisualizer from '../../../../components/AudioVisualizer';
import TranscriptPanel from '../../../../components/TranscriptPanel';
import InterviewToolbar from '../../../../components/InterviewToolbar';

type Message = { id: string; speaker: 'ai' | 'user' | 'system'; text: string; ts: string };

export default function InterviewRoom({ params }: { params: { interviewId: string } }) {
  const { interviewId } = params;
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [processingFinishJob, setProcessingFinishJob] = useState<string | null>(null);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [interviewMeta, setInterviewMeta] = useState<{ interview_id: string; started_at?: string } | null>(null);

  const interviewRef = useRef({ interviewId });

  // attempt to hydrate interview metadata (best-effort)
  useEffect(() => {
    interviewRef.current.interviewId = interviewId;
    (async () => {
      try {
        // try to fetch interview meta (fallback if endpoint not present)
        const res = await fetch(`/api/interview/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          setInterviewMeta({ interview_id: interviewId, started_at: data.start_at });
          if (data.first_question) {
            setMessages(m => [...m, { id: `q-${Date.now()}`, speaker: 'ai', text: data.first_question.text, ts: new Date().toISOString() }]);
            setCurrentTurnId(data.current_turn_id || null);
          }
        } else {
          // fallback: insert a reasonable opening question
          setMessages([{ id: 'q-open', speaker: 'ai', text: 'Describe a product challenge you recently solved and how you approached it.', ts: new Date().toISOString() }]);
        }
      } catch (err) {
        console.warn('No interview meta endpoint; using fallback question', err);
        setMessages([{ id: 'q-open', speaker: 'ai', text: 'Describe a product challenge you recently solved and how you approached it.', ts: new Date().toISOString() }]);
      }
    })();
  }, [interviewId]);

  // helper: append message
  const pushMessage = (m: Message) => setMessages(prev => [...prev, m]);

  // Handler when recording/upload flow completes with a transcript
  // The Recorder component should upload blob to /api/audio/upload and return audio_id or transcript.
  // For simplicity we expect Recorder to return a transcript string via callback.
  const handleUserTranscript = async (transcript: string) => {
    const turnId = `turn_${Date.now()}`;
    pushMessage({ id: `u-${Date.now()}`, speaker: 'user', text: transcript, ts: new Date().toISOString() });

    // notify server the turn has completed so AI can follow up
    try {
      const payload = { transcript };
      const res = await fetch(`/api/interview/${interviewId}/turn/${currentTurnId || 'turn_0'}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // data.followup contains AI question text in MSW mock
        if (data.followup?.text) {
          setAiSpeaking(true);
          // small delay to emulate TTS
          setTimeout(() => {
            pushMessage({ id: `ai-${Date.now()}`, speaker: 'ai', text: data.followup.text, ts: new Date().toISOString() });
            setAiSpeaking(false);
            setCurrentTurnId(data.next_turn_id || null);
            if (data.end) {
              onInterviewFinish();
            }
          }, 800);
        } else if (data.end) {
          onInterviewFinish();
        }
      } else {
        // if server not available, do a local follow-up placeholder
        setAiSpeaking(true);
        setTimeout(() => {
          pushMessage({ id: `ai-${Date.now()}`, speaker: 'ai', text: 'Thanks — briefly quantify your impact next time.', ts: new Date().toISOString() });
          setAiSpeaking(false);
        }, 900);
      }
    } catch (err) {
      console.error('complete turn failed', err);
      setAiSpeaking(false);
    }
  };

  // Start interview UI
  const handleStart = () => {
    setStarted(true);
    // optionally ping server that interview started
    // assume interviewId is available in scope
    setInterviewMeta((m) =>
    m
        ? { ...m, started_at: new Date().toISOString() }
        : { interview_id: interviewId, started_at: new Date().toISOString() }
    );

    // start with AI asking first queued question (already in messages)
  };

  // End interview abruptly via toolbar; does not save progress
  const handleEnd = () => {
    if (!confirm('End interview now? Your progress will not be saved.')) return;
    // navigate back to product-management landing
    router.push('/product-management');
  };

  // When interview completes (time or AI signals end)
  const onInterviewFinish = async () => {
    setEnded(true);
    // request server to queue evaluation if endpoint exists
    try {
      const res = await fetch(`/api/interview/${interviewId}/finish`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProcessingFinishJob(data.processing_job_id || null);
        // poll for results
        pollResults();
      } else {
        // show success screen locally but results not available
        setResultsAvailable(false);
      }
    } catch (err) {
      console.warn('finish call failed', err);
      setResultsAvailable(false);
    }
  };

  // polls /api/interview/:id/results until available or timeout
  const pollResults = async () => {
    const maxAttempts = 12;
    let tryCount = 0;
    const poll = async () => {
      tryCount++;
      const res = await fetch(`/api/interview/${interviewId}/results`);
      if (res.status === 200) {
        const data = await res.json();
        // we got results
        setResultsAvailable(true);
        // replace transcript with server transcript if provided
        if (data.transcript) {
          pushMessage({ id: `sys-${Date.now()}`, speaker: 'system', text: 'Server transcript available — see panel.', ts: new Date().toISOString() });
        }
        return;
      } else if (res.status === 202 && tryCount < maxAttempts) {
        const j = await res.json().catch(() => ({}));
        const wait = j.eta_seconds ? Math.min(5000, j.eta_seconds * 1000) : 2000;
        setTimeout(poll, wait);
      } else {
        // timeout or error
        setResultsAvailable(false);
      }
    };
    poll();
  };

  // When user clicks "View feedback" after finish
  const handleViewFeedback = async () => {
    // Try fetching results and route to a /results view or show a modal
    try {
      const res = await fetch(`/api/interview/${interviewId}/results`);
      if (res.ok) {
        const data = await res.json();
        // show a simple alert for now — you can route to a feedback page
        alert('Feedback:\n' + (data.feedback_text || 'No feedback text found.'));
      } else {
        alert('Feedback not ready yet.');
      }
    } catch (err) {
      alert('Could not fetch feedback.');
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 84, height: 84, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Interviewer — Product Lead</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>An AI-driven interviewer mimicking typical PM interviews</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AudioVisualizer active={aiSpeaking} />
          </div>
          <InterviewToolbar
            started={started}
            onStart={handleStart}
            onEnd={handleEnd}
            interviewId={interviewId}
            ended={ended}
          />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {!started && !ended && (
          <div style={{ border: '1px dashed var(--card-border)', padding: 28, borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>Ready to begin?</h3>
            <p style={{ color: 'var(--muted)' }}>
              Press <strong>Start Interview</strong> when you are ready. The interviewer will ask follow-ups and the session will be timed.
            </p>
            <div style={{ marginTop: 12 }}>
              <button onClick={handleStart} style={{ background: 'var(--primary)', color: '#fff', padding: '10px 14px', borderRadius: 8, border: 'none' }}>
                Start Interview
              </button>
            </div>
          </div>
        )}

        {started && !ended && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
            <div>
              {/* Live transcript area */}
              <TranscriptPanel messages={messages} />

              <div style={{ marginTop: 12 }}>
                <Recorder
                  // expects Recorder to call onTranscript when upload + STT completes
                  // Our simple Recorder currently only logs blob; modify it to call onTranscript(blobTranscript)
                  // For this UI we assume Recorder exposes a prop onTranscript
                  // If your Recorder doesn't, you can wire blob upload here instead.
                  // @ts-ignore
                  onTranscript={(t: string) => handleUserTranscript(t)}
                />
              </div>
            </div>

            <aside style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Session details</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Interview ID: <code style={{ fontSize: 12 }}>{interviewId}</code>
              </div>
              <div style={{ marginTop: 10 }}>
                <strong>Elapsed</strong>: <span>--:--</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={() => onInterviewFinish()} style={{ background: 'var(--accent)', border: 'none', padding: '8px 12px', borderRadius: 8, color: '#fff' }}>
                  Finish Interview (end & evaluate)
                </button>
              </div>
            </aside>
          </div>
        )}

        {ended && (
          <div style={{ marginTop: 18, border: '1px solid var(--card-border)', padding: 20, borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>Interview complete</h3>
            <p style={{ color: 'var(--muted)' }}>Well done — your interview has concluded. Below is a transcript snapshot and options to view feedback.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginTop: 12 }}>
              <div>
                <TranscriptPanel messages={messages} />
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleViewFeedback()} style={{ background: 'var(--primary)', color: '#fff', padding: '10px 12px', borderRadius: 8, border: 'none' }}>
                    View feedback
                  </button>
                  <button onClick={() => router.push('/product-management')} style={{ background: 'transparent', border: '1px solid var(--card-border)', padding: '10px 12px', borderRadius: 8 }}>
                    Back to practice
                  </button>
                </div>
              </div>

              <aside style={{ border: '1px solid var(--card-border)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>Interview details</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
                  Interview ID: <code>{interviewId}</code>
                </div>
                <div style={{ marginTop: 10 }}>
                  Results Ready: {resultsAvailable ? 'Yes' : 'No'}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => router.push(`/product-management/interview/${interviewId}/results`)} style={{ background: '#fff', border: '1px solid var(--card-border)', padding: '8px 10px', borderRadius: 8 }}>
                    Open results page
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
