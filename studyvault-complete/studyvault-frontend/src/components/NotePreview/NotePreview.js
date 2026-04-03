import React, { useMemo, useState } from 'react';
import './NotePreview.css';

export default function NotePreview({ text, className = '', collapsedChars = 220, label = 'Note' }) {
  const [expanded, setExpanded] = useState(false);

  const content = useMemo(() => {
    if (text === null || text === undefined) return '';
    return String(text).trim();
  }, [text]);

  if (!content) return null;

  const isLong = content.length > collapsedChars;
  const preview = expanded || !isLong ? content : `${content.slice(0, collapsedChars).trimEnd()}...`;

  return (
    <div
      className={`note-preview-block ${expanded ? 'expanded' : 'collapsed'} ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        if (isLong) setExpanded(prev => !prev);
      }}
      role={isLong ? 'button' : undefined}
      tabIndex={isLong ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isLong) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(prev => !prev);
        }
      }}
      title={isLong ? `${expanded ? 'Hide' : 'Show'} full ${label.toLowerCase()}` : undefined}
      aria-expanded={isLong ? expanded : undefined}
    >
      <div className="note-preview-text">{preview}</div>
      {isLong && (
        <div className="note-preview-action">
          {expanded ? 'Show less' : 'Click to expand'}
        </div>
      )}
    </div>
  );
}