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
    <div className="stats-bar">
      <div className="stats-pill">
        <Target size={13} color="var(--color-brand)" />
        <span style={{ color: 'var(--text-muted)' }}>Active:</span>
        <b style={{ color: 'var(--text-primary)' }}>{activeReminders.length}</b>
      </div>

      <div className="stats-pill">
        <Navigation size={13} color="#38bdf8" />
        <span style={{ color: 'var(--text-muted)' }}>Geofenced:</span>
        <b style={{ color: 'var(--text-primary)' }}>{locationReminders.length}</b>
      </div>

      {nearest && (
        <div className="stats-pill" style={{ borderColor: minDistance <= (nearest.location?.radius || 100) ? 'rgba(52, 211, 153, 0.4)' : undefined }}>
          <Radio size={13} color={minDistance <= (nearest.location?.radius || 100) ? '#34d399' : '#f59e0b'} />
          <span style={{ color: 'var(--text-muted)' }}>Nearest:</span>
          <b style={{ color: minDistance <= (nearest.location?.radius || 100) ? '#34d399' : 'var(--text-primary)' }}>
            {nearest.title.slice(0, 16)} ({formatDistance(minDistance)})
          </b>
        </div>
      )}
    </div>
  );
}
