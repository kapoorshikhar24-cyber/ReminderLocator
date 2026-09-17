import React, { useState } from 'react';
import { Check, Clock, X, Navigation, MapPin, Sparkles, BellRing } from 'lucide-react';
import { CATEGORIES, SNOOZE_PRESETS } from '../types/reminder';

export default function TriggerAlertModal({
  triggeredReminder,
  onComplete,
  onSnooze,
  onDismiss,
}) {
  const initialSnooze = triggeredReminder?.defaultSnoozeMinutes || 10;
  const [selectedMinutes, setSelectedMinutes] = useState(initialSnooze);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputVal, setCustomInputVal] = useState('');

  if (!triggeredReminder) return null;

  const category = CATEGORIES.find((c) => c.id === triggeredReminder.category) || CATEGORIES[0];
  const isExit = triggeredReminder.location?.triggerType === 'exit';

  const handlePresetClick = (mins) => {
    setSelectedMinutes(mins);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(customInputVal, 10);
    if (!isNaN(val) && val > 0 && val <= 1440) {
      setSelectedMinutes(val);
      setShowCustomInput(false);
    }
  };

  const formatSelectedLabel = (mins) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hr${hrs > 1 ? 's' : ''}`;
    }
    return `${mins} min${mins > 1 ? 's' : ''}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog trigger-arrival-dialog" style={{ maxWidth: '440px' }}>
        <div className="modal-drag-handle" style={{ background: 'rgba(255, 255, 255, 0.4)' }} />
        
        {/* Confetti decoration emojis */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '20px', marginBottom: '-6px' }}>
          <span>🎉</span>
          <span>✨</span>
          <span>🌸</span>
          <span>🎈</span>
          <span>✨</span>
        </div>

        {/* Pulsing icon */}
        <div className="arrival-icon-pulse">
          {isExit ? <Navigation size={38} /> : <MapPin size={38} />}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#f472b6', fontSize: '0.86rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Sparkles size={15} />
          <span>{isExit ? 'Departure Triggered!' : 'Hooray! You Arrived! ✨'}</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '6px', color: '#ffffff', lineHeight: 1.3 }}>
          {triggeredReminder.title}
        </h2>

        {triggeredReminder.location && (
          <p style={{ fontSize: '0.92rem', color: '#93c5fd', marginTop: '4px', fontWeight: 700 }}>
            📍 Reached <b>{triggeredReminder.location.name}</b>
          </p>
        )}

        {triggeredReminder.notes && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              margin: '12px 0 8px',
              textAlign: 'left',
              fontSize: '0.88rem',
              color: '#f1f5f9',
            }}
          >
            <span style={{ fontWeight: 800, display: 'block', marginBottom: '3px', color: '#cbd5e1', fontSize: '0.78rem' }}>
              📝 Notes:
            </span>
            {triggeredReminder.notes}
          </div>
        )}

        {/* Snooze Time Selection Section */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            padding: '12px 14px',
            margin: '12px 0 6px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0' }}>
              <Clock size={14} color="#38bdf8" />
              <span>Snooze Duration</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
              {formatSelectedLabel(selectedMinutes)}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SNOOZE_PRESETS.map((preset) => {
              const isSelected = selectedMinutes === preset.value && !showCustomInput;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  style={{
                    flex: '1 1 calc(33.333% - 6px)',
                    minWidth: '58px',
                    padding: '6px 8px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              style={{
                flex: '1 1 100%',
                padding: '5px 8px',
                fontSize: '0.76rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: showCustomInput ? '1.5px solid #a855f7' : '1px dashed rgba(255, 255, 255, 0.15)',
                background: showCustomInput ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                color: '#e2e8f0',
                cursor: 'pointer',
                marginTop: '2px',
              }}
            >
              ✏️ {showCustomInput ? 'Close Custom Time' : 'Set Custom Minutes...'}
            </button>
          </div>

          {showCustomInput && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="Enter minutes (e.g. 45)"
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid #38bdf8',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCustomSubmit}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          <button
            className="btn btn-primary"
            style={{ 
              padding: '12px', 
              fontSize: '0.96rem',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              boxShadow: '0 4px 20px rgba(52, 211, 153, 0.45)',
              border: 'none',
              fontWeight: 800,
            }}
            onClick={() => onComplete(triggeredReminder.id)}
            id="btn-trigger-mark-done"
          >
            <Check size={18} strokeWidth={3} />
            <span>Mark as Done & Celebrate! 🎉</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ 
                flex: 1.2, 
                padding: '11px', 
                fontSize: '0.88rem',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontWeight: 700,
              }}
              onClick={() => onSnooze(triggeredReminder.id, selectedMinutes)}
              id="btn-trigger-snooze"
            >
              <Clock size={16} />
              <span>💤 Snooze ({formatSelectedLabel(selectedMinutes)})</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ flex: 0.8, padding: '11px', fontSize: '0.86rem' }}
              onClick={onDismiss}
              id="btn-trigger-dismiss"
            >
              <X size={16} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
