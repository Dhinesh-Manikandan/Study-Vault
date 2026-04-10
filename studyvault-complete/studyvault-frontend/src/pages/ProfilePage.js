import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import { deleteAccountData } from '../services/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, signOut, updateCredentials } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const displayName = user?.username || user?.displayName || user?.email || 'User';

  useEffect(() => {
    setUsername(user?.username || user?.displayName || user?.email || '');
  }, [user]);

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
      toast.success('Credentials updated');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update credentials';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm('Delete this account data and all saved folders, items, exams, and notes?');
    if (!firstConfirm) return;

    const typed = window.prompt('Type DELETE to confirm');
    if (typed !== 'DELETE') return;

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
        <div className="profile-header">
          <div>
            <h1 className="profile-title">Profile</h1>
            <p className="profile-sub">Only your account details and controls</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="card profile-card">
            <div className="profile-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
            <div className="profile-name">{displayName}</div>
            <div className="profile-email">{user?.username || 'No username'}</div>
            <button className="btn btn-ghost profile-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>

          <div className="card profile-card profile-details">
            <div className="profile-section-title">Edit Credentials</div>
            <form className="profile-form" onSubmit={handleUpdateCredentials}>
              <label className="profile-label">Username</label>
              <input
                className="profile-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <label className="profile-label">Current Password</label>
              <div className="profile-password-row">
                <input
                  className="profile-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
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

              <label className="profile-label">New Password (optional)</label>
              <div className="profile-password-row">
                <input
                  className="profile-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  className="profile-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <label className="profile-label">Confirm New Password</label>
              <div className="profile-password-row">
                <input
                  className="profile-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm only if changing password"
                />
                <button
                  type="button"
                  className="profile-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <button className="btn btn-primary profile-save" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
            </form>
          </div>

          <div className="card profile-card profile-danger">
            <div className="profile-section-title">Danger Zone</div>
            <p className="profile-danger-text">
              Delete all folders, items, exams, and notes for this account.
            </p>
            <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={busy}>
              {busy ? 'Deleting...' : 'Delete Account Data'}
            </button>
          </div>

          <div className="card profile-card profile-support">
            <div className="profile-section-title">Support</div>
            <p className="profile-support-text">
              For feedback, suggestions, feature changes, error reporting, or forgot credentials,
              contact
              {' '}
              <a href="mailto:support.dhinesh@gmail.com">support.dhinesh@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}