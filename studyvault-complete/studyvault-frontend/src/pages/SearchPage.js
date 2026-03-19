// SearchPage.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import { searchItems } from '../services/api';
import './Search.css';

const TYPE_META = {
  YOUTUBE: { icon: '▶️', cls: 'badge-youtube', label: 'YouTube' },
  PDF:     { icon: '📄', cls: 'badge-pdf',     label: 'PDF'     },
  IMAGE:   { icon: '🖼️', cls: 'badge-image',   label: 'Photo'   },
  LINK:    { icon: '🔗', cls: 'badge-link',    label: 'Link'    },
  NOTE:    { icon: '✏️', cls: 'badge-note',    label: 'Note'    },
};

const FILTERS = ['All', 'YouTube', 'PDF', 'Image', 'Link', 'Note'];

export default function SearchPage() {
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState('All');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]  = useState(false);

  const doSearch = async (q = query, f = filter) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const type = f === 'All' ? null : f.toUpperCase();
      const data = await searchItems(q, type);
      setResults(data);
      setSearched(true);
    } catch { setResults([]); }
    setLoading(false);
  };

  const highlight = (text) => {
    if (!query) return text;
    const re = new RegExp(`(${query})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        <div className="search-page">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 className="search-title">Find anything, <span>instantly</span></h1>
            <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Search across all your semesters, subjects and saved resources
            </p>
          </div>

          <input
            className="search-big"
            type="text"
            placeholder="🔍  Search notes, PDFs, YouTube links..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />

          <div className="filter-row">
            {FILTERS.map(f => (
              <div
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); doSearch(query, f); }}
              >{f}</div>
            ))}
          </div>

          {loading && <div className="empty-state"><div className="spinner" /></div>}

          {!loading && searched && results.length === 0 && (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No results found</h3>
              <p>Try different keywords or check your spelling</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.7rem' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </div>
              <div className="search-results">
                {results.map(item => {
                  const meta = TYPE_META[item.type] || TYPE_META.LINK;
                  return (
                    <div
                      className="search-result card"
                      key={item.id}
                      onClick={() => item.url && window.open(item.url, '_blank')}
                    >
                      <div className="result-icon">{meta.icon}</div>
                      <div>
                        <div className="result-name"
                          dangerouslySetInnerHTML={{ __html: highlight(item.title) }} />
                        <div className="result-path">
                          {item.folderPath} · <span className={`type-badge ${meta.cls}`}>{meta.label}</span>
                          {item.starred && ' · ⭐'}
                        </div>
                        {item.notes && <div className="result-snippet">{item.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!searched && !loading && (
            <div className="empty-state">
              <div className="icon">✨</div>
              <h3>Start searching</h3>
              <p>Type anything — topic name, subject, or keywords from your notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
