import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar/Sidebar';
import AddItem from '../components/AddItem/AddItem';
import NotePreview from '../components/NotePreview/NotePreview';
import { getFolders, getItems, deleteItem, toggleStar, createFolder, deleteFolder, openItemFile, openNoteItem, updateItemTags } from '../services/api';
import './FolderView.css';

const TYPE_META = {
  YOUTUBE: { icon: '▶️', cls: 'badge-youtube', label: 'YouTube', bg: '#fee2e2' },
  PDF:     { icon: '📄', cls: 'badge-pdf',     label: 'PDF',     bg: '#fee2e2' },
  IMAGE:   { icon: '🖼️', cls: 'badge-image',   label: 'Photo',   bg: '#f3e8ff' },
  LINK:    { icon: '🔗', cls: 'badge-link',    label: 'Link',    bg: '#dbeafe' },
  NOTE:    { icon: '✏️', cls: 'badge-note',    label: 'Note',    bg: '#fef3c7' },
};

const FILTERS = ['All', 'YouTube', 'PDF', 'Image', 'Link', 'Note', 'Starred'];
const ITEM_TAGS = ['important', 'confusing', 'revision'];

function flattenFolders(folders, parent = null) {
  return folders.flatMap(f => [
    { ...f, parentName: parent, path: parent ? `${parent} › ${f.name}` : f.name },
    ...flattenFolders(f.children || [], f.name),
  ]);
}

