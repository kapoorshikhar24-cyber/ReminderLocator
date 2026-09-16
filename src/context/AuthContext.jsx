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
import {
  getStoredActiveUser,
  persistActiveUser,
  registerLocalAccount,
  loginLocalAccount,
  logoutLocalAccount,
  getStoredAccounts
} from '../services/localAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();

    if (supabase) {
      // Check active Supabase cloud session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser({
            ...currentSession.user,
            userId: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
            displayName: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
            isLocal: false,
          });
          setLoading(false);
          return;
        }

        // Fallback to local session if no cloud session
        const localActive = getStoredActiveUser();
        if (localActive) {
          setUser(localActive);
        }
        setLoading(false);
      });

      // Listen for cloud auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser({
            ...currentSession.user,
            userId: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
            displayName: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
            isLocal: false,
          });
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // No Supabase, check local stored user
      const localActive = getStoredActiveUser();
      if (localActive) {
        setUser(localActive);
      }
      setLoading(false);
    }
  }, [isConfigured]);

  const signUp = async (identifier, password, displayName) => {
    // If Supabase is configured and identifier is an email, attempt cloud signup
    if (isConfigured && identifier.includes('@')) {
      try {
        const data = await signUpWithEmail(identifier, password, displayName);
        if (data?.user) {
          const userObj = {
            ...data.user,
            userId: displayName || identifier.split('@')[0],
            displayName: displayName || identifier.split('@')[0],
            isLocal: false,
          };
          setUser(userObj);
          return data;
        }
      } catch (err) {
        console.warn('Cloud signup error, trying local registration:', err);
      }
    }

    // Register local account
    const localUser = registerLocalAccount({
      userId: identifier,
      password,
      displayName,
    });
    setUser(localUser);
    return { user: localUser };
  };

  const signIn = async (identifier, password) => {
    // If Supabase is configured and identifier is an email
    if (isConfigured && identifier.includes('@')) {
      try {
        const data = await signInWithEmail(identifier, password);
        if (data?.user) {
          const userObj = {
            ...data.user,
            userId: data.user.user_metadata?.display_name || data.user.email?.split('@')[0],
            displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0],
            isLocal: false,
          };
          setUser(userObj);
          return data;
        }
      } catch (err) {
        console.warn('Cloud login attempt failed, falling back to local account check:', err);
      }
    }

    // Local login
    const localUser = loginLocalAccount({
      userId: identifier,
      password,
    });
    setUser(localUser);
    return { user: localUser };
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Signout cloud error:', e);
    }
    logoutLocalAccount();
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
    getStoredAccounts,
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
