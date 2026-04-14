// RevisionPage.js — Revision packs + Revision items list
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar/Sidebar';
import NotePreview from '../components/NotePreview/NotePreview';
import { getRevisionItems, getExams, getFolders, openItemFile, openNoteItem, moveItem } from '../services/api';
import './Revision.css';

function flattenFolders(folders, parentPath = '') {
  return folders.flatMap((folder) => {
    const path = parentPath ? `${parentPath} › ${folder.name}` : folder.name;
    return [{ ...folder, path }, ...flattenFolders(folder.children || [], path)];
  });
}

export default function RevisionPage() {
  const [revisionItems, setRevisionItems] = useState([]);
  const [exams, setExams] = useState([]);
  const [allFolders, setAllFolders] = useState([]);

  useEffect(() => {
    Promise.allSettled([getRevisionItems(), getExams(), getFolders(null)]).then(([itemsRes, examsRes, foldersRes]) => {
      if (itemsRes.status === 'fulfilled') {
        setRevisionItems(Array.isArray(itemsRes.value) ? itemsRes.value : []);
      }
      if (examsRes.status === 'fulfilled') {
        setExams(Array.isArray(examsRes.value) ? examsRes.value : []);
      }
      if (foldersRes.status === 'fulfilled') {
        const flatFolders = flattenFolders(Array.isArray(foldersRes.value) ? foldersRes.value : []);
        setAllFolders(flatFolders.map((folder) => ({ id: folder.id, path: folder.path || folder.name })));
      }
    });
  }, []);

  const handleMoveItem = async (item, destinationFolderIdValue) => {
    const destinationFolderId = Number(destinationFolderIdValue);
    if (!destinationFolderId || destinationFolderId === Number(item.folderId)) {
      return;
    }

    try {
      const moved = await moveItem(item.id, destinationFolderId);
      setRevisionItems((prev) => prev.map((existing) => (
        existing.id === item.id
          ? {
              ...existing,
              folderId: moved.folderId,
              folderPath: moved.folderPath,
            }
          : existing
      )));
      toast.success('Item location updated');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to move item';
      toast.error(message);
    }
  };

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

                    <div className="revision-location">
                      📁 {item.folderPath || 'Unknown folder'}
                    </div>

                    <div className="revision-move-row">
                      <span className="revision-move-label">Move to:</span>
                      <select
                        className="revision-move-select"
                        value={item.folderId || ''}
                        onChange={(e) => handleMoveItem(item, e.target.value)}
                      >
                        {allFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.path}</option>
                        ))}
                      </select>
                    </div>

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
