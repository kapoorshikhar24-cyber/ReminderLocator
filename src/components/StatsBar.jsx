import React from 'react';
import { Target, CheckCircle, Navigation, Radio } from 'lucide-react';
import { calculateDistance, formatDistance } from '../services/geolocation';

export default function StatsBar({ reminders, userPos }) {
  const activeReminders = reminders.filter((r) => !r.completed);
  const locationReminders = activeReminders.filter((r) => r.location?.lat);

  let nearest = null;
  let minDistance = Infinity;

  if (userPos && locationReminders.length > 0) {
    locationReminders.forEach((r) => {
      const d = calculateDistance(
        userPos.lat,
        userPos.lng,
        r.location.lat,
        r.location.lng
      );
      if (d < minDistance) {
        minDistance = d;
        nearest = r;
      }
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 20px',
        background: 'var(--bg-surface-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.78rem',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Target size={14} color="var(--color-brand)" />
        <span style={{ color: 'var(--text-muted)' }}>Active:</span>
        <b>{activeReminders.length}</b>
      </div>

      <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Navigation size={14} color="var(--color-cyan)" />
        <span style={{ color: 'var(--text-muted)' }}>Geofences:</span>
        <b>{locationReminders.length}</b>
      </div>

      {nearest && (
        <>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Radio size={14} color="#10b981" />
            <span style={{ color: 'var(--text-muted)' }}>Nearest:</span>
            <b style={{ color: minDistance <= (nearest.location.radius || 100) ? '#34d399' : 'var(--text-primary)' }}>
              {nearest.title.slice(0, 18)} ({formatDistance(minDistance)})
            </b>
          </div>
        </>
      )}
    </div>
  );
}
