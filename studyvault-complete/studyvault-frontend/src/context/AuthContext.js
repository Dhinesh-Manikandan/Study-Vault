import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});
const devBypassAuth = process.env.REACT_APP_DEV_BYPASS_AUTH === 'true';
const devUserId = process.env.REACT_APP_DEV_USER_ID || 'dev-user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (devBypassAuth) {
      setUser({ id: devUserId, email: `${devUserId}@local.dev` });
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password) =>
    devBypassAuth
      ? Promise.resolve({ data: { user: { id: devUserId, email } }, error: null })
      : supabase.auth.signUp({ email, password });

  const signIn = (email, password) =>
    devBypassAuth
      ? Promise.resolve({ data: { user: { id: devUserId, email } }, error: null })
      : supabase.auth.signInWithPassword({ email, password });

  const signOut = () =>
    devBypassAuth
      ? Promise.resolve({ error: null })
      : supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
