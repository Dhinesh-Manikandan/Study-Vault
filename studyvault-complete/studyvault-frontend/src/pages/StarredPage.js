import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import NotePreview from '../components/NotePreview/NotePreview';
import { getStarredItems, toggleStar, openItemFile, openNoteItem } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  YOUTUBE: { icon: '▶️', bg: '#fee2e2', cls: 'badge-youtube', label: 'YouTube' },
  PDF:     { icon: '📄', bg: '#fee2e2', cls: 'badge-pdf',     label: 'PDF'     },
  IMAGE:   { icon: '🖼️', bg: '#f3e8ff', cls: 'badge-image',   label: 'Photo'   },
  LINK:    { icon: '🔗', bg: '#dbeafe', cls: 'badge-link',    label: 'Link'    },
  NOTE:    { icon: '✏️', bg: '#fef3c7', cls: 'badge-note',    label: 'Note'    },
};

export default function StarredPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await getStarredItems()); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnstar = async (id) => {
    try { await toggleStar(id); load(); toast.success('Unstarred'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        <div style={{ marginBottom: '1.6rem' }}>
          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.55rem', fontWeight: 400 }}>
            Starred <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Items</span>
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Your most important resources — quick access anytime
          </p>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="icon">⭐</div>
            <h3>No starred items yet</h3>
            <p>Click the ⭐ on any item in your folders to star it</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {items.map(item => {
              const meta = TYPE_META[item.type] || TYPE_META.LINK;
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{ padding: '0.72rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
                  onClick={() => {
                    if (item.type === 'NOTE') {
                      openNoteItem(item);
                      return;
                    }
                    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                    else if (item.fileUrl) openItemFile(item.id).catch(() => toast.error('Failed to open file'));
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{item.title}</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>★</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '0.06rem' }}>
                      {item.folderPath} · <span className={`type-badge ${meta.cls}`}>{meta.label}</span>
                    </div>
                    {item.type === 'NOTE' && item.content && <NotePreview text={item.content} className="starred-note-preview" label="note content" />}
                    {item.notes && <NotePreview text={item.notes} className="starred-note-preview" label="personal note" />}
                  </div>
                  <button
                    style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 5, width: 26, height: 26, cursor: 'pointer', color: '#f59e0b', fontSize: '0.72rem' }}
                    onClick={e => { e.stopPropagation(); handleUnstar(item.id); }}
                    title="Unstar"
                  >⭐</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
