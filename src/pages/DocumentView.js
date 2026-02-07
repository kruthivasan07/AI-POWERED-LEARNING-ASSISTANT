import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';

export default function DocumentView() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('context');
  const [chatMsg, setChatMsg] = useState('');
  const [chatRes, setChatRes] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadDoc() {
      try {
        const r = await API.get(`/documents/${id}`);
        if (mounted) setDoc(r.data.doc);
      } catch (e) {
        console.error(e);
        if (mounted) setError('Failed to load document');
      }
    }
    if (id) loadDoc();
    return () => { mounted = false; };
  }, [id]);

  async function doAction(action) {
    try {
      setError('');
      setAiResult(null);
      setLoading(true);
      const res = await API.post(`/documents/${id}/action`, { action });
      setAiResult(res.data.data);
    } catch (e) {
      console.error(e);
      setError('AI action failed');
    } finally {
      setLoading(false);
    }
  }

  async function doChat(e) {
    e.preventDefault();
    try {
      setError('');
      setChatRes('');
      setLoading(true);
      const r = await API.post(`/documents/${id}/chat`, { message: chatMsg });
      setChatRes(r.data.answer || 'No answer returned');
    } catch (e) {
      console.error(e);
      setError('Chat failed');
      setChatRes('');
    } finally {
      setLoading(false);
    }
  }

  if (error) return <div className="card">Error: {error}</div>;
  if (!doc) return <div className="card">Loading document...</div>;

  return (
    <div>
      <h3>{doc.title}</h3>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className="button" onClick={() => setTab('context')}>Context (PDF)</button>
        <button className="button" onClick={() => setTab('chat')}>AI Chat</button>
        <button className="button" onClick={() => setTab('actions')}>AI Actions</button>
        <button className="button" onClick={() => setTab('flashcards')}>Flashcards</button>
        <button className="button" onClick={() => setTab('quizzes')}>Quizzes</button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        {tab === 'context' && (
          <div>
            <iframe
              title="pdf"
              src={`http://localhost:5173/uploads/${doc.filename}`}
              style={{ width: '100%', height: 600, border: 'none' }}
            />
          </div>
        )}

        {tab === 'chat' && (
          <div>
            <form onSubmit={doChat} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Ask about the document"
                style={{ width: '80%', padding: '8px' }}
                required
              />
              <button className="button" type="submit" disabled={loading}>Ask</button>
            </form>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {loading ? 'Thinking...' : chatRes || 'No chat yet.'}
            </div>
          </div>
        )}

        {tab === 'actions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="button" onClick={() => doAction('summarize')} disabled={loading}>Summarize</button>
              <button className="button" onClick={() => doAction('explain')} disabled={loading}>Explain</button>
              <button className="button" onClick={() => doAction('flashcards')} disabled={loading}>Generate Flashcards</button>
              <button className="button" onClick={() => doAction('quizzes')} disabled={loading}>Generate Quizzes</button>
            </div>

            <div style={{ marginTop: 12 }}>
              {loading && <div>Working...</div>}
              {!loading && (
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {tab === 'flashcards' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button className="button" onClick={() => doAction('flashcards')} disabled={loading}>Load Flashcards</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {loading && <div>Working...</div>}
              {!loading && Array.isArray(aiResult) && aiResult.length > 0 ? (
                aiResult.map((f, i) => (
                  <div key={i} className="card" style={{ marginBottom: 8 }}>
                    <strong>{f.term || f.title || `Term ${i + 1}`}</strong>
                    <div>{f.definition || f.desc || f.description}</div>
                  </div>
                ))
              ) : !loading && aiResult && !Array.isArray(aiResult) ? (
                <pre>{JSON.stringify(aiResult, null, 2)}</pre>
              ) : (
                !loading && <div>No flashcards yet. Click "Load Flashcards".</div>
              )}
            </div>
          </div>
        )}

        {tab === 'quizzes' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button className="button" onClick={() => doAction('quizzes')} disabled={loading}>Load Quizzes</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {loading && <div>Working...</div>}
              {!loading && Array.isArray(aiResult) && aiResult.length > 0 ? (
                aiResult.map((q, i) => (
                  <div key={i} className="card" style={{ marginBottom: 8 }}>
                    <div><strong>{q.type || 'Question'}</strong></div>
                    <div style={{ marginTop: 6 }}>{q.question || q.prompt || q.text}</div>
                    <div style={{ fontSize: 13, color: '#444', marginTop: 8 }}><strong>Hint:</strong> {q.hint || '—'}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}><strong>Answer outline:</strong> {q.answer || q.solution || '—'}</div>
                  </div>
                ))
              ) : !loading && aiResult && !Array.isArray(aiResult) ? (
                <pre>{JSON.stringify(aiResult, null, 2)}</pre>
              ) : (
                !loading && <div>No quizzes yet. Click "Load Quizzes".</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}