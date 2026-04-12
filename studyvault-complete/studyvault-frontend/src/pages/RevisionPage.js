// RevisionPage.js — Revision packs + Revision items list
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import NotePreview from '../components/NotePreview/NotePreview';
import { getRevisionItems, getExams, openItemFile, openNoteItem } from '../services/api';
import './Revision.css';

export default function RevisionPage() {
  const [revisionItems, setRevisionItems] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    getRevisionItems().then(setRevisionItems).catch(() => {});
    getExams().then(setExams).catch(() => {});
  }, []);

  const getExamRevisionItems = (examId) =>
    revisionItems.filter(item => String(item.examId || '') === String(examId || ''));

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        <div className="rv-header">
          <h1 className="rv-title">Revision <span>Packs</span></h1>
          <p className="rv-sub">All items marked with the revision tag</p>
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

                  {getExamRevisionItems(e.id).length > 0 ? (
                    <div className="pack-linked-list">
                      {getExamRevisionItems(e.id).map(item => (
                        <div className="pack-linked-item" key={item.id}>
                          <span className="pack-linked-dot">•</span>
                          <span className="pack-linked-title">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pack-items">No linked revision items yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {revisionItems.some(item => !item.examId) && (
          <div className="section">
            <div className="sec-label">🏷️ Unassigned revision items</div>
            <div className="pack-grid">
              {revisionItems.filter(item => !item.examId).map(item => (
                <div className="pack-card card" key={item.id}>
                  <div className="pack-name">{item.title}</div>
                  <div className="pack-date">Not linked to any exam yet</div>
                  <div className="pack-items">Link this item to an exam from the item card or Add Item form</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revision items */}
        <div className="section">
          <div className="sec-label">🃏 Revision Items ({revisionItems.length})</div>

          {revisionItems.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏷️</div>
              <h3>No revision items yet</h3>
              <p>Tag items with <strong>#revision</strong> to see them here</p>
            </div>
          ) : (
            <div className="revision-grid">
              {revisionItems.map(item => {
                const tagList = item.tags || [];
                return (
                  <div className="revision-card card" key={item.id}>
                    <div className="revision-card-top">
                      <div className="revision-kind">{item.type}</div>
                      <span className="revision-badge">#revision</span>
                    </div>

                    <div className="revision-title">{item.title}</div>

                    {item.type === 'NOTE' && item.content && (
                      <NotePreview text={item.content} className="revision-note-preview" label="note content" />
                    )}

                    {item.notes && (
                      <NotePreview text={item.notes} className="revision-note-preview" label="personal note" />
                    )}

                    <div className="revision-card-footer">
                      {(item.url || item.fileUrl) && (
                        <button
                          type="button"
                          className="revision-open-btn"
                          onClick={() => {
                            if (item.type === 'NOTE') {
                              openNoteItem(item);
                              return;
                            }
                            if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                            else if (item.fileUrl) openItemFile(item.id).catch(() => {});
                          }}
                        >
                          Open
                        </button>
                      )}

                      {tagList.length > 0 && (
                        <div className="revision-tags">
                          {tagList.map(tag => (
                            <span key={tag} className={`tag tag-${tag}`}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
