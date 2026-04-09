import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getStoredAuthToken, setStoredAuthToken } from '../services/api';

const AuthContext = createContext({});

const normalizeUser = (user) => ({
  id: user?.id,
  username: user?.username || user?.email || '',
  email: user?.email || user?.username || '',
  displayName: user?.displayName || user?.username || user?.email || '',
  user_metadata: { full_name: user?.displayName || user?.username || user?.email || '' },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(normalizeUser(response.data));
      } catch {
        setStoredAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const signUp = async (username, password) => {
    const response = await api.post('/auth/signup', { username, password });
    const { token, user: createdUser } = response.data;
    setStoredAuthToken(token);
    const normalizedUser = normalizeUser(createdUser);
    setUser(normalizedUser);
    return { data: { user: normalizedUser }, error: null };
  };

  const signIn = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: signedInUser } = response.data;
    setStoredAuthToken(token);
    const normalizedUser = normalizeUser(signedInUser);
    setUser(normalizedUser);
    return { data: { user: normalizedUser }, error: null };
  };

  const signOut = async () => {
    setStoredAuthToken(null);
    setUser(null);
    return { error: null };
  };

  const updateCredentials = async (payload) => {
    const response = await api.patch('/auth/me', payload);
    const { token, user: updatedUser } = response.data;
    if (token) {
      setStoredAuthToken(token);
    }
    const normalizedUser = normalizeUser(updatedUser);
    setUser(normalizedUser);
    return { data: { user: normalizedUser }, error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
