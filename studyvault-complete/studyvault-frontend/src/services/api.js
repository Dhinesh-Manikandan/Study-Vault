import axios from 'axios';

const authTokenKey = 'studyvault.auth.token';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

export const getStoredAuthToken = () =>
  window.sessionStorage.getItem(authTokenKey);

export const setStoredAuthToken = (token) => {
  if (token) {
    window.sessionStorage.setItem(authTokenKey, token);
  } else {
    window.sessionStorage.removeItem(authTokenKey);
  }
};

api.interceptors.request.use(async (config) => {
  config.headers = {
    ...config.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if ((config.method || '').toLowerCase() === 'get') {
    config.params = {
      ...(config.params || {}),
      _ts: Date.now(),
    };
  }

  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Folders ──────────────────────────────────────────
export const getFolders = (parentId = null) =>
  api.get('/folders', {
    params: parentId == null ? {} : { parentId },
  }).then(r => r.data);

export const createFolder = (data) =>
  api.post('/folders', data).then(r => r.data);

export const updateFolder = (id, data) =>
  api.put(`/folders/${id}`, data).then(r => r.data);

export const deleteFolder = (id) =>
  api.delete(`/folders/${id}`);

// ── Items ─────────────────────────────────────────────
export const getItems = (folderId) =>
  api.get('/items', {
    params: { folderId: Number(folderId) },
  }).then(r => r.data);

export const getRecentItems = () =>
  api.get('/items/recent').then(r => r.data);

export const getStarredItems = () =>
  api.get('/items/starred').then(r => r.data);

export const getRevisionItems = () =>
  api.get('/items/revision').then(r => r.data);

export const createItem = (data) =>
  api.post('/items', data).then(r => r.data);

export const uploadItem = (formData) =>
  api.post('/items/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

export const updateItem = (id, data) =>
  api.put(`/items/${id}`, data).then(r => r.data);

export const deleteItem = (id) =>
  api.delete(`/items/${id}`);

export const toggleStar = (id) =>
  api.patch(`/items/${id}/star`).then(r => r.data);

export const updateItemTags = (id, tags) =>
  api.patch(`/items/${id}/tags`, { tags }).then(r => r.data);

export const updateFolderRevision = (folderId, enabled) =>
  api.patch(`/items/folders/${folderId}/revision`, { enabled }).then(r => r.data);

export const openItemFile = async (id) => {
  const response = await api.get(`/items/${id}/download`, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(response.data);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const openNoteItem = (item) => {
  const noteBody = item?.content || item?.notes || 'No note content available.';
  const noteWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!noteWindow) {
    return;
  }

  const safeTitle = escapeHtml(item?.title || 'Note');
  const safeBody = escapeHtml(noteBody).replace(/\n/g, '<br>');
  noteWindow.document.open();
  noteWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeTitle}</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #fffdf7;
            --panel: #fff7e6;
            --text: #1f2937;
            --muted: #6b7280;
            --accent: #d97706;
            --border: #f3d08a;
          }
          body {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            background: linear-gradient(180deg, #fffaf0 0%, #fffdf7 100%);
            color: var(--text);
          }
          .wrap {
            max-width: 860px;
            margin: 0 auto;
            padding: 28px 20px 40px;
          }
          .card {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--border);
            border-radius: 18px;
            box-shadow: 0 18px 45px rgba(180, 120, 20, 0.12);
            padding: 28px;
          }
          .eyebrow {
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--accent);
            font-weight: 700;
            margin-bottom: 10px;
          }
          h1 {
            margin: 0 0 18px;
            font-size: clamp(1.8rem, 4vw, 2.7rem);
            line-height: 1.15;
          }
          .note-body {
            font-size: clamp(1.08rem, 2vw, 1.32rem);
            line-height: 1.8;
            white-space: normal;
            word-break: break-word;
          }
          .meta {
            margin-top: 18px;
            font-size: 0.82rem;
            color: var(--muted);
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="eyebrow">Note</div>
            <h1>${safeTitle}</h1>
            <div class="note-body">${safeBody}</div>
            <div class="meta">Open notes are rendered larger for easier reading.</div>
          </div>
        </div>
      </body>
    </html>
  `);
  noteWindow.document.close();
};

// ── Search ────────────────────────────────────────────
export const searchItems = (query = '', type = null, tag = null) =>
  api.get('/items/search', { params: { q: query, type, tag } }).then(r => r.data);

// ── Exams ─────────────────────────────────────────────
export const getExams = () =>
  api.get('/exams').then(r => r.data);

export const createExam = (data) =>
  api.post('/exams', data).then(r => r.data);

export const deleteExam = (id) =>
  api.delete(`/exams/${id}`);

export const updateCredentials = (payload) =>
  api.patch('/auth/me', payload).then(r => r.data);

export const deleteAccountData = () =>
  api.delete('/account').then(r => r.data);

// ── Stats ─────────────────────────────────────────────
export const getStats = () =>
  api.get('/stats').then(r => r.data);

export default api;
