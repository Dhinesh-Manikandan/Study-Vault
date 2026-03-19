import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar/Sidebar';
import AddItem from '../components/AddItem/AddItem';
import { getFolders, getItems, deleteItem, toggleStar, createFolder, deleteFolder } from '../services/api';
import './FolderView.css';

const TYPE_META = {
  YOUTUBE: { icon: '▶️', cls: 'badge-youtube', label: 'YouTube', bg: '#fee2e2' },
  PDF:     { icon: '📄', cls: 'badge-pdf',     label: 'PDF',     bg: '#fee2e2' },
  IMAGE:   { icon: '🖼️', cls: 'badge-image',   label: 'Photo',   bg: '#f3e8ff' },
  LINK:    { icon: '🔗', cls: 'badge-link',    label: 'Link',    bg: '#dbeafe' },
  NOTE:    { icon: '✏️', cls: 'badge-note',    label: 'Note',    bg: '#fef3c7' },
};

const FILTERS = ['All', 'YouTube', 'PDF', 'Image', 'Link', 'Note', 'Starred'];

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

  const load = async () => {
    setLoading(true);
    try {
      const [all, its] = await Promise.all([getFolders(null), getItems(id)]);
      // Find current folder from flat list
      const flat = flattenFolders(all);
      const cur  = flat.find(f => String(f.id) === String(id));
      setFolder(cur);
      setSubfolders(cur?.children || []);
      setItems(its);
      setAllFolders(flat.map(f => ({ id: f.id, name: f.name, path: f.path || f.name })));
    } catch { toast.error('Failed to load folder'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const flattenFolders = (folders, parent = null) =>
    folders.flatMap(f => [
      { ...f, parentName: parent, path: parent ? `${parent} › ${f.name}` : f.name },
      ...flattenFolders(f.children || [], f.name),
    ]);

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteItem(itemId); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggleStar = async (itemId) => {
    try { await toggleStar(itemId); load(); }
    catch { toast.error('Failed'); }
  };

  const handleCreateSub = async () => {
    if (!newSubName.trim()) return;
    try {
      await createFolder({ name: newSubName, parentId: id });
      toast.success('Sub-folder created!');
      setShowNewSub(false);
      setNewSubName('');
      load();
    } catch { toast.error('Failed'); }
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
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'All')     return true;
    if (filter === 'Starred') return item.starred;
    return item.type === filter.toUpperCase();
  });

  const openItem = (item) => {
    const urlToOpen = item.url || item.fileUrl;
    if (urlToOpen) window.open(urlToOpen, '_blank');
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
                    <div className="list-name">{item.title}</div>
                    <div className="list-detail">
                      {meta.label}
                      {item.url && <> · <span className="list-url">{new URL(item.url).hostname}</span></>}
                      {item.notes && <> · {item.notes}</>}
                    </div>
                    <div className="list-tags">
                      {item.tags?.map(t => (
                        <span key={t} className={`tag tag-${t}`}>#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="list-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="action-btn"
                      title="Star"
                      onClick={() => handleToggleStar(item.id)}
                      style={item.starred ? { color: '#f59e0b', borderColor: '#fde68a', background: '#fef3c7' } : {}}
                    >⭐</button>
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
