import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Search, 
  Sliders, 
  Crosshair, 
  Check, 
  Sparkles,
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, PRIORITIES, RADIUS_PRESETS } from '../types/reminder';
import { searchPlaces } from '../services/geocoding';

export default function ReminderModal({
  isOpen,
  onClose,
  onSave,
  editReminder,
  userPos,
  onStartMapPicker,
  pickedLocationCoords,
  isPickingFullScreen,
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('shopping');
  const [priority, setPriority] = useState('medium');
  
  // Location settings
  const [enableLocation, setEnableLocation] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [radius, setRadius] = useState(100);
  const [triggerType, setTriggerType] = useState('enter'); // 'enter' or 'exit'

  // Time settings
  const [enableTime, setEnableTime] = useState(false);
  const [dueTime, setDueTime] = useState('');

  // Search places
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Initialize or populate form
  useEffect(() => {
    if (editReminder) {
      setTitle(editReminder.title || '');
      setNotes(editReminder.notes || '');
      setCategory(editReminder.category || 'shopping');
      setPriority(editReminder.priority || 'medium');
      
      if (editReminder.location) {
        setEnableLocation(true);
        setLocationName(editReminder.location.name || '');
        setLat(editReminder.location.lat);
        setLng(editReminder.location.lng);
        setRadius(editReminder.location.radius || 100);
        setTriggerType(editReminder.location.triggerType || 'enter');
      } else {
        setEnableLocation(false);
      }

      if (editReminder.dueTime) {
        setEnableTime(true);
        const d = new Date(editReminder.dueTime);
        setDueTime(d.toISOString().slice(0, 16));
      } else {
        setEnableTime(false);
        setDueTime('');
      }
    } else if (!lat && !lng && userPos) {
      // Default initial coordinates only if not already set
      setLat(userPos.lat);
      setLng(userPos.lng);
      setLocationName('Current Location');
    }
  }, [editReminder, isOpen]);

  // Update when user picks a point on the map
  useEffect(() => {
    if (pickedLocationCoords?.lat && pickedLocationCoords?.lng) {
      setLat(pickedLocationCoords.lat);
      setLng(pickedLocationCoords.lng);
      setLocationName(
        pickedLocationCoords.name ||
          `Pinned (${pickedLocationCoords.lat.toFixed(4)}, ${pickedLocationCoords.lng.toFixed(4)})`
      );
      setEnableLocation(true);
    }
  }, [pickedLocationCoords]);

  // Handle place search with 300ms debounce
  const handleSearchInputChange = (query) => {
    setPlaceSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query, userPos);
        setSearchResults(results || []);
      } catch (err) {
        console.warn('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectPlace = (place) => {
    setLocationName(place.name || place.displayName.split(',')[0]);
    setLat(place.lat);
    setLng(place.lng);
    setSearchResults([]);
    setPlaceSearchQuery('');
  };

  const handleUseCurrentLocation = () => {
    if (userPos) {
      setLat(userPos.lat);
      setLng(userPos.lng);
      setLocationName('My Current Location');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      completed: editReminder ? editReminder.completed : false,
      type: enableLocation && enableTime ? 'both' : enableLocation ? 'location' : 'time',
      location: enableLocation && lat && lng ? {
        name: locationName.trim() || 'Selected Spot',
        lat,
        lng,
        radius,
        triggerType,
      } : null,
      dueTime: enableTime && dueTime ? new Date(dueTime).toISOString() : null,
      createdAt: editReminder ? editReminder.createdAt : new Date().toISOString(),
    };

    onSave(payload);
    // Reset draft fields
    setTitle('');
    setNotes('');
    setPlaceSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  // Only unmount when closed, stay mounted when picking on map
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ display: isPickingFullScreen ? 'none' : 'flex' }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editReminder ? '✏️ Edit Reminder' : '✨ New Reminder'}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">✨ What would you like to remember? *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 🌸 Pick up iced matcha, drop package, buy snacks..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              id="input-reminder-title"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">📝 Cozy notes & details (optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Don't forget coupon code, ask for extra smiles..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="input-reminder-notes"
            />
          </div>

          {/* Category & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">🏷️ Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">⭐ Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Trigger Section */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="var(--color-brand)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>📍 Location Alert (Geofence)</span>
              </div>
              <input
                type="checkbox"
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                checked={enableLocation}
                onChange={(e) => setEnableLocation(e.target.checked)}
                id="checkbox-enable-location"
              />
            </div>

            {enableLocation && (
              <>
                {/* Search place input */}
                <div style={{ position: 'relative' }}>
                  <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>
                    Search Place or Address
                  </label>
                  <div className="search-input-wrap">
                    {isSearching ? (
                      <Loader2 size={16} className="search-icon" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Search size={16} className="search-icon" />
                    )}
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Type a store, landmark, or street name..."
                      value={placeSearchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      id="input-search-location"
                    />
                    {placeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlaceSearchQuery('');
                          setSearchResults([]);
                        }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete dropdown */}
                  {searchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '105%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-focus)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 100,
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}
                    >
                      {searchResults.map((place) => (
                        <div
                          key={place.placeId}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'var(--transition-smooth)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => handleSelectPlace(place)}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            📍 {place.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {place.displayName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions: Use GPS or Click on Map */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.78rem', padding: '9px 12px' }}
                    onClick={handleUseCurrentLocation}
                  >
                    <Crosshair size={14} color="#38bdf8" />
                    <span>🎯 My Current GPS</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      fontSize: '0.78rem',
                      padding: '9px 12px',
                      background: 'var(--color-brand-glow)',
                      borderColor: 'var(--color-brand)',
                    }}
                    onClick={() => {
                      onStartMapPicker({ lat, lng, name: locationName });
                    }}
                  >
                    <Navigation size={14} color="var(--color-brand)" />
                    <span>🗺️ Pick on Map ✨</span>
                  </button>
                </div>

                {/* Selected Location Pill */}
                {lat && lng && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} strokeWidth={3} />
                        <span>{locationName || 'Selected Location'}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      onClick={() => onStartMapPicker({ lat, lng, name: locationName })}
                      title="Adjust location pin on the map"
                    >
                      Adjust on Map
                    </button>
                  </div>
                )}

                {/* Radius Slider & Presets */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    <span>Trigger Geofence Radius:</span>
                    <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>{radius} meters</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="1000"
                    step="10"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                    id="slider-radius"
                  />

                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {RADIUS_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`btn btn-secondary ${radius === p.value ? 'active' : ''}`}
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        onClick={() => setRadius(p.value)}
                      >
                        {p.value}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger Condition: Arrival vs Departure */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: triggerType === 'enter' ? 'var(--color-brand-glow)' : 'transparent',
                      border: `1px solid ${triggerType === 'enter' ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="triggerType"
                      value="enter"
                      checked={triggerType === 'enter'}
                      onChange={() => setTriggerType('enter')}
                    />
                    <span>On Arrival (Enter)</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: triggerType === 'exit' ? 'var(--color-brand-glow)' : 'transparent',
                      border: `1px solid ${triggerType === 'exit' ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="triggerType"
                      value="exit"
                      checked={triggerType === 'exit'}
                      onChange={() => setTriggerType('exit')}
                    />
                    <span>On Leaving (Exit)</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Time Reminder Toggle (Optional) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--color-purple)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Time Constraint (optional)</span>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={enableTime}
                onChange={(e) => setEnableTime(e.target.checked)}
                id="checkbox-enable-time"
              />
            </div>

            {enableTime && (
              <input
                type="datetime-local"
                className="form-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                id="input-reminder-datetime"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '9px 18px' }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              id="btn-save-reminder"
              style={{ padding: '9px 22px' }}
            >
              <Check size={16} strokeWidth={3} />
              <span>{editReminder ? 'Save Changes ✨' : 'Create Reminder ✨'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