export default function FolderView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [folder,      setFolder]      = useState(null);
  const [subfolders,  setSubfolders]  = useState([]);
  const [items,       setItems]       = useState([]);
  const [filter,      setFilter]      = useState('All');
  const [showAdd,     setShowAdd]     = useState(false);
  const [showNewSub,  setShowNewSub]  = useState(false);
  const [newSubName,  setNewSubName]  = useState('');
  const [allFolders,  setAllFolders]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const lastLoadToastRef = useRef({ key: '', at: 0 });

  const load = useCallback(async () => {
    const folderIdNum = Number(id);
    if (!Number.isFinite(folderIdNum)) {
      toast.error('Invalid folder link');
      navigate('/');
      return;
    }

    setLoading(true);
    const [foldersResult, itemsResult] = await Promise.allSettled([
      getFolders(null),
      getItems(folderIdNum),
    ]);

    let all = [];
    let its = [];

    if (foldersResult.status === 'fulfilled') {
      all = Array.isArray(foldersResult.value) ? foldersResult.value : [];
    }

    if (itemsResult.status === 'fulfilled') {
      its = Array.isArray(itemsResult.value) ? itemsResult.value : [];
    }

    const flat = flattenFolders(all);
    const cur  = flat.find(f => String(f.id) === String(folderIdNum));
    setFolder(cur || null);
    setSubfolders(cur?.children || []);
    setItems(its);
    setAllFolders(flat.map(f => ({ id: f.id, name: f.name, path: f.path || f.name })));

    if (foldersResult.status === 'rejected' && itemsResult.status === 'rejected') {
      const message = foldersResult.reason?.response?.data?.message
        || itemsResult.reason?.response?.data?.message
        || 'Failed to load folder';
      const toastKey = `${folderIdNum}:${message}`;
      const now = Date.now();
      if (lastLoadToastRef.current.key !== toastKey || now - lastLoadToastRef.current.at > 1000) {
        lastLoadToastRef.current = { key: toastKey, at: now };
        toast.error(message);
      }
    } else if (!cur && foldersResult.status === 'fulfilled') {
      const toastKey = `${folderIdNum}:missing`;
      const now = Date.now();
      if (lastLoadToastRef.current.key !== toastKey || now - lastLoadToastRef.current.at > 1000) {
        lastLoadToastRef.current = { key: toastKey, at: now };
        toast.error('Folder not found or access denied');
      }
      navigate('/');
    }

    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteItem(itemId); toast.success('Deleted'); load(); }
    catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete';
      toast.error(message);
    }
  };

  const handleToggleStar = async (itemId) => {
    try { await toggleStar(itemId); load(); }
    catch (error) {
      const message = error?.response?.data?.message || 'Failed';
      toast.error(message);
    }
  };

  const handleToggleTag = async (item, tag) => {
    const currentTags = Array.isArray(item.tags) ? item.tags : [];
    const hasTag = currentTags.includes(tag);
    const nextTags = hasTag
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    try {
      const updated = await updateItemTags(item.id, nextTags);
      setItems(prev => prev.map(existing => existing.id === item.id ? { ...existing, tags: updated.tags || [] } : existing));
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update tag';
      toast.error(message);
    }
  };

  const handleCreateSub = async () => {
    if (!newSubName.trim()) return;
    try {
      await createFolder({ name: newSubName, parentId: id });
      toast.success('Sub-folder created!');
      setShowNewSub(false);
      setNewSubName('');
      load();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed';
      toast.error(message);
    }
  };

  const safeHostname = (value) => {
    if (!value) return null;
    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      return new URL(normalized).hostname;
    } catch {
      return null;
    }
  };

  const handleDeleteFolder = async (folderId, isCurrent = false) => {
    if (!window.confirm('Delete this folder and all its contents?')) return;
    try {
      await deleteFolder(folderId);
      toast.success('Folder deleted');
      if (isCurrent) {
        navigate('/');
        return;
      }
      load();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete folder';
      toast.error(message);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'All')     return true;
    if (filter === 'Starred') return item.starred;
    return item.type === filter.toUpperCase();
  });

  const openItem = (item) => {
    if (item.type === 'NOTE') {
      openNoteItem(item);
      return;
    }
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.fileUrl) {
      openItemFile(item.id).catch(() => toast.error('Failed to open file'));
    }
  };

  // Build breadcrumb
  const crumbs = folder?.path?.split(' › ') || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate('/')}>Home</span>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <span className="sep">›</span>
              <span className={`crumb ${i === crumbs.length - 1 ? 'cur' : ''}`}>{c}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Header */}
        <div className="folder-header">
          <div>
            <h1 className="folder-title">{folder?.name || 'Folder'}</h1>
            <p className="folder-sub">{subfolders.length} sub-folders · {items.length} items</p>
          </div>
          <div className="folder-actions">
            <button className="btn btn-danger" onClick={() => handleDeleteFolder(id, true)}>🗑 Delete Folder</button>
            <button className="btn btn-ghost" onClick={() => setShowNewSub(true)}>📁 New Sub-folder</button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>＋ Add Item</button>
          </div>
        </div>

        {/* Sub-folders */}
        {subfolders.length > 0 && (
          <div className="section">
            <div className="sec-title">📁 Sub-folders</div>
            <div className="subfolder-grid">
              {subfolders.map(sf => (
                <div className="subfolder-card card" key={sf.id} onClick={() => navigate(`/folder/${sf.id}`)}>
                  <button
                    className="subfolder-del"
                    title="Delete folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(sf.id);
                    }}
                  >✕</button>
                  <span className="sf-emoji">📁</span>
                  <div className="sf-name">{sf.name}</div>
                  <div className="sf-count">{sf.itemCount || 0} items</div>
                </div>
              ))}
              <div className="subfolder-card subfolder-new" onClick={() => setShowNewSub(true)}>
                <span className="sf-emoji">➕</span>
                <div className="sf-name" style={{ color: 'var(--text3)' }}>New</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="filter-row">
          {FILTERS.map(f => (
            <div
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >{f}</div>
          ))}
        </div>

        {/* Items list */}
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📂</div>
            <h3>No items here yet</h3>
            <p>Add a YouTube link, PDF, photo or note to this folder</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>＋ Add Item</button>
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map(item => {
              const meta = TYPE_META[item.type] || TYPE_META.LINK;
              return (
                <div className="list-item card" key={item.id} onClick={() => openItem(item)}>
                  <div className="list-icon" style={{ background: meta.bg }}>{meta.icon}</div>
                  <div className="list-meta">
                    <div className="list-name">
                      {item.title}
                      {item.starred && <span className="item-star-inline">★</span>}
                    </div>
                    <div className="list-detail">
                      {meta.label}
                      {item.url && safeHostname(item.url) && <> · <span className="list-url">{safeHostname(item.url)}</span></>}
                      {item.type === 'NOTE' && item.content && <NotePreview text={item.content} label="note content" />}
                      {item.notes && <NotePreview text={item.notes} label="personal note" />}
                    </div>
                    <div className="list-tags">
                      {ITEM_TAGS.map(tag => {
                        const selected = (item.tags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag tag-${tag} item-tag-toggle ${selected ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTag(item, tag);
                            }}
                            title={`${selected ? 'Remove' : 'Add'} #${tag}`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="list-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className={`action-btn ${item.starred ? 'starred' : ''}`}
                      title="Star"
                      onClick={() => handleToggleStar(item.id)}
                    >{item.starred ? '⭐' : '☆'}</button>
                    <button className="action-btn" title="Delete" onClick={() => handleDeleteItem(item.id)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddItem
          folderId={id}
          folders={allFolders}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      {showNewSub && (
        <div className="modal-overlay" onClick={() => setShowNewSub(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom:'1rem' }}>New Sub-folder</h2>
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" placeholder="e.g. Trees" value={newSubName} onChange={e => setNewSubName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSub()} autoFocus />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNewSub(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateSub}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
