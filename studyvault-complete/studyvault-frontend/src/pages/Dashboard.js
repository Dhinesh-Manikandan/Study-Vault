import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar/Sidebar';
import AddItem from '../components/AddItem/AddItem';
import { useAuth } from '../context/AuthContext';
import { getStats, getRecentItems, getExams, getFolders, createFolder, createExam, deleteExam, deleteFolder } from '../services/api';
import { differenceInDays, format } from 'date-fns';
import './Dashboard.css';

const TYPE_META = {
  YOUTUBE: { icon: '▶️', label: 'YouTube', cls: 'badge-youtube' },
  PDF:     { icon: '📄', label: 'PDF',     cls: 'badge-pdf'     },
  IMAGE:   { icon: '🖼️', label: 'Photo',   cls: 'badge-image'   },
  LINK:    { icon: '🔗', label: 'Link',    cls: 'badge-link'    },
  NOTE:    { icon: '✏️', label: 'Note',    cls: 'badge-note'    },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats,   setStats]   = useState({ totalItems: 0, totalFolders: 0, starredItems: 0 });
  const [recent,  setRecent]  = useState([]);
  const [exams,   setExams]   = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // New folder modal
  const [showNewFolder, setShowNewFolder]   = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');

  // New exam modal
  const [showNewExam, setShowNewExam] = useState(false);
  const [newExam, setNewExam] = useState({ subject: '', date: '', time: '' });

  const name = user?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const load = async () => {
    setLoading(true);
    try {
      const [s, r, e, f] = await Promise.all([getStats(), getRecentItems(), getExams(), getFolders(null)]);
      setStats(s);
      setRecent(r);
      setExams(e);
      setFolders(f);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder({ name: newFolderName, parentId: null });
      toast.success('Folder created!');
      setShowNewFolder(false);
      setNewFolderName('');
      load();
    } catch { toast.error('Failed to create folder'); }
  };

  const handleCreateExam = async () => {
    if (!newExam.subject || !newExam.date) return toast.error('Fill in subject and date');
    try {
      await createExam(newExam);
      toast.success('Exam added!');
      setShowNewExam(false);
      setNewExam({ subject: '', date: '', time: '' });
      load();
    } catch { toast.error('Failed to add exam'); }
  };

  const handleDeleteExam = async (id) => {
    try { await deleteExam(id); load(); } catch { toast.error('Failed'); }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder and all its contents?')) return;
    try {
      await deleteFolder(id);
      toast.success('Folder deleted');
      load();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete folder';
      toast.error(message);
    }
  };

  const daysLeft = (dateStr) => {
    const d = differenceInDays(new Date(dateStr), new Date());
    return d < 0 ? 0 : d;
  };

  const urgencyColor = (days) => {
    if (days <= 7)  return { bg: '#fef2f2', text: '#991b1b', bar: '#ef4444', lbl: '#dc2626' };
    if (days <= 14) return { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b', lbl: '#b45309' };
    return              { bg: '#f0fdf4', text: '#166534', bar: '#22c55e', lbl: '#16a34a' };
  };

  const flattenFolders = (nodes, parentPath = '') =>
    nodes.flatMap(node => {
      const path = parentPath ? `${parentPath} › ${node.name}` : node.name;
      return [
        { id: node.id, name: node.name, path },
        ...flattenFolders(node.children || [], path),
      ];
    });

  const flatFolders = flattenFolders(folders);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">{greeting}, <span>{name}</span> 👋</h1>
            {exams.length > 0 && (
              <p className="dash-sub">
                {exams[0].subject} exam in {daysLeft(exams[0].examDate)} days — keep going!
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>＋ Add Item</button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Items',  value: stats.totalItems,   icon: '📦', sub: 'saved resources' },
            { label: 'Folders',      value: stats.totalFolders, icon: '📁', sub: 'across semesters' },
            { label: 'Starred',      value: stats.starredItems, icon: '⭐', sub: 'key items' },
            { label: 'Days to Exam', value: exams[0] ? daysLeft(exams[0].examDate) : '—', icon: '⏳', sub: exams[0]?.subject || 'No exam added', accent: true },
          ].map(s => (
            <div className="stat-card card" key={s.label}>
              <div className="stat-top">
                <span className="stat-label">{s.label}</span>
                <span className="stat-icon">{s.icon}</span>
              </div>
              <div className="stat-value" style={s.accent ? { color: 'var(--accent)' } : {}}>
                {loading ? '…' : s.value}
              </div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Exams */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">📅 Upcoming Exams</span>
            <button className="see-all" onClick={() => setShowNewExam(true)}>＋ Add exam</button>
          </div>
          {exams.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📅</div>
              <h3>No exams added</h3>
              <p>Add your exam dates to track countdowns</p>
              <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={() => setShowNewExam(true)}>＋ Add Exam</button>
            </div>
          ) : (
            <div className="exam-row">
              {exams.slice(0, 4).map(exam => {
                const days = daysLeft(exam.examDate);
                const c = urgencyColor(days);
                return (
                  <div className="exam-card card" key={exam.id}>
                    <div className="exam-countdown" style={{ background: c.bg }}>
                      <div className="exam-days" style={{ color: c.text }}>{days}</div>
                      <div className="exam-dlabel" style={{ color: c.lbl }}>days</div>
                    </div>
                    <div className="exam-info">
                      <div className="exam-name">{exam.subject}</div>
                      <div className="exam-date">
                        {format(new Date(exam.examDate), 'MMM d')}
                        {exam.examTime ? ` · ${exam.examTime}` : ''}
                      </div>
                      <div className="exam-prog">
                        <div className="exam-prog-fill" style={{ width: `${Math.min(100, (30 - days) / 30 * 100)}%`, background: c.bar }} />
                      </div>
                    </div>
                    <button className="exam-del" onClick={() => handleDeleteExam(exam.id)}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Folders */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">📂 Your Folders</span>
            <button className="see-all" onClick={() => setShowNewFolder(true)}>＋ New folder</button>
          </div>
          {folders.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📂</div>
              <h3>No folders yet</h3>
              <p>Create your first semester folder to get started</p>
              <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={() => setShowNewFolder(true)}>＋ Create Folder</button>
            </div>
          ) : (
            <div className="folder-grid">
              {folders.map(f => (
                <div className="folder-card card" key={f.id} onClick={() => navigate(`/folder/${f.id}`)}>
                  <button
                    className="folder-del"
                    title="Delete folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(f.id);
                    }}
                  >✕</button>
                  <span className="folder-emoji">📂</span>
                  <div className="folder-name">{f.name}</div>
                  <div className="folder-count">{f.itemCount || 0} items</div>
                </div>
              ))}
              <div className="folder-card folder-card-new" onClick={() => setShowNewFolder(true)}>
                <span className="folder-emoji">➕</span>
                <div className="folder-name" style={{ color:'var(--text3)' }}>New Folder</div>
                <div className="folder-count">Create one</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Items */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">🕓 Recently Added</span>
            <span className="see-all" onClick={() => navigate('/search')}>See all →</span>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>Nothing saved yet</h3>
              <p>Start by adding a YouTube link, PDF, or note</p>
            </div>
          ) : (
            <div className="items-grid">
              {recent.map(item => {
                const meta = TYPE_META[item.type] || TYPE_META.LINK;
                return (
                  <div className="item-card card" key={item.id}>
                    {item.starred && <span className="item-star">★</span>}
                    <span className={`type-badge ${meta.cls}`}>{meta.icon} {meta.label}</span>
                    <div className="item-name">{item.title}</div>
                    <div className="item-path">{item.folderPath}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddItem
          folders={flatFolders}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom: '1rem' }}>New Folder</h2>
            <div className="form-group">
              <label>Folder name</label>
              <input
                className="form-input"
                placeholder="e.g. Semester 3"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNewFolder(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showNewExam && (
        <div className="modal-overlay" onClick={() => setShowNewExam(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom: '1rem' }}>Add Exam</h2>
            <div className="form-group">
              <label>Subject</label>
              <input className="form-input" placeholder="e.g. Data Structures" value={newExam.subject} onChange={e => setNewExam(p => ({...p, subject: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Exam Date</label>
              <input className="form-input" type="date" value={newExam.date} onChange={e => setNewExam(p => ({...p, date: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Time (optional)</label>
              <input className="form-input" type="time" value={newExam.time} onChange={e => setNewExam(p => ({...p, time: e.target.value}))} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNewExam(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateExam}>Add Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
