import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getFolders, moveFolder } from '../../services/api';

function flattenFolders(nodes, parentPath = '') {
  return nodes.flatMap(node => {
    const path = parentPath ? `${parentPath} › ${node.name}` : node.name;
    return [
      { id: node.id, name: node.name, path, children: node.children || [] },
      ...flattenFolders(node.children || [], path),
    ];
  });
}

function collectDescendantIds(nodes, targetId) {
  const descendantIds = new Set();

  function search(list) {
    for (const item of list) {
      if (item.id === targetId) {
        function addAllChildren(curr) {
          (curr.children || []).forEach(child => {
            descendantIds.add(child.id);
            addAllChildren(child);
          });
        }
        addAllChildren(item);
        return;
      }
      if (item.children && item.children.length > 0) {
        search(item.children);
      }
    }
  }

  search(nodes);
  return descendantIds;
}

export default function MoveFolderModal({ folder, folders = [], onClose, onMoved }) {
  const [tree, setTree] = useState(folders);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (folders && folders.length > 0) {
      setTree(folders);
    } else {
      getFolders(null).then(data => {
        setTree(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [folders]);

  const descendantIds = useMemo(() => {
    return collectDescendantIds(tree, folder?.id);
  }, [tree, folder?.id]);

  const flatList = useMemo(() => {
    return flattenFolders(tree);
  }, [tree]);

  const eligibleDestinations = useMemo(() => {
    return flatList.filter(f => f.id !== folder?.id && !descendantIds.has(f.id));
  }, [flatList, folder?.id, descendantIds]);

  const handleMove = async () => {
    if (!folder?.id) return;
    setMoving(true);
    try {
      const destId = selectedParentId ? Number(selectedParentId) : null;
      await moveFolder(folder.id, destId);
      const targetLabel = destId
        ? eligibleDestinations.find(f => Number(f.id) === destId)?.path || 'folder'
        : 'Root (Top level)';
      toast.success(`Moved "${folder.name}" to ${targetLabel}`);
      onMoved?.(destId);
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to move folder';
      toast.error(message);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Move Folder</h2>
            <p className="modal-sub">
              Select a new parent folder or move to root level
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Moving Folder
          </label>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.55rem 0.75rem',
            background: 'var(--surface2)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>📁</span>
            <span>{folder?.name || 'Folder'}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Destination Location</label>
          <select
            className="form-input"
            value={selectedParentId}
            onChange={e => setSelectedParentId(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option value="">📂 — Root Level (Top Level) —</option>
            {eligibleDestinations.map(dest => (
              <option key={dest.id} value={dest.id}>
                📁 {dest.path}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.67rem', color: 'var(--text3)', marginTop: '0.35rem' }}>
            Note: A folder cannot be moved into itself or into any of its own sub-folders.
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.4rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={moving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleMove} disabled={moving}>
            {moving ? <span className="spinner" /> : '✓ Move Folder'}
          </button>
        </div>
      </div>
    </div>
  );
}

