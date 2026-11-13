import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStats, getExams, searchItems, getFolders, deleteAccountData } from '../services/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, signOut, updateCredentials } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Form states
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vault Analytics states
  const [stats, setStats] = useState({ totalItems: 0, starredItems: 0, totalFolders: 0 });
  const [exams, setExams] = useState([]);
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const displayName = user?.displayName || user?.username || user?.email || 'Scholar';
  const displayHandle = user?.username || user?.email || 'user';
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    setUsername(user?.username || user?.displayName || user?.email || '');
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, examsRes, itemsRes, foldersRes] = await Promise.allSettled([
        getStats(),
        getExams(),
        searchItems('', null, null),
        getFolders(null),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (examsRes.status === 'fulfilled' && Array.isArray(examsRes.value)) {
        setExams(examsRes.value);
      }
      if (itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value)) {
        setItems(itemsRes.value);
      }
      if (foldersRes.status === 'fulfilled' && Array.isArray(foldersRes.value)) {
        setFolders(foldersRes.value);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Material type breakdown
  const typeCounts = useMemo(() => {
    const counts = { YOUTUBE: 0, PDF: 0, NOTE: 0, IMAGE: 0, LINK: 0 };
    items.forEach((it) => {
      const t = (it.type || '').toUpperCase();
      if (counts[t] !== undefined) {
        counts[t]++;
      } else {
        counts.LINK++;
      }
    });
    return counts;
  }, [items]);

  // Tags breakdown
  const tagCounts = useMemo(() => {
    const counts = { important: 0, confusing: 0, revision: 0 };
    items.forEach((it) => {
      (it.tags || []).forEach((tg) => {
        const norm = tg.toLowerCase();
        if (counts[norm] !== undefined) counts[norm]++;
      });
    });
    return counts;
  }, [items]);

  // Next upcoming exam
  const nextExam = useMemo(() => {
    if (!exams || exams.length === 0) return null;
    const now = Date.now();
    const sorted = exams
      .map((ex) => {
        const datePart = String(ex.examDate).slice(0, 10);
        const rawTime = ex.examTime?.trim();
        const timePart = rawTime ? (rawTime.length === 5 ? `${rawTime}:00` : rawTime) : '23:59:59';
        const dt = new Date(`${datePart}T${timePart}`);
        const diffMs = dt.getTime() - now;
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...ex, dt, days, diffMs };
      })
      .filter((ex) => !isNaN(ex.dt.getTime()) && ex.diffMs > 0)
      .sort((a, b) => a.diffMs - b.diffMs);

    return sorted[0] || null;
  }, [exams]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Active Scholar';
    try {
      const d = new Date(user.createdAt);
      if (isNaN(d.getTime())) return 'Active Scholar';
      return `Member since ${format(d, 'MMMM yyyy')}`;
    } catch {
      return 'Active Scholar';
    }
  }, [user?.createdAt]);

  const copyAccountId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    toast.success('Account ID copied to clipboard');
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();

    const normalizedUsername = username.trim();
    const currentUsername = (user?.username || '').trim();
    const usernameChanged = normalizedUsername && normalizedUsername !== currentUsername;
    const passwordChanged = newPassword.trim().length > 0;

    if (!usernameChanged && !passwordChanged) {
      toast.error('No changes to save');
      return;
    }

    if (!currentPassword) {
      toast.error('Enter current password to save changes');
      return;
    }

    if (passwordChanged && newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordChanged && newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateCredentials({
        username: normalizedUsername,
        currentPassword,
        newPassword: passwordChanged ? newPassword : '',
      });

      if (error) {
        toast.error(error.message || 'Failed to update credentials');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Credentials updated successfully');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update credentials';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      'Are you sure you want to delete all folders, saved resources, notes, and exam schedules? This cannot be undone.'
    );
    if (!firstConfirm) return;

    const typed = window.prompt('Type DELETE to permanently erase your vault data:');
    if (typed !== 'DELETE') {
      toast('Account deletion canceled');
      return;
    }

    setBusy(true);
    try {
      await deleteAccountData();
      await signOut();
      toast.success('Account data deleted');
      navigate('/login');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete account data';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in profile-page">
        {/* Page Header */}
        <div className="profile-header">
          <div>
            <h1 className="profile-title">Profile &amp; Account Overview</h1>
            <p className="profile-sub">
              Account identity, learning analytics, credentials, and vault controls
            </p>
          </div>
          <div className="profile-header-actions">
            <button
              className="btn btn-ghost profile-theme-btn"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button className="btn btn-danger profile-logout-btn" onClick={handleLogout}>
              ↩ Log Out
            </button>
          </div>
        </div>

        {/* Account Identity Card */}
        <div className="card profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">{initials}</div>
              <span className="profile-online-badge" title="Active Account"></span>
            </div>

            <div className="profile-hero-info">
              <div className="profile-name-row">
                <h2 className="profile-name">{displayName}</h2>
                <span className="profile-role-badge">🎓 Student Scholar</span>
                <span className="profile-status-badge">🟢 Active Vault</span>
              </div>
              <div className="profile-handle-row">
                <span className="profile-handle">@{displayHandle}</span>
                <span className="profile-dot">·</span>
                <span className="profile-member-date">{memberSince}</span>
              </div>
              {/* <div className="profile-id-row">
                        <span className="profile-id-label">Vault ID:</span>
                        <code className="profile-id-code">{user?.id || '—'}</code>
                        <button
                          type="button"
                          className="profile-copy-btn"
                          onClick={copyAccountId}
                          title="Copy Account ID"
                        >
                          📋 Copy
                        </button>
                      </div> */}
            </div>
          </div>

          {/* <div className="profile-hero-right">
            <div className="profile-security-badge-box">
              <div className="profile-badge-title">🛡️ Account Security</div>
              <div className="profile-badge-desc">BCrypt Hash + JWT Auth</div>
              <div className="profile-badge-sub">Cloud Synced &amp; Isolated</div>
            </div>
          </div> */}
        </div>

        {/* Vault Learning Analytics */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3 className="profile-section-title">📊 Learning &amp; Vault Analytics</h3>
            <span className="profile-section-sub">Overview of your study materials across all semesters</span>
          </div>

          <div className="profile-stats-grid">
            <div className="card profile-stat-box" onClick={() => navigate('/search')}>
              <div className="stat-icon-wrap" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                📚
              </div>
              <div className="stat-content">
                <div className="stat-val">{loadingData ? '—' : stats.totalItems || items.length}</div>
                <div className="stat-name">Total Study Materials</div>
                <div className="stat-foot">Videos, PDFs, notes &amp; links</div>
              </div>
            </div>

            <div className="card profile-stat-box" onClick={() => navigate('/')}>
              <div className="stat-icon-wrap" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                📂
              </div>
              <div className="stat-content">
                <div className="stat-val">{loadingData ? '—' : stats.totalFolders || folders.length}</div>
                <div className="stat-name">Semesters &amp; Folders</div>
                <div className="stat-foot">Organized subject directories</div>
              </div>
            </div>

            <div className="card profile-stat-box" onClick={() => navigate('/starred')}>
              <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
                ⭐
              </div>
              <div className="stat-content">
                <div className="stat-val">{loadingData ? '—' : stats.starredItems || items.filter(i => i.starred).length}</div>
                <div className="stat-name">Starred High-Yield</div>
                <div className="stat-foot">Quick-access priority items</div>
              </div>
            </div>

            <div className="card profile-stat-box" onClick={() => navigate('/revision')}>
              <div className="stat-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                🎯
              </div>
              <div className="stat-content">
                <div className="stat-val">{loadingData ? '—' : tagCounts.revision}</div>
                <div className="stat-name">Revision Queue</div>
                <div className="stat-foot">Ready for flashcard review</div>
              </div>
            </div>

            <div className="card profile-stat-box" onClick={() => navigate('/')}>
              <div className="stat-icon-wrap" style={{ background: '#fce7f3', color: '#be185d' }}>
                📅
              </div>
              <div className="stat-content">
                <div className="stat-val">{loadingData ? '—' : exams.length}</div>
                <div className="stat-name">Scheduled Exams</div>
                <div className="stat-foot">Upcoming tests tracked</div>
              </div>
            </div>
          </div>

          {/* Breakdown & Target Banner */}
          <div className="profile-details-grid">
            {/* Material Types Breakdown */}
            <div className="card profile-sub-card">
              <h4 className="profile-card-heading">🗂️ Study Resource Distribution</h4>
              <p className="profile-card-sub">Categorized count of your saved resources</p>

              <div className="profile-types-list">
                <div className="profile-type-row">
                  <span className="type-info">
                    <span className="type-emoji">▶️</span>
                    <span className="type-title">YouTube Lectures</span>
                  </span>
                  <span className="type-pill badge-youtube">{typeCounts.YOUTUBE}</span>
                </div>

                <div className="profile-type-row">
                  <span className="type-info">
                    <span className="type-emoji">📄</span>
                    <span className="type-title">PDFs &amp; Documents</span>
                  </span>
                  <span className="type-pill badge-pdf">{typeCounts.PDF}</span>
                </div>

                <div className="profile-type-row">
                  <span className="type-info">
                    <span className="type-emoji">✏️</span>
                    <span className="type-title">Personal Notes</span>
                  </span>
                  <span className="type-pill badge-note">{typeCounts.NOTE}</span>
                </div>

                <div className="profile-type-row">
                  <span className="type-info">
                    <span className="type-emoji">🖼️</span>
                    <span className="type-title">Diagrams &amp; Photos</span>
                  </span>
                  <span className="type-pill badge-image">{typeCounts.IMAGE}</span>
                </div>

                <div className="profile-type-row">
                  <span className="type-info">
                    <span className="type-emoji">🔗</span>
                    <span className="type-title">Web &amp; Reference Links</span>
                  </span>
                  <span className="type-pill badge-link">{typeCounts.LINK}</span>
                </div>
              </div>
            </div>

            {/* Academic Target & Next Exam */}
            <div className="card profile-sub-card">
              <h4 className="profile-card-heading">🎯 Academic Focus &amp; Next Exam</h4>
              <p className="profile-card-sub">Your immediate study milestone</p>

              {nextExam ? (
                <div className="profile-next-exam-box">
                  <div className="next-exam-top">
                    <div>
                      <span className="next-exam-label">Next Target Test</span>
                      <h5 className="next-exam-subject">{nextExam.subject}</h5>
                      <div className="next-exam-date">
                        📅 {format(nextExam.dt, 'EEEE, MMMM dd, yyyy')}
                        {nextExam.examTime ? ` at ${nextExam.examTime}` : ''}
                      </div>
                    </div>
                    <div className="next-exam-countdown">
                      <span className="countdown-num">{nextExam.days}</span>
                      <span className="countdown-lbl">{nextExam.days === 1 ? 'day left' : 'days left'}</span>
                    </div>
                  </div>
                  <div className="next-exam-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/revision')}>
                      🎯 Start Revision
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                      View Dashboard →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-empty-exam-box">
                  <span className="empty-exam-icon">🎉</span>
                  <p className="empty-exam-text">No upcoming exams scheduled!</p>
                  <p className="empty-exam-sub">Add exam deadlines on the Dashboard to get countdown alerts.</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                    Go to Dashboard →
                  </button>
                </div>
              )}

              {/* Tag summary */}
              <div className="profile-tags-summary">
                <span className="tags-sum-title">Study Focus Tags:</span>
                <span className="tag tag-important">⭐ {tagCounts.important} Important</span>
                <span className="tag tag-confusing">❓ {tagCounts.confusing} Confusing</span>
                <span className="tag tag-revision">🎯 {tagCounts.revision} Revision</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Two-Column Section: Security + System Info & Danger Zone */}
        <div className="profile-grid">
          {/* Security & Credentials Card */}
          <div className="card profile-card profile-details">
            <div className="profile-card-title-row">
              <div>
                <h3 className="profile-card-heading">🔐 Security &amp; Credentials</h3>
                <p className="profile-card-sub">Update your account username or password</p>
              </div>
              <span className="profile-badge-small">Protected</span>
            </div>

            <form className="profile-form" onSubmit={handleUpdateCredentials}>
              <div className="form-group">
                <label className="profile-label">Username / Account Handle</label>
                <input
                  className="profile-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="profile-label">Current Password (Required for verification)</label>
                <div className="profile-password-row">
                  <input
                    className="profile-input"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="profile-toggle"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {showCurrentPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="profile-label">New Password (Leave blank to keep current)</label>
                <div className="profile-password-row">
                  <input
                    className="profile-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="profile-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="profile-label">Confirm New Password</label>
                <div className="profile-password-row">
                  <input
                    className="profile-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    className="profile-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary profile-save" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                    Saving Changes...
                  </>
                ) : (
                  '✓ Save Credentials'
                )}
              </button>
            </form>
          </div>

          {/* System & Storage Info Card */}
          <div className="card profile-card profile-system-card">
            <h3 className="profile-card-heading">⚙️ Account System &amp; Preferences</h3>
            <p className="profile-card-sub">Infrastructure details and account preferences</p>

            <div className="profile-system-list">
              <div className="system-item">
                <span className="system-icon">🗄️</span>
                <div className="system-info">
                  <div className="system-title">Database Storage</div>
                  <div className="system-sub">PostgreSQL Cloud (Supabase) · High Availability</div>
                </div>
                <span className="system-status-pill">Connected</span>
              </div>

              <div className="system-item">
                <span className="system-icon">☁️</span>
                <div className="system-info">
                  <div className="system-title">Media &amp; Document CDN</div>
                  <div className="system-sub">Cloudinary Cloud Storage · Secure Asset Hosting</div>
                </div>
                <span className="system-status-pill">Active</span>
              </div>

              <div className="system-item">
                <span className="system-icon">🌓</span>
                <div className="system-info">
                  <div className="system-title">Interface Theme</div>
                  <div className="system-sub">Currently set to {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>

              <div className="system-item">
                <span className="system-icon">🛟</span>
                <div className="system-info">
                  <div className="system-title">Support &amp; Feedback</div>
                  <div className="system-sub">Help guides, FAQ, and support assistance</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/support')}>
                  Open Support
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-danger-nested">
              <div className="danger-header">
                <span className="danger-icon">⚠️</span>
                <div>
                  <div className="danger-title">Danger Zone: Reset Vault</div>
                  <p className="danger-sub">
                    Permanently delete all folders, saved resources, flashcards, and exam milestones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger danger-btn"
                onClick={handleDeleteAccount}
                disabled={busy}
              >
                {busy ? 'Erasing...' : '🗑 Delete Vault Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
