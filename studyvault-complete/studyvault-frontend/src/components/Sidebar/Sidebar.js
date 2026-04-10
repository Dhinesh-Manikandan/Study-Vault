import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFolders } from '../../services/api';
import './Sidebar.css';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rootFolders, setRootFolders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '🔍', label: 'Search', path: '/search' },
    { icon: '⭐', label: 'Starred', path: '/starred' },
    { icon: '🎯', label: 'Revision', path: '/revision' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ];

  useEffect(() => {
    getFolders(null).then(setRootFolders).catch(() => {});
  }, []);

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const isActive = (path) => location.pathname === path;

  const initials = (user?.username || user?.email || 'me').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-mobile-top">
        <div className="sidebar-logo-text">Study<span>Vault</span></div>
        <div className="sidebar-mobile-actions">
          <button className="sidebar-signout" onClick={() => navigate('/profile')} title="Profile">👤</button>
          <button className="sidebar-signout" onClick={signOut} title="Sign out">↩</button>
        </div>
      </div>

      <div className="sidebar-mobile-nav" role="navigation" aria-label="Mobile navigation">
        {navItems.map(item => (
          <button
            key={item.path}
            type="button"
            className={`sidebar-mobile-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-desktop">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📚</div>
        <div className="sidebar-logo-text">Study<span>Vault</span></div>
      </div>

      {/* Nav */}
      <div className="sidebar-section">
        <div className="sidebar-label">Menu</div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Folders */}
      <div className="sidebar-section sidebar-folders">
        <div className="sidebar-label">Semesters &amp; Folders</div>
        {rootFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            expanded={expanded}
            onToggle={toggleExpand}
            navigate={navigate}
            currentPath={location.pathname}
          />
        ))}
        <div
          className="sidebar-item new-folder"
          onClick={() => navigate('/')}
        >
          <span className="sidebar-item-icon">＋</span>
          New Semester
        </div>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.username || user?.email?.split('@')[0]}</div>
        </div>
        <button className="sidebar-signout" onClick={() => navigate('/profile')} title="Profile">👤</button>
        <button className="sidebar-signout" onClick={signOut} title="Sign out">↩</button>
      </div>
      </div>
    </aside>
  );
}

function FolderNode({ folder, expanded, onToggle, navigate, currentPath, depth = 0 }) {
  const isActive = currentPath === `/folder/${folder.id}`;
  const isExpanded = expanded[folder.id];
  const hasChildren = folder.children?.length > 0;

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => navigate(`/folder/${folder.id}`)}
      >
        <span className="sidebar-item-icon" onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }}>
          {hasChildren ? (isExpanded ? '📂' : '📁') : '📁'}
        </span>
        <span className="sidebar-folder-name">{folder.name}</span>
        {hasChildren && (
          <span className="sidebar-chevron" onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }}>
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
      </div>
      {isExpanded && hasChildren && folder.children.map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          expanded={expanded}
          onToggle={onToggle}
          navigate={navigate}
          currentPath={currentPath}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
