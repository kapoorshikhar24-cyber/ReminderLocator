import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Key, 
  Check, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Battery, 
  Volume2, 
  Play, 
  Zap,
  Sliders,
  Compass
} from 'lucide-react';
import { MAP_PROVIDERS } from '../services/mapProviders';
import { BATTERY_MODES } from '../services/nativeLocation';
import { SOUND_PROFILES, playSoundPreview } from '../services/notifications';

export default function MapSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  settings,
  onSaveSettings,
}) {
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'battery', 'sound'

  // Map settings
  const [providerId, setProviderId] = useState(currentConfig?.providerId || 'osm');
  const [googleApiKey, setGoogleApiKey] = useState(currentConfig?.googleApiKey || '');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [customUrl, setCustomUrl] = useState(currentConfig?.customUrl || '');

  // Battery & Tracking settings
  const [batteryMode, setBatteryMode] = useState(settings?.batteryMode || 'balanced');

  // Sound settings
  const [soundProfile, setSoundProfile] = useState(settings?.soundProfile || 'crystal');
  const [soundEnabled, setSoundEnabled] = useState(settings?.soundEnabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings?.vibrationEnabled ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let resolvedProvider = providerId;
    if (providerId === 'google' && !googleApiKey.trim()) {
      resolvedProvider = 'osm';
    }

    onSaveConfig?.({
      providerId: resolvedProvider,
      googleApiKey: googleApiKey.trim(),
      apiKey: apiKey.trim(),
      customUrl: customUrl.trim(),
    });

    onSaveSettings?.({
      ...settings,
      batteryMode,
      soundProfile,
      soundEnabled,
      vibrationEnabled,
    });

    onClose();
  };

  const handleSelectFreeMode = () => {
    setProviderId('osm');
  };

  const handleSelectGoogleMode = () => {
    setProviderId('google');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--color-brand)" />
            <h2 className="modal-title">Preferences & Settings</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Setting Navigation Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            borderBottom: '1px solid var(--border-subtle)', 
            paddingBottom: '12px', 
            marginBottom: '16px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
            style={{ flex: '1 0 auto', padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Layers size={14} />
            <span>Map Provider</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'battery' ? 'active' : ''}`}
            onClick={() => setActiveTab('battery')}
            style={{ flex: '1 0 auto', padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Battery size={14} />
            <span>Battery & GPS</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sound' ? 'active' : ''}`}
            onClick={() => setActiveTab('sound')}
            style={{ flex: '1 0 auto', padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Volume2 size={14} />
            <span>Sounds & Alerts</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* ==========================================
              TAB 1: MAP PROVIDER & API KEY
              ========================================== */}
          {activeTab === 'map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Select Active Map Engine</label>

              {/* 1. Free Mode Option */}
              <div
                onClick={handleSelectFreeMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${providerId === 'osm' ? '#10b981' : 'var(--border-subtle)'}`,
                  background: providerId === 'osm' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34d399',
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Free Mode (OpenStreetMap)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      No API Key required · 100% Free · No billing
                    </div>
                  </div>
                </div>

                {providerId === 'osm' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: '#10b981',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>

              {/* 2. Google Maps Mode Option */}
              <div
                onClick={handleSelectGoogleMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${providerId === 'google' ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                  background: providerId === 'google' ? 'var(--color-brand-glow)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                    }}
                  >
                    <Globe size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Google Maps Pro
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Official Google Maps vectors, satellite tiles & 3D tilt
                    </div>
                  </div>
                </div>

                {providerId === 'google' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'var(--color-brand)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    SELECTED
                  </span>
                )}
              </div>

              {/* Google API Key Input */}
              {providerId === 'google' && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="var(--color-brand)" />
                    <span>Google Maps Javascript API Key</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="AIzaSy..."
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Keys are stored securely on your browser & synced to your account.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 2: BATTERY & TRACKING MODES
              ========================================== */}
          {activeTab === 'battery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Native GPS & Battery Optimization</label>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                  Controls how frequently Android checks your physical GPS location.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {BATTERY_MODES.map((mode) => {
                  const isSelected = batteryMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setBatteryMode(mode.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--color-brand-glow)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? 'var(--color-brand)' : 'var(--text-primary)' }}>
                          {mode.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'var(--color-brand)' : 'var(--bg-input)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {mode.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {mode.description}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pocket Wake Lock Explanation */}
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Zap size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#fbbf24' }}>Pocket & Travel Mode:</strong> Use the lightning toggle (⚡) in the header to activate continuous screen wake lock so Android never puts the GPS to sleep while you are on the road.
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: SOUNDS & ALERTS
              ========================================== */}
          {activeTab === 'sound' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Arrival Sound Profile</label>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                  Custom synthesizers designed to ring clearly through phone pockets.
                </p>
              </div>

              {/* Sound Profile Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SOUND_PROFILES.map((p) => {
                  const isSelected = soundProfile === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSoundProfile(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--color-brand-glow)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? 'var(--color-brand)' : 'var(--text-primary)' }}>
                            {p.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            {p.description}
                          </div>
                        </div>
                      </div>

                      {/* Play Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSoundProfile(p.id);
                          playSoundPreview(p.id);
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          gap: '4px',
                          borderRadius: 'var(--radius-full)',
                        }}
                        title={`Preview ${p.label}`}
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Play</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Toggles */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>🔊 Play Audio On Arrival</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>📳 Mobile Haptic Vibration</span>
                  <input
                    type="checkbox"
                    checked={vibrationEnabled}
                    onChange={(e) => setVibrationEnabled(e.target.checked)}
                    style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Save & Apply</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
