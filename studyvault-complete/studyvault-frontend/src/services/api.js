import axios from 'axios';
import { supabase } from './supabase';

const devBypassAuth = process.env.REACT_APP_DEV_BYPASS_AUTH === 'true';
const devUserId = process.env.REACT_APP_DEV_USER_ID || 'dev-user';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

// Attach JWT token from Supabase to every request
api.interceptors.request.use(async (config) => {
  if (devBypassAuth) {
    config.headers.Authorization = `Bearer dev-bypass:${devUserId}`;
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ── Folders ──────────────────────────────────────────
export const getFolders = (parentId = null) =>
  api.get('/folders', { params: { parentId } }).then(r => r.data);

export const createFolder = (data) =>
  api.post('/folders', data).then(r => r.data);

export const updateFolder = (id, data) =>
  api.put(`/folders/${id}`, data).then(r => r.data);

export const deleteFolder = (id) =>
  api.delete(`/folders/${id}`);

// ── Items ─────────────────────────────────────────────
export const getItems = (folderId) =>
  api.get('/items', { params: { folderId } }).then(r => r.data);

export const getRecentItems = () =>
  api.get('/items/recent').then(r => r.data);

export const getStarredItems = () =>
  api.get('/items/starred').then(r => r.data);

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

// ── Search ────────────────────────────────────────────
export const searchItems = (query, type = null) =>
  api.get('/items/search', { params: { q: query, type } }).then(r => r.data);

// ── Exams ─────────────────────────────────────────────
export const getExams = () =>
  api.get('/exams').then(r => r.data);

export const createExam = (data) =>
  api.post('/exams', data).then(r => r.data);

export const deleteExam = (id) =>
  api.delete(`/exams/${id}`);

// ── Stats ─────────────────────────────────────────────
export const getStats = () =>
  api.get('/stats').then(r => r.data);

export default api;
