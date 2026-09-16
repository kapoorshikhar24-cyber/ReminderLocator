import React from 'react';
import { Target, CheckCircle2, Navigation, Radio, Sparkles } from 'lucide-react';
import { calculateDistance, formatDistance } from '../services/geolocation';

export default function StatsBar({ reminders, userPos }) {
  const total = reminders.length;
  const completedCount = reminders.filter((r) => r.completed).length;
  const activeReminders = reminders.filter((r) => !r.completed);
  const locationReminders = activeReminders.filter((r) => r.location?.lat);
  const completionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

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
    <div className="stats-bar">
      <div className="stats-pill" title="Total active uncompleted tasks">
        <Target size={13} color="var(--color-brand)" />
        <span className="stats-label">Active:</span>
        <b className="stats-value">{activeReminders.length}</b>
      </div>

      <div className="stats-pill" title="Active geofenced locations monitored in background">
        <Navigation size={13} color="#38bdf8" />
        <span className="stats-label">Geofenced:</span>
        <b className="stats-value">{locationReminders.length}</b>
      </div>

      {total > 0 && (
        <div className="stats-pill" title="Tasks marked completed">
          <CheckCircle2 size={13} color="#34d399" />
          <span className="stats-label">Done:</span>
          <b className="stats-value" style={{ color: '#34d399' }}>
            {completedCount}/{total} ({completionPct}%)
          </b>
        </div>
      )}

      {nearest && (
        <div
          className={`stats-pill ${minDistance <= (nearest.location?.radius || 100) ? 'inside-pill' : ''}`}
          title={`Closest active spot: ${nearest.location?.name || nearest.title}`}
          style={{
            borderColor: minDistance <= (nearest.location?.radius || 100) ? 'rgba(52, 211, 153, 0.5)' : undefined,
            background: minDistance <= (nearest.location?.radius || 100) ? 'rgba(16, 185, 129, 0.12)' : undefined,
          }}
        >
          <Radio
            size={13}
            color={minDistance <= (nearest.location?.radius || 100) ? '#34d399' : '#f59e0b'}
            className={minDistance <= (nearest.location?.radius || 100) ? 'pulse-anim' : ''}
          />
          <span className="stats-label">Nearest:</span>
          <b
            className="stats-value"
            style={{
              color: minDistance <= (nearest.location?.radius || 100) ? '#34d399' : 'var(--text-primary)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nearest.title} ({formatDistance(minDistance)})
          </b>
        </div>
      )}
    </div>
  );
}
