import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getSupabase, 
  isSupabaseConfigured, 
  getSupabaseConfig, 
  saveSupabaseConfig as persistSupabaseConfig,
  signUpWithEmail, 
  signInWithEmail, 
  signOutUser, 
  resetUserPassword 
} from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signUp = async (email, password, displayName) => {
    const data = await signUpWithEmail(email, password, displayName);
    return data;
  };

  const signIn = async (email, password) => {
    const data = await signInWithEmail(email, password);
    return data;
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email) => {
    return await resetUserPassword(email);
  };

  const updateSupabaseConfig = ({ url, anonKey }) => {
    persistSupabaseConfig({ url, anonKey });
    setIsConfigured(isSupabaseConfigured());
  };

  const value = {
    user,
    session,
    loading,
    isConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateSupabaseConfig,
    config: getSupabaseConfig(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
