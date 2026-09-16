import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  SlidersHorizontal, 
  Sparkles, 
  Tag, 
  Navigation,
  Clock,
  ArrowUpDown,
  Filter,
  RotateCcw
} from 'lucide-react';
import ReminderCard from './ReminderCard';
import { calculateDistance } from '../services/geolocation';
import { CATEGORIES, PRIORITIES } from '../types/reminder';

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
  onCenterMap,
}) {
  const [sortBy, setSortBy] = useState('default'); // 'default', 'nearest', 'priority', 'newest'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter logic
  const filtered = useMemo(() => {
    let result = reminders.filter((rem) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (rem.title || '').toLowerCase().includes(q);
        const matchNotes = (rem.notes || '').toLowerCase().includes(q);
        const matchLoc = (rem.location?.name || '').toLowerCase().includes(q);
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

    // Sorting
    if (sortBy === 'nearest' && userPos) {
      result = [...result].sort((a, b) => {
        const distA = a.location?.lat
          ? calculateDistance(userPos.lat, userPos.lng, a.location.lat, a.location.lng)
          : Infinity;
        const distB = b.location?.lat
          ? calculateDistance(userPos.lat, userPos.lng, b.location.lat, b.location.lng)
          : Infinity;
        return distA - distB;
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      result = [...result].sort((a, b) => (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [reminders, searchQuery, selectedCategory, activeTab, sortBy, userPos]);

  const counts = {
    all: reminders.length,
    location: reminders.filter((r) => r.location?.lat && !r.completed).length,
    time: reminders.filter((r) => !r.location?.lat && !r.completed).length,
    active: reminders.filter((r) => !r.completed).length,
    completed: reminders.filter((r) => r.completed).length,
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || activeTab !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveTab('all');
    setSortBy('default');
  };

  return (
    <aside className="reminders-panel">
      <div className="panel-header">
        {/* Top Header with Title and Quick Add Button */}
        <div className="panel-title-row">
          <div className="panel-title-wrap">
            <h2 className="panel-heading">Reminders</h2>
            <span className="panel-count-pill">{counts.active} active</span>
          </div>

          <button
            type="button"
            className="btn btn-primary panel-add-btn"
            onClick={onOpenNewModal}
            id="btn-header-add-reminder"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search reminders, places, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-search-reminders"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <nav className="tabs-bar" aria-label="Reminder filters">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>🌈 All</span>
            <span className="tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            <span>📍 Geofenced</span>
            <span className="tab-count">{counts.location}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            <span>⏰ Standard</span>
            <span className="tab-count">{counts.time}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <span>💖 Done</span>
            <span className="tab-count">{counts.completed}</span>
          </button>
        </nav>

        {/* Category Filter Chips Bar */}
        <div className="category-chips-bar">
          <button
            type="button"
            className={`chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
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
                  '--chip-color': c.color,
                  '--chip-bg': c.bg,
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.shortLabel || c.label}</span>
                {countInCat > 0 && <span className="chip-count">({countInCat})</span>}
              </button>
            );
          })}
        </div>

        {/* Sort & Quick Helper Actions */}
        <div className="sort-helpers-row">
          <div className="sort-buttons-group">
            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'nearest' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'nearest' ? 'default' : 'nearest')}
              title="Sort items by closest geographic distance to your position"
            >
              <Navigation size={12} style={{ transform: 'rotate(45deg)' }} />
              <span>Closest First</span>
            </button>

            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'priority' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'priority' ? 'default' : 'priority')}
              title="Sort by highest priority"
            >
              <ArrowUpDown size={12} />
              <span>Priority</span>
            </button>
          </div>

          {onSeedLocalSamples && (
            <button
              type="button"
              className="seed-samples-btn"
              onClick={onSeedLocalSamples}
              title="Add cute sample reminders centered right around your current GPS coordinates"
            >
              <Sparkles size={12} />
              <span>✨ Demo Spots</span>
            </button>
          )}
        </div>

        {/* Active Filter Info / Reset Summary */}
        {hasActiveFilters && (
          <div className="filter-summary-banner">
            <span>
              Showing <b>{filtered.length}</b> of {reminders.length} items
            </span>
            <button type="button" className="reset-filter-link" onClick={resetAllFilters}>
              <RotateCcw size={11} />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Reminders Scroll Feed */}
      <div className="reminders-feed">
        {filtered.length === 0 ? (
          <div className="empty-reminders-state">
            <div className="empty-icon-bubble">
              {searchQuery ? '🔍' : activeTab === 'completed' ? '🎉' : '🌸'}
            </div>
            <div className="empty-text-wrap">
              <p className="empty-title">
                {searchQuery
                  ? 'No matching reminders'
                  : activeTab === 'completed'
                  ? 'No finished tasks yet'
                  : 'All clear & cozy!'}
              </p>
              <p className="empty-subtitle">
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}". Try a different keyword.`
                  : activeTab === 'completed'
                  ? 'Completed reminders will show up here once you check them off!'
                  : 'No reminders in this view yet. Tap below to create your first one or sprinkle nearby demo spots!'}
              </p>
            </div>

            <div className="empty-actions-row">
              {searchQuery ? (
                <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onOpenNewModal}
                    style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                  >
                    <Plus size={16} />
                    <span>Create Reminder</span>
                  </button>
                  {onSeedLocalSamples && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onSeedLocalSamples}
                      style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                    >
                      <Sparkles size={14} color="var(--color-brand)" />
                      <span>Sprinkle Demos</span>
                    </button>
                  )}
                </>
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
              onCenterMap={onCenterMap}
            />
          ))
        )}
      </div>
    </aside>
  );
}
