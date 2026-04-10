import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FolderView from './pages/FolderView';
import SearchPage from './pages/SearchPage';
import RevisionPage from './pages/RevisionPage';
import StarredPage from './pages/StarredPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const location = useLocation();

  return (
    <Routes key={location.pathname}>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/folder/:id" element={<ProtectedRoute><FolderView /></ProtectedRoute>} />
      <Route path="/search"   element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/revision" element={<ProtectedRoute><RevisionPage /></ProtectedRoute>} />
      <Route path="/starred"  element={<ProtectedRoute><StarredPage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '13px',
              borderRadius: '10px',
              border: '1px solid #e8e5e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
