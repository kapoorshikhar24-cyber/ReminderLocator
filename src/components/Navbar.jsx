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
  Zap,
  LogOut
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
  onLogout,
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

  const displayName = user?.displayName || user?.userId || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Account';

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

        {/* Pocket / Travel Active Tracking Mode */}
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

        {/* Notifications Permission Button */}
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

        {/* Sound toggle */}
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
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Preferences & Settings */}
        <button
          className="btn-icon hide-mobile"
          onClick={onOpenMapSettings}
          title="Preferences & Settings (Maps, Battery GPS, Sounds)"
        >
          <Sliders size={18} />
        </button>

        {/* User Profile Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{
                padding: '5px 11px',
                fontSize: '0.76rem',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))',
                borderColor: 'rgba(236, 72, 153, 0.4)',
                color: '#f472b6',
                fontWeight: 700,
              }}
              onClick={onOpenAuth}
              title={`Logged in as ${displayName}. Click to manage settings & sync`}
            >
              <User size={14} />
              <span className="hide-mobile">@{displayName}</span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#34d399',
                  boxShadow: '0 0 6px #34d399',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Direct Log Out Button */}
            <button
              className="btn-icon"
              onClick={onLogout}
              title="Log Out of GeoRemind"
              style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* Add Reminder Button */}
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
