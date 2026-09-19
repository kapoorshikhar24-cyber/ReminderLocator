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
  loginLocalAccountById,
  logoutLocalAccount,
  createGuestSession,
  getStoredAccounts
} from '../services/localAuth';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getBiometricTypeName,
  isBiometricEnrolled,
  getEnrolledBiometric,
  setBiometricEnabled,
  removeBiometricCredential,
  registerBiometric,
  verifyBiometric,
  getRegisteredBiometrics
} from '../services/biometrics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredActiveUser() || createGuestSession());
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(() => getBiometricTypeName());
  const [pendingBiometricPrompt, setPendingBiometricPrompt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const supabase = getSupabase();

        if (supabase) {
          try {
            const { data } = await supabase.auth.getSession();
            const currentSession = data?.session;
            if (currentSession?.user && isMounted) {
              setSession(currentSession);
              setUser({
                ...currentSession.user,
                userId: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
                displayName: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
                isLocal: false,
              });
              return;
            }
          } catch (cloudErr) {
            console.warn('Supabase getSession failed, using local session:', cloudErr);
          }
        }

        // Local stored user fallback
        const localActive = getStoredActiveUser();
        if (localActive && isMounted) {
          setUser(localActive);
        } else if (isMounted) {
          // Always ensure an active user session exists so app opens immediately
          const guestUser = createGuestSession();
          setUser(guestUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          try {
            const supported = isWebAuthnSupported();
            const platformReady = supported ? await isPlatformAuthenticatorAvailable() : false;
            setBiometricAvailable(supported);
            setBiometricType(getBiometricTypeName());
          } catch (bioErr) {
            console.warn('Biometric detection error:', bioErr);
          }
        }
      }
    };

    initAuth();

    // Listen for cloud auth state changes if configured
    let subscription = null;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (!isMounted) return;
          if (currentSession?.user) {
            setSession(currentSession);
            setUser({
              ...currentSession.user,
              userId: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
              displayName: currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0],
              isLocal: false,
            });
          }
        });
        subscription = data?.subscription;
      } catch (e) {
        console.warn('Could not attach onAuthStateChange listener:', e);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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
        console.warn('Cloud signup error, falling back to local registration:', err);
      }
    }

    // Register local account (strict: does not auto-login if account already exists)
    const localUser = await registerLocalAccount({
      userId: identifier,
      password,
      displayName,
    });
    setUser(localUser);
    if (biometricAvailable && !isBiometricEnrolled(localUser.userId)) {
      setPendingBiometricPrompt({
        userId: localUser.userId,
        displayName: localUser.displayName || localUser.userId,
      });
    }
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
          if (biometricAvailable && !isBiometricEnrolled(userObj.userId)) {
            setPendingBiometricPrompt({
              userId: userObj.userId,
              displayName: userObj.displayName || userObj.userId,
            });
          }
          return data;
        }
      } catch (err) {
        console.warn('Cloud login attempt failed, falling back to local account check:', err);
      }
    }

    // Local login (strict: does not auto-create account on failed login)
    const localUser = await loginLocalAccount({
      userId: identifier,
      password,
    });
    setUser(localUser);
    if (biometricAvailable && !isBiometricEnrolled(localUser.userId)) {
      setPendingBiometricPrompt({
        userId: localUser.userId,
        displayName: localUser.displayName || localUser.userId,
      });
    }
    return { user: localUser };
  };

  const signInWithBiometrics = async (targetUserId = null) => {
    setLoading(true);
    try {
      const assertion = await verifyBiometric(targetUserId);
      if (!assertion || !assertion.userId) {
        throw new Error('Biometric verification failed.');
      }
      const localUser = loginLocalAccountById(assertion.userId);
      setUser(localUser);
      return { user: localUser, biometric: assertion };
    } finally {
      setLoading(false);
    }
  };

  const registerBiometricsForUser = async (userId, displayName) => {
    const cred = await registerBiometric({ userId, displayName });
    setPendingBiometricPrompt(null);
    return cred;
  };

  const toggleBiometrics = (userId, enabled) => {
    setBiometricEnabled(userId, enabled);
  };

  const removeBiometrics = (userId) => {
    removeBiometricCredential(userId);
  };

  const dismissBiometricPrompt = () => {
    setPendingBiometricPrompt(null);
  };

  const continueAsGuest = () => {
    const guestUser = createGuestSession();
    setUser(guestUser);
    return guestUser;
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Signout cloud error:', e);
    }
    logoutLocalAccount();
    const guestUser = createGuestSession();
    setUser(guestUser);
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
    biometricAvailable,
    biometricType,
    pendingBiometricPrompt,
    signIn,
    signUp,
    signInWithBiometrics,
    registerBiometricsForUser,
    toggleBiometrics,
    removeBiometrics,
    dismissBiometricPrompt,
    isBiometricEnrolled,
    getEnrolledBiometric,
    getRegisteredBiometrics,
    continueAsGuest,
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
