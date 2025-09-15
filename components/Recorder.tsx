// components/Recorder.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type RecorderProps = {
  /**
   * Called when transcript is available (string).
   * If transcript can't be produced, called with null (optional).
   */
  onTranscript?: (transcript: string | null) => void;
  /**
   * Upload endpoint (defaults to app route /api/audio/upload)
   */
  uploadEndpoint?: string;
  /**
   * Status endpoint template, must include {audio_id} placeholder.
   * Defaults to /api/audio/{audio_id}/status
   */
  statusEndpointTemplate?: string;
  /**
   * Polling behaviour
   */
  maxPollAttempts?: number;
  pollIntervalMs?: number;
  /**
   * UI labels (optional)
   */
  recordingLabel?: string;
  stopLabel?: string;
  uploadLabel?: string;
};

export default function Recorder({
  onTranscript,
  uploadEndpoint = '/api/audio/upload',
  statusEndpointTemplate = '/api/audio/{audio_id}/status',
  maxPollAttempts = 25,
  pollIntervalMs = 1200,
  recordingLabel = 'Record',
  stopLabel = 'Stop & Upload',
  uploadLabel = 'Uploading…'
}: RecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lastAudioId, setLastAudioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollAbortRef = useRef<{ abort: boolean }>({ abort: false });

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      pollAbortRef.current.abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      setChunks([]);
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) setChunks((c) => [...c, e.data]);
      };
      mr.onerror = (evt) => {
        console.error('MediaRecorder error', evt);
        setError('Recording error occurred.');
        setRecording(false);
      };
      mr.start();
      setRecording(true);
    } catch (err: any) {
      console.error('getUserMedia failed', err);
      setError(err?.message || 'Could not access microphone. Check permissions.');
    }
  };

  const stopRecording = async () => {
    // Stop the recorder, then upload the collected chunks
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    } catch (err) {
      console.warn('stopRecording error', err);
      setRecording(false);
    } finally {
      // keep the stream open until upload completes, so user can record again later
      // create the blob
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size === 0) {
        setError('No audio recorded.');
        stopMediaTracks();
        return;
      }
      await uploadBlob(blob);
    }
  };

  const cancelRecording = () => {
    // stop and discard
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setRecording(false);
    setChunks([]);
    stopMediaTracks();
    // optionally notify caller
    if (onTranscript) onTranscript(null);
  };

  const stopMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  async function uploadBlob(blob: Blob) {
    setError(null);
    setUploading(true);
    setLastAudioId(null);
    pollAbortRef.current.abort = false;
    try {
      const form = new FormData();
      form.append('file', blob, 'recording.webm');

      const res = await fetch(uploadEndpoint, { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Upload failed with status ${res.status}`);
      }
      const json = await res.json();
      const audioId: string | undefined = (json && (json.audio_id || json.id || json.job_id)) as any;
      if (!audioId) {
        console.warn('upload response missing audio_id; returning transcript if any', json);
        // some servers may return transcript inline
        const transcript = (json && (json.transcript || json.text)) as any;
        if (onTranscript) onTranscript(transcript ?? null);
        stopMediaTracks();
        setUploading(false);
        return;
      }

      setLastAudioId(audioId);
      // Poll for status
      const transcript = await pollForTranscript(audioId);
      if (onTranscript) onTranscript(transcript);
    } catch (err: any) {
      console.error('uploadBlob error', err);
      setError(err?.message ?? 'Upload failed');
      if (onTranscript) onTranscript(null);
    } finally {
      setUploading(false);
      // we can stop the microphone tracks now
      stopMediaTracks();
      setChunks([]);
    }
  }

  async function pollForTranscript(audioId: string): Promise<string | null> {
    const endpoint = statusEndpointTemplate.replace('{audio_id}', encodeURIComponent(audioId));
    let attempts = 0;

    while (attempts < maxPollAttempts && !pollAbortRef.current.abort) {
      try {
        await wait(pollIntervalMs);
        const res = await fetch(endpoint);
        // 200 means done, 202 means still processing (or other non-200)
        if (res.status === 200) {
          const json = await res.json();
          // expect { status: 'done', transcript: '...' }
          if (json && (json.transcript || json.text)) {
            return json.transcript || json.text;
          }
          // if server returns finished but no transcript, return null
          return null;
        }
        // optionally, check for explicit fields in 202 response
        // continue polling on non-200 as well
      } catch (err) {
        console.warn('poll error', err);
      }
      attempts += 1;
    }
    // timed out
    setError('Transcript not ready yet. Try again later.');
    return null;
  }

  function wait(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div>
        <button
          onClick={startRecording}
          disabled={recording || uploading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: recording ? '#c7d2fe' : 'var(--primary)',
            color: '#fff',
            border: 'none',
            cursor: recording || uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {recordingLabel}
        </button>
      </div>

      <div>
        <button
          onClick={stopRecording}
          disabled={!recording || uploading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: uploading ? '#f3f4f6' : 'transparent',
            border: '1px solid var(--card-border)',
            cursor: !recording || uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {stopLabel}
        </button>
      </div>

      <div>
        <button
          onClick={cancelRecording}
          disabled={!recording || uploading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--card-border)',
            cursor: !recording || uploading ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      <div style={{ minWidth: 140 }}>
        {uploading ? (
          <div style={{ color: 'var(--muted)' }}>{uploadLabel}</div>
        ) : lastAudioId ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Audio ID: {lastAudioId}</div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{error ?? 'Ready'}</div>
        )}
      </div>
    </div>
  );
}
