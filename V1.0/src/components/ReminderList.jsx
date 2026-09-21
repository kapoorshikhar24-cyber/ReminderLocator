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
  RotateCcw,
  Layers,
  Sparkle
} from 'lucide-react';
import ReminderCard from './ReminderCard';
import { calculateDistance } from '../services/geolocation';
import { CATEGORIES, PRIORITIES } from '../types/reminder';

export default function ReminderList({
  reminders,
  userPos,
  activeTab = 'all',
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onToggleComplete,
  onClearCompleted,
  onEditReminder,
  onDeleteReminder,
  onSimulateArrival,
  onOpenNewModal,
  onSeedLocalSamples,
  onCenterMap,
  onSnooze,
  onUnsnooze,
}) {
  const [sortBy, setSortBy] = useState('default'); // 'default', 'nearest', 'priority', 'newest'

  // Filter logic: tab, search and sorting (Completed tasks are removed from the active UI)
  const filtered = useMemo(() => {
    let result = reminders.filter((rem) => {
      // Tab filter: 'all' and 'active' views automatically remove completed tasks from the UI
      if (activeTab === 'all' && rem.completed) return false;
      if (activeTab === 'active' && rem.completed) return false;
      if (activeTab === 'completed' && !rem.completed) return false;

      // Search query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (rem.title || '').toLowerCase().includes(q);
        const matchNotes = (rem.notes || '').toLowerCase().includes(q);
        const matchLoc = (rem.location?.name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchLoc) return false;
      }
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
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      result = [...result].sort((a, b) => (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [reminders, activeTab, searchQuery, sortBy, userPos]);

  const counts = {
    all: reminders.filter((r) => !r.completed).length,
    active: reminders.filter((r) => !r.completed).length,
    completed: reminders.filter((r) => r.completed).length,
  };

  const hasActiveFilters = (searchQuery && searchQuery.trim() !== '') || sortBy !== 'default' || activeTab !== 'all';

  const resetAllFilters = () => {
    setSearchQuery && setSearchQuery('');
    setSortBy('default');
    setActiveTab && setActiveTab('all');
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {counts.completed > 0 && onClearCompleted && (
              <button
                type="button"
                className="btn btn-secondary clear-completed-header-btn"
                onClick={onClearCompleted}
                title="Remove and purge all completed tasks from UI"
                style={{ padding: '6px 10px', fontSize: '0.74rem' }}
              >
                <span>Clear Done ({counts.completed})</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary panel-add-btn"
              onClick={onOpenNewModal}
              id="btn-header-add-reminder"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search reminders, places, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            id="input-search-reminders"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery && setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Tab Pills & Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          {setActiveTab && (
            <div className="tabs-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'all' || activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>Active</span>
                <span className="tab-count">{counts.active}</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <span>Done</span>
                <span className="tab-count">{counts.completed}</span>
              </button>
            </div>
          )}

          {onSeedLocalSamples && (
            <button
              type="button"
              className="seed-samples-btn"
              onClick={onSeedLocalSamples}
              title="Add fun nearby sample destination spots around your current location"
            >
              <Sparkles size={12} />
              <span>Demo Spots</span>
            </button>
          )}
        </div>

        {/* Sort Helpers Row */}
        <div className="sort-helpers-row">
          <div className="sort-buttons-group">
            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'nearest' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'nearest' ? 'default' : 'nearest')}
              title="Sort items by closest geographic distance to your position"
            >
              <Navigation size={11} style={{ transform: 'rotate(45deg)' }} />
              <span>Nearest</span>
            </button>

            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'priority' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'priority' ? 'default' : 'priority')}
              title="Sort by highest priority"
            >
              <ArrowUpDown size={11} />
              <span>Priority</span>
            </button>

            <button
              type="button"
              className={`sort-pill-btn ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'newest' ? 'default' : 'newest')}
              title="Sort by newly created first"
            >
              <Clock size={11} />
              <span>Newest</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {activeTab === 'completed' && counts.completed > 0 && onClearCompleted && (
              <button
                type="button"
                className="clear-completed-link"
                onClick={onClearCompleted}
                title="Remove all completed tasks from UI"
              >
                <span>🧹 Clear Done ({counts.completed})</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                className="reset-filter-link"
                onClick={resetAllFilters}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reminders Scrollable Feed */}
      <div className="reminders-feed">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap pulse-anim">
              <MapPin size={32} color="var(--color-brand)" />
            </div>

            <div className="empty-content">
              <h3 className="empty-title">
                {searchQuery
                  ? 'No matching reminders'
                  : activeTab === 'completed'
                  ? 'No completed tasks yet'
                  : 'Your task list is peaceful! ✨'}
              </h3>
              <p className="empty-desc">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different keyword or clear search.`
                  : activeTab === 'completed'
                  ? 'Completed reminders will show up here once you check them off!'
                  : 'Create your first location-aware reminder or sprinkle nearby demo spots to explore!'}
              </p>
            </div>

            <div className="empty-actions-row">
              {searchQuery ? (
                <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery && setSearchQuery('')}>
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onOpenNewModal}
                    style={{ padding: '9px 18px', fontSize: '0.84rem' }}
                  >
                    <Plus size={15} />
                    <span>Create Reminder</span>
                  </button>
                  {onSeedLocalSamples && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onSeedLocalSamples}
                      style={{ padding: '9px 14px', fontSize: '0.84rem' }}
                    >
                      <Sparkles size={13} color="var(--color-pink)" />
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
              onSnooze={onSnooze}
              onUnsnooze={onUnsnooze}
            />
          ))
        )}
      </div>
    </aside>
  );
}
