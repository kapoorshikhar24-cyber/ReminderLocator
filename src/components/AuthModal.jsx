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
  Database
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
    config 
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
                {user ? user.email : 'Sync Google API Key & reminders across all devices'}
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
                  • <b>Google Maps API Key:</b>{' '}
                  {googleApiKey ? (
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      ✓ Synced ({googleApiKey.slice(0, 8)}...{googleApiKey.slice(-4)})
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-amber)' }}>Not set yet</span>
                  )}
                </p>
                <p>
                  • <b>Cross-Device Status:</b> Whenever you log in from your mobile phone or laptop, your Google API Key and saved reminders are fetched automatically!
                </p>
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
                <b>Never re-enter your API key!</b> Set it once on any device, and your phone will sync it automatically when you log in.
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
                        minLength={6}
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
