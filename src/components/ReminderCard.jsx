import React, { useState } from 'react';
import { 
  Check, 
  MapPin, 
  Clock, 
  Trash2, 
  Edit3, 
  Zap, 
  Sparkles,
  Navigation,
  Crosshair,
  ArrowUpRight,
  ArrowDownLeft,
  BellRing,
  Moon
} from 'lucide-react';
import { calculateDistance, formatDistance } from '../services/geolocation';
import { CATEGORIES, PRIORITIES, SNOOZE_PRESETS } from '../types/reminder';

export default function ReminderCard({
  reminder,
  userPos,
  onToggleComplete,
  onEdit,
  onDelete,
  onSimulateArrival,
  onCenterMap,
  onSnooze,
  onUnsnooze,
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const isLocationBased = !!reminder.location && typeof reminder.location.lat === 'number';
  
  let distance = null;
  let isInside = false;

  if (isLocationBased && userPos) {
    distance = calculateDistance(
      userPos.lat,
      userPos.lng,
      reminder.location.lat,
      reminder.location.lng
    );
    isInside = distance <= (reminder.location.radius || 100);
  }

  const category = CATEGORIES.find((c) => c.id === reminder.category) || CATEGORIES[0];
  const priority = PRIORITIES.find((p) => p.id === reminder.priority) || PRIORITIES[1];
  const isExitTrigger = reminder.location?.triggerType === 'exit';

  const now = Date.now();
  const isSnoozed = !reminder.completed && !!reminder.snoozedUntil && reminder.snoozedUntil > now;
  const snoozedMinutesLeft = isSnoozed
    ? Math.max(1, Math.ceil((reminder.snoozedUntil - now) / (60 * 1000)))
    : 0;

  const formatSnoozeLeft = (mins) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    return `${mins}m`;
  };

  return (
    <article
      className={`reminder-card ${reminder.completed ? 'completed' : ''} ${
        isInside && !reminder.completed && !isSnoozed ? 'inside-geofence' : ''
      }`}
      id={`reminder-card-${reminder.id}`}
      style={{
        '--card-accent': category.color || 'var(--color-brand)',
      }}
    >
      <div className="reminder-card-top">
        <div className="card-title-group">
          {/* Custom Bouncy Marshmallow Checkbox */}
          <button
            type="button"
            className={`checkbox-custom ${reminder.completed ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(reminder.id);
            }}
            title={reminder.completed ? 'Mark active' : 'Mark as done! ✨'}
            aria-label={reminder.completed ? 'Mark active' : 'Mark as done'}
          >
            {reminder.completed && <Check size={14} strokeWidth={3} />}
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className={`card-title ${reminder.completed ? 'strike' : ''}`}>
              {reminder.title}
            </h3>
          </div>
        </div>

        {/* Category & Priority Badge Chips */}
        <div className="card-badge-group">
          <span
            className="category-pill"
            style={{
              color: category.color,
              background: category.bg,
              borderColor: `${category.color}40`,
            }}
          >
            <span>{category.emoji}</span>
            <span>{category.shortLabel || category.label}</span>
          </span>

          <span
            className="priority-pill"
            style={{
              color: priority.color,
              background: `${priority.color}15`,
              borderColor: `${priority.color}35`,
            }}
          >
            {priority.label}
          </span>
        </div>
      </div>

      {/* Notes / Description */}
      {reminder.notes && <p className="card-notes">{reminder.notes}</p>}

      {/* Active Snooze Status Banner */}
      {isSnoozed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '6px 10px',
            margin: '8px 0',
            fontSize: '0.78rem',
            color: '#38bdf8',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} />
            <span>💤 Snoozed · {formatSnoozeLeft(snoozedMinutesLeft)} remaining</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnsnooze && onUnsnooze(reminder.id);
            }}
            style={{
              background: 'rgba(56, 189, 248, 0.25)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Resume active geofence monitoring immediately"
          >
            <BellRing size={11} />
            <span>Wake</span>
          </button>
        </div>
      )}

      {/* Location Proximity Status Bar */}
      {isLocationBased && !reminder.completed && (
        <div className={`proximity-badge ${isInside ? 'near' : 'far'}`}>
          {isInside ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-radar-dot" />
              <span style={{ fontWeight: 800 }}>
                {isSnoozed ? `Inside Geofence (${distance}m) · Snoozed 💤` : `Inside Geofence (${distance}m) ✨`}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <Navigation size={12} color="var(--color-brand)" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <b>{formatDistance(distance)}</b> away · {reminder.location.name || 'Set Spot'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: 'auto' }}>
            <span className="radius-tag">
              {isExitTrigger ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f87171' }}>
                  <ArrowUpRight size={11} /> Exit ({reminder.location.radius || 100}m)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-brand)' }}>
                  <ArrowDownLeft size={11} /> Enter ({reminder.location.radius || 100}m)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Time deadline tag */}
      {reminder.dueTime && (
        <div className="card-time-tag">
          <Clock size={12} color="var(--color-purple)" />
          <span>
            Due: {new Date(reminder.dueTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
            {new Date(reminder.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Quick Snooze Popover Menu */}
      {showSnoozeMenu && !reminder.completed && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            margin: '8px 0 4px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', width: '100%', fontWeight: 700, marginBottom: '2px' }}>
            💤 Snooze alerts for:
          </span>
          {SNOOZE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onSnooze && onSnooze(reminder.id, p.value);
                setShowSnoozeMenu(false);
              }}
              style={{
                flex: '1 1 calc(33.333% - 4px)',
                padding: '4px 6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Card Action Controls */}
      <div className="card-meta-row">
        <div className="card-actions-left">
          {isLocationBased && onCenterMap && (
            <button
              type="button"
              className="card-quick-btn map-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCenterMap(reminder);
              }}
              title="Locate & focus on map"
            >
              <Crosshair size={12} />
              <span>Map</span>
            </button>
          )}

          {isLocationBased && !reminder.completed && onSimulateArrival && (
            <button
              type="button"
              className="card-quick-btn teleport-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSimulateArrival(reminder);
              }}
              title="Test trigger: Teleport GPS directly inside this location"
            >
              <Zap size={12} />
              <span>Test GPS</span>
            </button>
          )}

          {!reminder.completed && onSnooze && (
            <button
              type="button"
              className="card-quick-btn"
              style={{
                background: isSnoozed ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: isSnoozed ? '#38bdf8' : 'var(--border-subtle)',
                color: isSnoozed ? '#38bdf8' : 'var(--text-secondary)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowSnoozeMenu(!showSnoozeMenu);
              }}
              title={isSnoozed ? 'Change snooze time' : 'Snooze alerts for this reminder'}
            >
              <Clock size={12} />
              <span>{isSnoozed ? 'Snoozed' : 'Snooze'}</span>
            </button>
          )}
        </div>

        <div className="card-actions-right">
          <button
            type="button"
            className="card-action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(reminder);
            }}
            title="Edit reminder"
            aria-label="Edit reminder"
          >
            <Edit3 size={14} />
          </button>

          <button
            type="button"
            className="card-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reminder.id);
            }}
            title="Delete reminder"
            aria-label="Delete reminder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
