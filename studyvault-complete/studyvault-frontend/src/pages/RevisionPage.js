// RevisionPage.js — Revision packs + Flashcard mode
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import { getStarredItems, getExams } from '../services/api';
import './Revision.css';

export default function RevisionPage() {
  const [starred, setStarred] = useState([]);
  const [exams,   setExams]   = useState([]);
  const [fcIdx,   setFcIdx]   = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores,   setScores]  = useState({ hard: 0, ok: 0, easy: 0 });

  useEffect(() => {
    getStarredItems().then(setStarred).catch(() => {});
    getExams().then(setExams).catch(() => {});
  }, []);

  const current = starred[fcIdx];

  const rate = (level) => {
    setScores(p => ({ ...p, [level]: p[level] + 1 }));
    setFcIdx(i => Math.min(i + 1, starred.length - 1));
    setRevealed(false);
  };

  const reset = () => { setFcIdx(0); setRevealed(false); setScores({ hard: 0, ok: 0, easy: 0 }); };

  const done = fcIdx >= starred.length && starred.length > 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        <div className="rv-header">
          <h1 className="rv-title">Revision <span>Packs</span></h1>
          <p className="rv-sub">Your starred items — ready for exam revision</p>
        </div>

        {/* Exam packs summary */}
        {exams.length > 0 && (
          <div className="section">
            <div className="sec-label">📅 Exams to prepare for</div>
            <div className="pack-grid">
              {exams.map(e => (
                <div className="pack-card card" key={e.id}>
                  <div className="pack-name">{e.subject}</div>
                  <div className="pack-date">{new Date(e.examDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
                  <div className="pack-items">{starred.length} starred items to review</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flashcard */}
        <div className="section">
          <div className="sec-label">🃏 Flashcard Revision — Starred Items ({starred.length})</div>

          {starred.length === 0 ? (
            <div className="empty-state">
              <div className="icon">⭐</div>
              <h3>No starred items yet</h3>
              <p>Star important items in your folders — they'll appear here for revision</p>
            </div>
          ) : done ? (
            <div className="fc-done card">
              <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🎉</div>
              <h3>Revision complete!</h3>
              <p style={{ color:'var(--text3)', fontSize:'0.8rem', marginTop:'0.3rem', marginBottom:'1rem' }}>
                Hard: {scores.hard} · Okay: {scores.ok} · Got it: {scores.easy}
              </p>
              <button className="btn btn-primary" onClick={reset}>Start Again</button>
            </div>
          ) : (
            <div className="fc-area card">
              <div className="fc-top">
                <span className="fc-label">Card {fcIdx + 1} of {starred.length}</span>
                <div className="fc-scores">
                  <span style={{ color:'var(--red)' }}>😓 {scores.hard}</span>
                  <span style={{ color:'var(--blue)' }}>🤔 {scores.ok}</span>
                  <span style={{ color:'var(--green)' }}>✅ {scores.easy}</span>
                </div>
              </div>

              <div className="fc-question">{current?.title}</div>

              {current?.notes && (
                <div className={`fc-answer ${revealed ? 'revealed' : ''}`}>
                  {revealed ? current.notes : (
                    <button className="btn btn-ghost" onClick={() => setRevealed(true)}>
                      👁 Reveal answer / notes
                    </button>
                  )}
                </div>
              )}

              {current?.url && (
                <a href={current.url} target="_blank" rel="noreferrer" className="fc-link">
                  🔗 Open resource
                </a>
              )}

              <div className="fc-btns">
                <button className="fc-btn fc-hard" onClick={() => rate('hard')}>😓 Hard</button>
                <button className="fc-btn fc-ok"   onClick={() => rate('ok')}>🤔 Okay</button>
                <button className="fc-btn fc-easy" onClick={() => rate('easy')}>✅ Got it</button>
              </div>

              {/* Progress bar */}
              <div className="fc-progress">
                <div className="fc-progress-fill" style={{ width: `${(fcIdx / starred.length) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
