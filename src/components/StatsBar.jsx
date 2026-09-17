import React from 'react';
import { Target, CheckCircle2, Navigation, Radio, MapPin, Sparkles } from 'lucide-react';
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

  const isNearestInside = nearest && minDistance <= (nearest.location?.radius || 100);

  return (
    <div className="stats-bar">
      <div className="stats-pill stats-pill-active" title="Total active uncompleted tasks">
        <div className="stats-pill-icon active-icon">
          <Target size={12} strokeWidth={2.5} />
        </div>
        <span className="stats-label">Active</span>
        <span className="stats-badge-number">{activeReminders.length}</span>
      </div>

      <div className="stats-pill stats-pill-geofenced" title="Active geofenced locations monitored in background">
        <div className="stats-pill-icon geofence-icon">
          <Navigation size={12} strokeWidth={2.5} />
        </div>
        <span className="stats-label">Geofences</span>
        <span className="stats-badge-number">{locationReminders.length}</span>
      </div>

      {total > 0 && (
        <div className="stats-pill stats-pill-done" title="Tasks marked completed">
          <div className="stats-pill-icon done-icon">
            <CheckCircle2 size={12} strokeWidth={2.5} />
          </div>
          <span className="stats-label">Done</span>
          <span className="stats-badge-number">{completedCount}/{total} <small style={{ opacity: 0.8, fontWeight: 600 }}>({completionPct}%)</small></span>
        </div>
      )}

      {nearest && (
        <div
          className={`stats-pill stats-pill-nearest ${isNearestInside ? 'inside-pill' : ''}`}
          title={`Closest active spot: ${nearest.location?.name || nearest.title}`}
        >
          <div className={`stats-pill-icon nearest-icon ${isNearestInside ? 'pulse-anim' : ''}`}>
            {isNearestInside ? <MapPin size={12} /> : <Radio size={12} />}
          </div>
          <span className="stats-label">Nearest</span>
          <span className="stats-value-text">
            <b>{nearest.title}</b> <small style={{ color: isNearestInside ? '#34d399' : 'var(--text-secondary)' }}>· {formatDistance(minDistance)}</small>
          </span>
        </div>
      )}
    </div>
  );
}
