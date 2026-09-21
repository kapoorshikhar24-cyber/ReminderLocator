import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  Check, 
  LogOut, 
  ShieldCheck, 
  Cloud, 
  RefreshCw, 
  Key, 
  ExternalLink,
  AlertCircle,
  Database,
  Fingerprint,
  ScanFace
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  googleApiKey, 
  isSynced,
  onForceSync 
}) {
  const { 
    user, 
    isConfigured, 
    signIn, 
    signUp, 
    signOut, 
    resetPassword, 
    updateSupabaseConfig, 
    config,
    biometricAvailable,
    biometricType,
    signInWithBiometrics,
    registerBiometricsForUser,
    toggleBiometrics,
    removeBiometrics,
    isBiometricEnrolled,
    getEnrolledBiometric,
    getRegisteredBiometrics
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset', 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Custom Supabase config inputs
  const [customUrl, setCustomUrl] = useState(config.url || '');
  const [customKey, setCustomKey] = useState(config.anonKey || '');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (!isConfigured && mode !== 'config') {
        setMode('config');
        setErrorMsg('Please connect your Supabase Project first before logging in.');
        setIsSubmitting(false);
        return;
      }

      if (mode === 'login') {
        await signIn(email, password);
        setSuccessMsg('Successfully logged in! Synchronizing your data...');
        setTimeout(() => onClose(), 1200);
      } else if (mode === 'signup') {
        await signUp(email, password, displayName);
        setSuccessMsg('Account created! Please check your email for confirmation link if email confirmations are enabled in your Supabase project, or log in now.');
        setMode('login');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg('Both Supabase URL and Anon Key are required.');
      return;
    }

    try {
      updateSupabaseConfig({ url: customUrl.trim(), anonKey: customKey.trim() });
      setSuccessMsg('Supabase connected successfully! You can now log in or create an account.');
      setMode('login');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to Supabase.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const currentUserId = user?.userId || user?.email;
  const enrolled = currentUserId ? isBiometricEnrolled(currentUserId) : false;
  const enrolledList = getRegisteredBiometrics().filter((b) => b.enabled);
  const isFaceType = (biometricType || '').toLowerCase().includes('face');
  const BiometricIcon = isFaceType ? ScanFace : Fingerprint;

  const handleBiometricLoginInModal = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await signInWithBiometrics();
      setSuccessMsg(`Logged in via ${biometricType}!`);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.warn('Biometric modal login failed:', err);
      setErrorMsg(err.message || 'Biometric verification failed. Please log in with your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBiometrics = (enable) => {
    if (!currentUserId) return;
    toggleBiometrics(currentUserId, enable);
    setSuccessMsg(enable ? `${biometricType} enabled!` : `${biometricType} disabled.`);
  };

  const handleEnrollBiometrics = async () => {
    if (!currentUserId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await registerBiometricsForUser(currentUserId, user.displayName || currentUserId);
      setSuccessMsg(`Successfully enrolled ${biometricType}!`);
    } catch (err) {
      console.warn('Enrollment error:', err);
      setErrorMsg(err.message || 'Could not register biometrics.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBiometrics = () => {
    if (!currentUserId) return;
    removeBiometrics(currentUserId);
    setSuccessMsg('Biometric credentials removed from this device.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
                {user ? 'My Account & Sync' : 'User Account & Cloud Sync'}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user ? user.email : 'Sync active reminders & preferences across all devices'}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ALREADY LOGGED IN VIEW */}
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.12))',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#34d399" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Logged in as {user.user_metadata?.display_name || user.email.split('@')[0]}
                  </span>
                </div>
                <span
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p>• <b>Account Email:</b> {user.email}</p>
                <p>
                  • <b>Map Configuration:</b>{' '}
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    OpenStreetMap (Default Free Mode)
                  </span>
                </p>
                <p>
                  • <b>Cross-Device Status:</b> Whenever you log in from your mobile phone or laptop, your saved reminders and preferences are fetched automatically!
                </p>
              </div>
            </div>

            {/* Biometric Security Card */}
            <div
              style={{
                background: 'var(--bg-surface-elevated, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BiometricIcon size={18} style={{ color: '#f472b6' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {biometricType}
                  </span>
                </div>
                {enrolled ? (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 750,
                    }}
                  >
                    ACTIVE
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(148, 163, 184, 0.12)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    NOT ENROLLED
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {enrolled 
                  ? `Biometric authentication is active for this account on this device. Your biometrics stay safely in your operating system.`
                  : `Enable fast, secure biometric sign-in using ${biometricType} on this device.`}
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {enrolled ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px', flex: 1 }}
                      onClick={() => handleToggleBiometrics(false)}
                    >
                      Disable Biometric Login
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={handleRemoveBiometrics}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '8px 14px',
                      width: '100%',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))',
                      borderColor: 'rgba(236, 72, 153, 0.4)',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    onClick={handleEnrollBiometrics}
                    disabled={isSubmitting}
                  >
                    <BiometricIcon size={15} color="#f472b6" />
                    <span>Enable {biometricType} on this Device</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {onForceSync && (
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px', fontSize: '0.82rem' }}
                  onClick={onForceSync}
                >
                  <RefreshCw size={14} />
                  <span>Force Sync Now</span>
                </button>
              )}

              <button
                className="btn btn-secondary"
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  fontSize: '0.82rem',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171' 
                }}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGGED OUT: LOGIN / SIGNUP / CONFIG FORM */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Tab switch */}
            <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Create Account
              </button>
              <button
                type="button"
                className={`tab-btn ${mode === 'config' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
                onClick={() => { setMode('config'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <Database size={13} />
                <span>Supabase</span>
              </button>
            </div>

            {/* Explanatory benefit pill */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} color="var(--color-pink)" style={{ flexShrink: 0 }} />
              <span>
                <b>Cross-Device Cloud Sync:</b> Sign in to synchronize your active geofenced reminders, preferences, and custom spots seamlessly across all your devices.
              </span>
            </div>

            {/* Error or Success feedback banners */}
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB: LOGIN / SIGNUP / RESET */}
            {mode === 'login' && (biometricAvailable || enrolledList.length > 0) && (
              <div style={{ marginBottom: '4px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleBiometricLoginInModal}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 750,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(236, 72, 153, 0.18))',
                    border: '1.5px solid rgba(236, 72, 153, 0.4)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 2px 10px rgba(236, 72, 153, 0.15)',
                    cursor: 'pointer',
                  }}
                >
                  <BiometricIcon size={18} color="#f472b6" className={isSubmitting ? 'pulse-anim' : ''} />
                  <span>Sign in with {biometricType}</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', opacity: 0.5 }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>OR ENTER EMAIL & PASSWORD</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                </div>
              </div>
            )}

            {mode !== 'config' ? (
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Display Name / Nickname</label>
                    <div className="search-input-wrap">
                      <User size={16} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="e.g. Alex"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div className="search-input-wrap">
                    <Mail size={16} className="search-icon" />
                    <input
                      type="email"
                      className="search-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div className="search-input-wrap">
                      <Lock size={16} className="search-icon" />
                      <input
                        type="password"
                        className="search-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {mode === 'login' ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setMode('reset')}
                    >
                      Forgot Password?
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setMode('login')}
                    >
                      Back to Log In
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}
                  disabled={isSubmitting}
                >
                  <Sparkles size={16} />
                  <span>
                    {isSubmitting ? 'Processing...' : mode === 'signup' ? 'Create Account ✨' : mode === 'reset' ? 'Send Reset Email' : 'Log In & Sync ✨'}
                  </span>
                </button>
              </form>
            ) : (
              /* TAB: SUPABASE CONFIGURATION */
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Enter your free <b>Supabase Project URL</b> and <b>Anon Public Key</b> (from Supabase Dashboard ➔ Project Settings ➔ API).
                </div>

                <div className="form-group">
                  <label className="form-label">Project URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://xyzcompany.supabase.co"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Anon Public Key *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--color-brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink size={12} />
                  </a>

                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.84rem' }}>
                    <Check size={14} />
                    <span>Save Connection</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
