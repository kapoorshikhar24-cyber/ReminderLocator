import React from 'react';
import { 
  Check, 
  MapPin, 
  Clock, 
  Trash2, 
  Edit3, 
  Zap, 
  ChevronRight,
  Sparkles,
  AlertCircle
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
  const isLocationBased = !!reminder.location && !!reminder.location.lat;
  
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

  return (
    <div
      className={`reminder-card ${reminder.completed ? 'completed' : ''} ${
        isInside && !reminder.completed ? 'inside-geofence' : ''
      }`}
      id={`reminder-card-${reminder.id}`}
      style={{
        borderLeft: `4px solid ${category.color || 'var(--color-brand)'}`,
      }}
    >
      <div className="reminder-card-top">
        <div className="card-title-group">
          {/* Custom Bouncy Marshmallow Checkbox */}
          <button
            className={`checkbox-custom ${reminder.completed ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(reminder.id);
            }}
            title={reminder.completed ? 'Mark as active' : 'Mark as done! ✨'}
          >
            {reminder.completed && <Check size={14} strokeWidth={3} />}
          </button>

          <div>
            <h3 className={`card-title ${reminder.completed ? 'strike' : ''}`}>
              {reminder.title}
            </h3>
          </div>
        </div>

        {/* Tags & Priority Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Category Tag Badge */}
          <span
            className="category-pill"
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: category.color,
              background: category.bg,
              border: `1px solid ${category.color}40`,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{category.emoji}</span>
            <span>{category.shortLabel || category.label}</span>
          </span>

          {/* Cute Priority chip */}
          <span
            className="priority-pill"
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: priority.color,
              background: `${priority.color}18`,
              border: `1px solid ${priority.color}40`,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.02em',
            }}
          >
            {priority.label}
          </span>
        </div>
      </div>

      {reminder.notes && <p className="card-notes">{reminder.notes}</p>}

      {/* Proximity / Geofence Status Badge */}
      {isLocationBased && !reminder.completed && (
        <div className={`proximity-badge ${isInside ? 'near' : 'far'}`}>
          {isInside ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} />
              <span>You're here! ({distance}m) ✨</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🐾</span>
              <span>
                {formatDistance(distance)} away · {reminder.location.name || 'Set Spot'}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Time constraint if applicable */}
      {reminder.dueTime && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginLeft: '36px',
            marginBottom: '8px',
          }}
        >
          <Clock size={12} color="var(--color-purple)" />
          <span>⏰ Due: {new Date(reminder.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* Meta Row with Category & Quick Action Buttons */}
      <div className="card-meta-row">
        <div className="card-tags">
          <span
            className="tag-badge"
            style={{ 
              color: category.color, 
              background: `${category.color}15`,
              border: `1px solid ${category.color}35` 
            }}
          >
            {category.label}
          </span>
          {isLocationBased && (
            <span 
              className="tag-badge" 
              style={{ 
                color: 'var(--color-brand)',
                background: 'var(--color-brand-glow)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              📍 {reminder.location.radius || 100}m circle
            </span>
          )}
        </div>

        <div className="card-actions">
          {/* Quick test arrival simulation button */}
          {isLocationBased && !reminder.completed && (
            <button
              className="btn btn-secondary"
              style={{ 
                padding: '4px 10px', 
                fontSize: '0.72rem', 
                gap: '4px',
                background: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#fbbf24'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSimulateArrival(reminder);
              }}
              title="Test: Teleport directly into this location's geofence"
            >
              <Zap size={12} color="#f59e0b" />
              <span>Teleport ✨</span>
            </button>
          )}

          {/* Edit */}
          <button
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(reminder);
            }}
            title="Edit reminder"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete */}
          <button
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reminder.id);
            }}
            title="Delete reminder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
