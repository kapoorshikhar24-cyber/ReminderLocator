import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Navigation, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  BellRing, 
  Radio, 
  Layers, 
  ArrowRight,
  Database,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen({ onLoginSuccess }) {
  const { signIn, signUp, isConfigured, updateSupabaseConfig, config } = useAuth();
  
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  
  // Supabase cloud inputs
  const [cloudUrl, setCloudUrl] = useState(config.url || '');
  const [cloudKey, setCloudKey] = useState(config.anonKey || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!userId.trim()) {
          throw new Error('Please enter a User ID or Username.');
        }
        if (userId.trim().length < 3) {
          throw new Error('User ID must be at least 3 characters.');
        }
        if (!password) {
          throw new Error('Please set a password.');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }

        await signUp(userId.trim(), password, displayName.trim());
        setSuccessMsg(`Welcome, ${displayName.trim() || userId.trim()}! Account created successfully.`);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        if (!userId.trim()) {
          throw new Error('Please enter your User ID or Email.');
        }
        if (!password) {
          throw new Error('Please enter your password.');
        }

        await signIn(userId.trim(), password);
        setSuccessMsg('Logged in successfully! Loading your reminders...');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCloudConfig = (e) => {
    e.preventDefault();
    if (!cloudUrl.trim() || !cloudKey.trim()) {
      setErrorMsg('Please provide both Supabase URL and Anon Key.');
      return;
    }
    try {
      updateSupabaseConfig({ url: cloudUrl.trim(), anonKey: cloudKey.trim() });
      setSuccessMsg('Supabase cloud connection saved!');
      setShowCloudConfig(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update cloud configuration.');
    }
  };

  return (
    <div className="auth-screen-container">
      {/* Background Animated Glowing Ambient Orbs */}
      <div className="auth-bg-orb orb-1" />
      <div className="auth-bg-orb orb-2" />
      <div className="auth-bg-orb orb-3" />

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Navigation size={26} className="auth-brand-icon" />
          </div>
          <h1 className="auth-app-title">GeoRemind ✨</h1>
          <p className="auth-app-tagline">
            Smart, location-aware alerts triggered right when you arrive or depart.
          </p>
        </div>

        {/* Tab Switcher: Login vs Set ID / Sign Up */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            <Sparkles size={16} />
            <span>Set ID & Password</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            <User size={16} />
            <span>Log In</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="auth-alert error">
            <span className="auth-alert-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-display-name">
                Full Name / Nickname <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>(Optional)</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  id="auth-display-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Walker"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* User ID / Username Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-user-id">
              {mode === 'signup' ? 'Choose Your User ID or Email' : 'User ID or Email'}
            </label>
            <div className="input-with-icon">
              <span className="input-icon">
                <User size={16} />
              </span>
              <input
                id="auth-user-id"
                type="text"
                className="form-input"
                placeholder={mode === 'signup' ? 'e.g. alex24 or alex@mail.com' : 'Enter your User ID or Email'}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>
            {mode === 'signup' && (
              <span className="input-hint">
                This unique ID will be used to log in to your personal reminders.
              </span>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              {mode === 'signup' ? 'Set Password' : 'Password'}
            </label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Lock size={16} />
              </span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password (min 4 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input for Sign Up */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">
                Confirm Password
              </label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <ShieldCheck size={16} />
                </span>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
            id="btn-auth-submit"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Set ID & Launch App</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Log In to GeoRemind</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Feature Pill Highlights */}
        <div className="auth-features-list">
          <div className="auth-feature-item">
            <MapPin size={14} className="feature-icon" />
            <span>Geofence Detection</span>
          </div>
          <div className="auth-feature-item">
            <BellRing size={14} className="feature-icon" />
            <span>Chimes & Alerts</span>
          </div>
          <div className="auth-feature-item">
            <Radio size={14} className="feature-icon" />
            <span>GPS Tracking</span>
          </div>
        </div>

        {/* Optional Cloud Sync (Supabase) Dropdown */}
        <div className="auth-cloud-section">
          <button
            type="button"
            className="auth-cloud-toggle-btn"
            onClick={() => setShowCloudConfig(!showCloudConfig)}
          >
            <Cloud size={14} />
            <span>Advanced: Cloud Database Sync (Supabase)</span>
            {showCloudConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCloudConfig && (
            <form onSubmit={handleSaveCloudConfig} className="auth-cloud-form">
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Optional: Connect your own Supabase project to automatically sync across all your phones and browsers.
              </p>
              <input
                type="url"
                className="form-input"
                style={{ fontSize: '0.78rem', marginBottom: '6px' }}
                placeholder="https://your-project.supabase.co"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.78rem', marginBottom: '8px' }}
                placeholder="Supabase Anon Public API Key"
                value={cloudKey}
                onChange={(e) => setCloudKey(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.76rem', padding: '6px' }}
              >
                Save Cloud Configuration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
