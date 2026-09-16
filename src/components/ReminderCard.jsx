import React from 'react';
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
  ArrowDownLeft
} from 'lucide-react';
import { calculateDistance, formatDistance } from '../services/geolocation';
import { CATEGORIES, PRIORITIES } from '../types/reminder';

export default function ReminderCard({
  reminder,
  userPos,
  onToggleComplete,
  onEdit,
  onDelete,
  onSimulateArrival,
  onCenterMap,
}) {
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

  return (
    <article
      className={`reminder-card ${reminder.completed ? 'completed' : ''} ${
        isInside && !reminder.completed ? 'inside-geofence' : ''
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

      {/* Location Proximity Status Bar */}
      {isLocationBased && !reminder.completed && (
        <div className={`proximity-badge ${isInside ? 'near' : 'far'}`}>
          {isInside ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-radar-dot" />
              <span style={{ fontWeight: 800 }}>Inside Geofence ({distance}m) ✨</span>
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
