import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createItem, uploadItem } from '../../services/api';
import './AddItem.css';

const TYPES = [
  { key: 'YOUTUBE', icon: '▶️', label: 'YouTube' },
  { key: 'PDF',     icon: '📄', label: 'PDF/Doc'  },
  { key: 'IMAGE',   icon: '🖼️', label: 'Photo'    },
  { key: 'LINK',    icon: '🔗', label: 'Link'     },
  { key: 'NOTE',    icon: '✏️', label: 'Note'     },
];

const TAGS = ['important', 'confusing', 'revision'];

export default function AddItem({ folderId, folders = [], onClose, onSaved }) {
  const [type, setType]       = useState('YOUTUBE');
  const [title, setTitle]     = useState('');
  const [url, setUrl]         = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder]   = useState(folderId || '');
  const [tags, setTags]       = useState([]);
  const [file, setFile]       = useState(null);
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);

  const toggleTag = (t) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Please add a title');
    if (!folder)       return toast.error('Please select a folder');

    setSaving(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title);
        fd.append('folderId', folder);
        fd.append('type', type);
        fd.append('tags', tags.join(','));
        fd.append('notes', notes);
        await uploadItem(fd);
      } else {
        await createItem({ title, url, content, type, folderId: folder, tags, notes });
      }
      toast.success('Saved to StudyVault!');
      onSaved?.();
      onClose();
    } catch (e) {
      const message = e?.response?.data?.message || 'Failed to save. Try again.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const needsUrl     = ['YOUTUBE', 'LINK'].includes(type);
  const needsFile    = ['PDF', 'IMAGE'].includes(type);
  const needsContent = type === 'NOTE';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add to StudyVault</h2>
            <p className="modal-sub">Save a resource into your folder</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Type picker */}
        <div className="type-picker">
          {TYPES.map(t => (
            <div
              key={t.key}
              className={`type-opt ${type === t.key ? 'active' : ''}`}
              onClick={() => setType(t.key)}
            >
              <span className="type-icon">{t.icon}</span>
              {t.label}
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="form-group">
          <label>Title</label>
          <input
            className="form-input"
            placeholder="e.g. AVL Trees — Full Explanation"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* URL / File / Content */}
        {needsUrl && (
          <div className="form-group">
            <label>{type === 'YOUTUBE' ? 'YouTube URL' : 'Link URL'}</label>
            <input
              className="form-input"
              placeholder={type === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://...'}
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
        )}

        {needsFile && (
          <div className="form-group">
            <label>Upload File</label>
            <label className="upload-zone">
              <span className="upload-icon">☁️</span>
              <span className="upload-text">{file ? file.name : 'Click to choose file'}</span>
              <span className="upload-sub">{type === 'PDF' ? 'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX' : 'JPG, PNG, HEIC'}</span>
              <input
                type="file"
                hidden
                accept={type === 'PDF' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx' : 'image/*'}
                onChange={e => setFile(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {needsContent && (
          <div className="form-group">
            <label>Note Content</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Write your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        )}

        {/* Folder */}
        <div className="form-group">
          <label>Save to Folder</label>
          <select
            className="form-input"
            value={folder}
            onChange={e => setFolder(e.target.value)}
          >
            <option value="">— Select a folder —</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.path || f.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>Tags</label>
          <div className="tag-help">Click a tag to add or remove it.</div>
          {tags.length > 0 && (
            <div className="selected-tags">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`selected-tag tag-${tag}`}
                  onClick={() => toggleTag(tag)}
                  title={`Remove #${tag}`}
                >
                  <span className="selected-tag-label">#{tag}</span>
                  <span className="selected-tag-remove">Remove</span>
                </button>
              ))}
            </div>
          )}
          <div className="tag-row">
            {TAGS.map(t => (
              <button
                key={t}
                type="button"
                className={`tag-opt ${tags.includes(t) ? `tag-${t} selected` : ''}`}
                onClick={() => toggleTag(t)}
                aria-pressed={tags.includes(t)}
                title={tags.includes(t) ? `Remove #${t}` : `Add #${t}`}
              >
                <span>#{t}</span>
                {tags.includes(t) && <span className="tag-remove">remove</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Personal note (optional)</label>
          <input
            className="form-input"
            placeholder="e.g. Watch from 1:20:00 for AVL trees..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <span className="spinner" /> : '✓ Save to Vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
