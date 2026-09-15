import React, { useState } from 'react';
import { Search, Plus, MapPin, CheckCircle2, SlidersHorizontal, Sparkles, Tag } from 'lucide-react';
import ReminderCard from './ReminderCard';
import { calculateDistance } from '../services/geolocation';
import { CATEGORIES } from '../types/reminder';

export default function ReminderList({
  reminders,
  userPos,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onToggleComplete,
  onEditReminder,
  onDeleteReminder,
  onSimulateArrival,
  onOpenNewModal,
  onSeedLocalSamples,
}) {
  const [sortByNearest, setSortByNearest] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter logic
  let filtered = reminders.filter((rem) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rem.title.toLowerCase().includes(q);
      const matchNotes = (rem.notes || '').toLowerCase().includes(q);
      const matchLoc = rem.location?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchLoc) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && rem.category !== selectedCategory) {
      return false;
    }

    // Tabs
    if (activeTab === 'location') return !!rem.location?.lat && !rem.completed;
    if (activeTab === 'time') return !rem.location?.lat && !rem.completed;
    if (activeTab === 'active') return !rem.completed;
    if (activeTab === 'completed') return rem.completed;
    return true;
  });

  // Sort by nearest if toggled
  if (sortByNearest && userPos) {
    filtered = [...filtered].sort((a, b) => {
      const distA = a.location?.lat
        ? calculateDistance(userPos.lat, userPos.lng, a.location.lat, a.location.lng)
        : Infinity;
      const distB = b.location?.lat
        ? calculateDistance(userPos.lat, userPos.lng, b.location.lat, b.location.lng)
        : Infinity;
      return distA - distB;
    });
  }

  const counts = {
    all: reminders.length,
    location: reminders.filter((r) => r.location?.lat && !r.completed).length,
    time: reminders.filter((r) => !r.location?.lat && !r.completed).length,
    active: reminders.filter((r) => !r.completed).length,
    completed: reminders.filter((r) => r.completed).length,
  };

  return (
    <aside className="reminders-panel">
      <div className="panel-header">
        {/* Search bar */}
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search reminders or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-search-reminders"
          />
        </div>

        {/* Tab filters */}
        <div className="tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            🌈 All <span className="tab-count">{counts.all}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            📍 Geofenced <span className="tab-count">{counts.location}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            ⏰ Standard <span className="tab-count">{counts.time}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            💖 Done <span className="tab-count">{counts.completed}</span>
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div 
          className="category-chips-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '2px 0 4px 0',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            className={`chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedCategory === 'all' ? '1.5px solid var(--color-brand)' : '1px solid var(--border-subtle)',
              background: selectedCategory === 'all' ? 'var(--color-brand-glow)' : 'var(--bg-card)',
              color: selectedCategory === 'all' ? 'var(--color-brand)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            All Tags
          </button>
          {CATEGORIES.map((c) => {
            const isCatActive = selectedCategory === c.id;
            const countInCat = reminders.filter((r) => r.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                className={`chip-btn ${isCatActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(isCatActive ? 'all' : c.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isCatActive ? `1.5px solid ${c.color}` : '1px solid var(--border-subtle)',
                  background: isCatActive ? c.bg : 'var(--bg-card)',
                  color: isCatActive ? c.color : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.shortLabel || c.label}</span>
                {countInCat > 0 && (
                  <span style={{ opacity: 0.8, fontSize: '0.68rem', fontWeight: 800 }}>({countInCat})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sorting & seed helpers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className={`btn btn-secondary ${sortByNearest ? 'active' : ''}`}
            style={{ 
              padding: '5px 12px', 
              fontSize: '0.75rem', 
              gap: '6px',
              background: sortByNearest ? 'rgba(56, 189, 248, 0.15)' : undefined,
              borderColor: sortByNearest ? 'var(--color-brand)' : undefined,
            }}
            onClick={() => setSortByNearest(!sortByNearest)}
          >
            <SlidersHorizontal size={13} />
            <span>{sortByNearest ? '🐾 Closest First' : '📍 Sort by Distance'}</span>
          </button>

          {onSeedLocalSamples && (
            <button
              className="btn btn-secondary"
              style={{ 
                padding: '5px 12px', 
                fontSize: '0.75rem', 
                gap: '6px',
                background: 'rgba(244, 114, 182, 0.12)',
                borderColor: 'rgba(244, 114, 182, 0.35)',
                color: 'var(--color-pink)'
              }}
              onClick={onSeedLocalSamples}
              title="Sprinkle cute sample reminders centered right around your current GPS coordinates"
            >
              <Sparkles size={13} />
              <span>✨ Add Nearby Demos</span>
            </button>
          )}
        </div>
      </div>

      {/* Feed list */}
      <div className="reminders-feed">
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              margin: '10px 0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(56, 189, 248, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                boxShadow: '0 4px 18px rgba(244, 114, 182, 0.25)',
              }}
            >
              🌸
            </div>
            <div>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                All clear & cozy!
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.4 }}>
                No reminders in this tab yet. Tap below to create one or sprinkle cute nearby demo spots!
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={onOpenNewModal}
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                <Plus size={16} />
                <span>Add Cute Reminder</span>
              </button>
              {onSeedLocalSamples && (
                <button 
                  className="btn btn-secondary" 
                  onClick={onSeedLocalSamples}
                  style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                >
                  <Sparkles size={14} color="var(--color-brand)" />
                  <span>Sprinkle Demos</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filtered.map((rem) => (
            <ReminderCard
              key={rem.id}
              reminder={rem}
              userPos={userPos}
              onToggleComplete={onToggleComplete}
              onEdit={onEditReminder}
              onDelete={onDeleteReminder}
              onSimulateArrival={onSimulateArrival}
            />
          ))
        )}
      </div>
    </aside>
  );
}
