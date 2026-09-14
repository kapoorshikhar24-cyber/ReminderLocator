import React from 'react';
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
  Layers
} from 'lucide-react';

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
  nearestReminder,
}) {
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

        {/* Notifications Permission Button */}
        {notificationPermission !== 'granted' && (
          <button
            className="btn btn-secondary"
            onClick={onRequestNotification}
            title="Enable browser push notifications"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Bell size={14} />
            <span className="hide-mobile">Alerts Off</span>
          </button>
        )}

        {/* Sound toggle */}
        <button
          className={`btn-icon ${soundEnabled ? 'active' : ''}`}
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

        {/* Map Provider & API Key Settings */}
        <button
          className="btn-icon"
          onClick={onOpenMapSettings}
          title="Map Provider & API Key Settings"
        >
          <Layers size={18} />
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
