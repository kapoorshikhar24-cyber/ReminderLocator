import React from 'react';
import { Check, Clock, X, Navigation, MapPin, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../types/reminder';

export default function TriggerAlertModal({
  triggeredReminder,
  onComplete,
  onSnooze,
  onDismiss,
}) {
  if (!triggeredReminder) return null;

  const category = CATEGORIES.find((c) => c.id === triggeredReminder.category) || CATEGORIES[0];
  const isExit = triggeredReminder.location?.triggerType === 'exit';

  return (
    <div className="modal-overlay">
      <div className="modal-dialog trigger-arrival-dialog">
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

        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '6px', color: '#ffffff', lineHeight: 1.3 }}>
          {triggeredReminder.title}
        </h2>

        {triggeredReminder.location && (
          <p style={{ fontSize: '0.92rem', color: '#93c5fd', marginTop: '4px', fontWeight: 700 }}>
            📍 You reached <b>{triggeredReminder.location.name}</b>
          </p>
        )}

        {triggeredReminder.notes && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              margin: '14px 0',
              textAlign: 'left',
              fontSize: '0.88rem',
              color: '#f1f5f9',
            }}
          >
            <span style={{ fontWeight: 800, display: 'block', marginBottom: '4px', color: '#cbd5e1', fontSize: '0.78rem' }}>
              📝 Notes:
            </span>
            {triggeredReminder.notes}
          </div>
        )}

        {/* Cute Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ 
              padding: '13px', 
              fontSize: '0.98rem',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              boxShadow: '0 4px 20px rgba(52, 211, 153, 0.45)',
              border: 'none',
            }}
            onClick={() => onComplete(triggeredReminder.id)}
            id="btn-trigger-mark-done"
          >
            <Check size={20} strokeWidth={3} />
            <span>Mark as Done & Celebrate! 🎉</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '0.86rem' }}
              onClick={() => onSnooze(triggeredReminder.id)}
            >
              <Clock size={16} />
              <span>💤 Snooze 10m</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '0.86rem' }}
              onClick={onDismiss}
            >
              <X size={16} />
              <span>👋 Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
