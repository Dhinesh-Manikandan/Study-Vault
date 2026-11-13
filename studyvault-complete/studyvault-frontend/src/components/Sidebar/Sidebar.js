import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getFolders } from '../../services/api';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import './Sidebar.css';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [rootFolders, setRootFolders] = useState([]);
  const [expanded, setExpanded] = useState({});

  const DEFAULT_WIDTH = 232;
  const MIN_WIDTH = 180;
  const MAX_WIDTH = 480;

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sv-sidebar-width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch { }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sv-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    try {
      localStorage.setItem('sv-sidebar-width', String(sidebarWidth));
    } catch { }
  }, [sidebarWidth]);

  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
    }
    try {
      localStorage.setItem('sv-sidebar-collapsed', String(isCollapsed));
    } catch { }
  }, [isCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const maxAllowed = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.5));
      const nextWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), maxAllowed);
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const resetWidth = (e) => {
    e.preventDefault();
    setSidebarWidth(DEFAULT_WIDTH);
  };
  const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '🔍', label: 'Search', path: '/search' },
    { icon: '⭐', label: 'Starred', path: '/starred' },
    { icon: '🎯', label: 'Revision', path: '/revision' },
    { icon: '🛟', label: 'Support', path: '/support' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ];

  useEffect(() => {
    getFolders(null).then(setRootFolders).catch(() => { });
  }, []);

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const isActive = (path) => location.pathname === path;

  const initials = (user?.username || user?.email || 'me').slice(0, 2).toUpperCase();

  return (
    <>
      <aside
        className={`sidebar ${isResizing ? 'is-resizing' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}
        style={{ width: `${sidebarWidth}px` }}
      >
      <div className="sidebar-mobile-top">
        <div className="sidebar-logo-text">Study<span>Vault</span></div>
        <div className="sidebar-mobile-actions">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="sidebar-user-trigger" title="Account Menu" />}
            >
              <span className="sidebar-dots">•••</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" style={{ minWidth: '190px' }}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <span>👤</span>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/support')}>
                  <span>🛟</span>
                  <span>Support</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <span>↩</span>
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapse}
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
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
          <div
            className="sidebar-avatar"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            {initials}
          </div>
          <div
            className="sidebar-user-info"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <div className="sidebar-user-name">{user?.username || user?.email?.split('@')[0]}</div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="sidebar-user-trigger" title="Account Menu" />}
            >
              <span className="sidebar-dots">•••</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" style={{ minWidth: '210px' }}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <span>👤</span>
                  <span>Profile &amp; Credentials</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/support')}>
                  <span>🛟</span>
                  <span>Help &amp; Support</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <span>↩</span>
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Drag-to-resize handle */}
      <div
        className={`sidebar-resizer ${isResizing ? 'is-dragging' : ''}`}
        onMouseDown={startResizing}
        onDoubleClick={resetWidth}
        title="Drag to resize sidebar width · Double-click to reset"
      >
        <div className="sidebar-resizer-handle" />
      </div>
    </aside>

    {/* Floating Expand button when sidebar is collapsed */}
    {isCollapsed && (
      <button
        type="button"
        className="sidebar-floating-expand-btn fade-in"
        onClick={toggleCollapse}
        title="Expand sidebar (Ctrl+B)"
        aria-label="Expand sidebar"
      >
        <PanelLeft size={18} />
      </button>
    )}
  </>
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
