import React, { useState } from 'react';
import { 
  Navigation, 
  Bell, 
  BellRing, 
  Plus, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Radio, 
  Compass,
  Layers,
  Sliders,
  User,
  Zap
} from 'lucide-react';
import { requestScreenWakeLock, releaseScreenWakeLock, isWakeLockActive } from '../services/nativeLocation';

export default function Navbar({
  userPos,
  isSimulating,
  setIsSimulating,
  notificationPermission,
  onRequestNotification,
  soundEnabled,
  setSoundEnabled,
  theme,
  setTheme,
  onOpenNewModal,
  onOpenMapSettings,
  onOpenAuth,
  user,
  nearestReminder,
}) {
  const [travelMode, setTravelMode] = useState(false);

  const handleToggleTravelMode = async () => {
    if (!travelMode) {
      await requestScreenWakeLock();
      setTravelMode(true);
    } else {
      await releaseScreenWakeLock();
      setTravelMode(false);
    }
  };

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon-wrap">
          <Navigation size={20} />
        </div>
        <div className="brand-text">
          <span className="brand-title">GeoRemind ✨</span>
          <span className="brand-subtitle hide-mobile">Smart & Cozy Location Notes</span>
        </div>
      </div>

      <div className="nav-actions">
        {/* GPS Live / Simulated Status Badge */}
        <button
          className={`status-badge ${isSimulating ? 'simulated' : 'active'}`}
          onClick={() => setIsSimulating(!isSimulating)}
          title="Click to toggle between Live GPS and Desktop Simulator"
        >
          <span className="pulse-dot" />
          {isSimulating ? (
            <>
              <Compass size={13} />
              <span className="hide-mobile">🎮 Simulator Active</span>
              <span className="show-mobile-only">Sim</span>
            </>
          ) : (
            <>
              <Radio size={13} />
              <span className="hide-mobile">✨ GPS Live</span>
              <span className="show-mobile-only">Live</span>
            </>
          )}
        </button>

        {/* Pocket / Travel Active Tracking Mode (Desktop quick button, mobile uses Travel Mode in Settings) */}
        <button
          className={`btn-icon hide-mobile ${travelMode ? 'active' : ''}`}
          onClick={handleToggleTravelMode}
          title={travelMode ? 'Travel / Pocket Mode: ACTIVE (Keeps GPS tracking live in pocket)' : 'Turn on Travel Mode (Keeps GPS live without sleep)'}
          style={{ 
            color: travelMode ? '#fbbf24' : undefined, 
            borderColor: travelMode ? 'rgba(251, 191, 36, 0.5)' : undefined,
            background: travelMode ? 'rgba(251, 191, 36, 0.15)' : undefined,
          }}
        >
          <Zap size={16} />
        </button>

        {/* Notifications Permission Button (Desktop only; on mobile native permission is requested automatically or in Settings) */}
        {notificationPermission !== 'granted' && (
          <button
            className="btn btn-secondary hide-mobile"
            onClick={onRequestNotification}
            title="Enable browser push notifications"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Bell size={14} />
            <span>Alerts Off</span>
          </button>
        )}

        {/* Sound toggle (Desktop quick toggle, mobile uses Settings) */}
        <button
          className={`btn-icon hide-mobile ${soundEnabled ? 'active' : ''}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Theme toggle */}
        <button
          className="btn-icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Preferences & Settings (Maps, Battery, Sounds) */}
        <button
          className="btn-icon"
          onClick={onOpenMapSettings}
          title="Preferences & Settings (Maps, Battery GPS, Sounds)"
        >
          <Sliders size={18} />
        </button>

        {/* User Account & Cloud Sync */}
        <button
          className="btn btn-secondary"
          style={{
            padding: '5px 10px',
            fontSize: '0.78rem',
            gap: '6px',
            background: user
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))'
              : undefined,
            borderColor: user ? 'rgba(236, 72, 153, 0.4)' : undefined,
            color: user ? '#f472b6' : undefined,
          }}
          onClick={onOpenAuth}
          title={
            user
              ? `Logged in as ${user.email}. Google API Key & reminders are synchronized!`
              : 'Log In or Sign Up to sync your Google API Key across all your devices'
          }
        >
          <User size={14} />
          <span className="hide-mobile">
            {user ? (user.user_metadata?.display_name || user.email.split('@')[0]) : 'Sync Account'}
          </span>
          {user && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 6px #34d399',
              }}
            />
          )}
        </button>

        {/* Add Reminder Button (Desktop only, mobile uses bottom tab bar) */}
        <button 
          className="btn btn-primary hide-mobile"
          onClick={onOpenNewModal}
          id="btn-add-reminder"
        >
          <Plus size={16} />
          <span>New Reminder</span>
        </button>
      </div>
    </header>
  );
}
