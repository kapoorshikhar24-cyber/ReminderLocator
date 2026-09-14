import React, { useState } from 'react';
import { X, Layers, Key, Check, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { MAP_PROVIDERS } from '../services/mapProviders';

export default function MapSettingsModal({ isOpen, onClose, currentConfig, onSaveConfig }) {
  const [providerId, setProviderId] = useState(currentConfig.providerId || 'osm');
  const [googleApiKey, setGoogleApiKey] = useState(currentConfig.googleApiKey || '');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [customUrl, setCustomUrl] = useState(currentConfig.customUrl || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-determine provider: if user entered a Google API key and selected google, use google
    // Otherwise if provider is google but key is empty, fall back to osm
    let resolvedProvider = providerId;
    if (providerId === 'google' && !googleApiKey.trim()) {
      resolvedProvider = 'osm';
    }

    onSaveConfig({
      providerId: resolvedProvider,
      googleApiKey: googleApiKey.trim(),
      apiKey: apiKey.trim(),
      customUrl: customUrl.trim(),
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
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--color-brand)" />
            <h2 className="modal-title">Map Mode & API Key</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Main Dual Mode Choice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="form-label">Select Map Mode</label>

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
                  <Sparkles size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Google Maps Mode
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Official Google Maps · Satellite, Roadmap, POIs
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
          </div>

          {/* Google Maps API Key Input (Shows if Google mode is selected or if key is being set) */}
          {providerId === 'google' && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} color="var(--color-warning)" />
                <span>Google Maps API Key</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                autoFocus
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                • If you fill in your Google Maps API key, the app will run in official <b>Google Maps Mode</b>.<br />
                • If you clear it or leave it blank, it will automatically run in <b>Free Mode</b>.
              </div>
            </div>
          )}

          {/* Other Advanced Providers (Collapsed / secondary) */}
          <details style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, padding: '4px 0' }}>
              Other Providers (CARTO, Mapbox, Stadia, Custom)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {MAP_PROVIDERS.filter((p) => p.id !== 'osm' && p.id !== 'google').map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: providerId === p.id ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="altProvider"
                    value={p.id}
                    checked={providerId === p.id}
                    onChange={() => setProviderId(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}

              {['carto', 'mapbox', 'stadia'].includes(providerId) && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="API Key / Token"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              )}

              {providerId === 'custom' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              )}
            </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Apply Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
