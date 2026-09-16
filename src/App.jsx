import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import ReminderList from './components/ReminderList';
import MapView from './components/MapView';
import GoogleMapView from './components/GoogleMapView';
import ReminderModal from './components/ReminderModal';
import TriggerAlertModal from './components/TriggerAlertModal';
import SimulatorControl from './components/SimulatorControl';
import MapSettingsModal from './components/MapSettingsModal';
import AuthModal from './components/AuthModal';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './context/AuthContext';
import { 
  handleUserLoginSync, 
  pushSettingsToCloud, 
  pushRemindersToCloud 
} from './services/cloudSync';
import { 
  getStoredReminders, 
  saveReminders, 
  getStoredSettings, 
  saveSettings, 
  DEFAULT_COORDS, 
  getDefaultLocation,
  saveDefaultLocation,
  generateLocalSampleReminders 
} from './services/storage';
import { getMapConfig, saveMapConfig, isGoogleMapsActive } from './services/mapProviders';
import { calculateDistance, isWithinGeofence } from './services/geolocation';
import { 
  playArrivalChime, 
  playDepartureChime, 
  sendNotification, 
  requestNotificationPermission 
} from './services/notifications';
import { reverseGeocode } from './services/geocoding';
import { 
  sendArrivalAlert, 
  scheduleSnoozeNotification,
  requestAllNativePermissions, 
  requestScreenWakeLock, 
  releaseScreenWakeLock,
  getDevicePosition,
  watchDevicePosition,
  startBackgroundTracking,
  stopBackgroundTracking,
  syncRemindersToBackground,
  requestBatteryOptimizationExemption,
  checkBackgroundStatus,
  addBackgroundLocationListener,
  addBackgroundGeofenceListener,
  isNative
} from './services/nativeLocation';
import { List, Map as MapIcon, Compass, PlusCircle, Plus, Check, Sliders, Navigation, ShieldCheck, BatteryCharging } from 'lucide-react';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [reminders, setReminders] = useState(() => getStoredReminders(user?.userId || user?.id));
  const [settings, setSettings] = useState(() => getStoredSettings());
  
  // User position: start at saved default location or GPS
  const [userPos, setUserPos] = useState(() => getDefaultLocation());
  const [isSimulating, setIsSimulating] = useState(() => settings.simulationMode ?? false);
  
  // Notifications & Sound
  const [soundEnabled, setSoundEnabled] = useState(() => settings.soundEnabled ?? true);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });

  // UI state
  const [theme, setTheme] = useState(() => settings.theme || 'dark');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('list'); // 'list' or 'map'

  // Modals & triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocationCoords, setPickedLocationCoords] = useState(null);
  const [triggeredReminder, setTriggeredReminder] = useState(null);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mapConfig, setMapConfig] = useState(() => getMapConfig());
  const [toastMessage, setToastMessage] = useState(null);

  // Sync with cloud on user login
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    handleUserLoginSync(user, reminders, mapConfig, userPos).then((synced) => {
      if (!isMounted || !synced) return;

      if (synced.mapConfig) {
        setMapConfig(synced.mapConfig);
      }
      if (synced.reminders) {
        setReminders(synced.reminders);
      }
      if (synced.defaultLoc) {
        setUserPos(synced.defaultLoc);
      }

      setToastMessage('🌸 Logged in! Settings & Reminders synchronized across your devices ✨');
      setTimeout(() => setToastMessage(null), 3500);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveMapConfig = (newConfig) => {
    setMapConfig(newConfig);
    saveMapConfig(newConfig);

    // If user is logged in, automatically sync Google API key to Supabase!
    if (user?.id) {
      pushSettingsToCloud(user.id, newConfig, userPos);
      setToastMessage('✨ Google Maps settings synced to your cloud account!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSetAsDefaultLocation = (coords) => {
    const target = coords || userPos;
    if (!target) return;
    saveDefaultLocation(target);
    if (user?.id) {
      pushSettingsToCloud(user.id, mapConfig, target);
    }
    setToastMessage('📍 Saved as default startup location! ✨');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tracking geofence enter/exit state transitions to avoid repeat spamming
  // Map of reminderId -> { wasInside: boolean, lastTriggeredTime: number }
  const geofenceStateMap = useRef(new Map());

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveSettings({ ...settings, theme, soundEnabled, simulationMode: isSimulating });
  }, [theme, soundEnabled, isSimulating]);

  // Persist reminders whenever they change (Local Storage + Cloud)
  useEffect(() => {
    saveReminders(reminders);
    if (user?.id) {
      pushRemindersToCloud(user.id, reminders);
    }
  }, [reminders, user]);

  // Startup: Automatically detect real GPS location and set as default location
  useEffect(() => {
    let isMounted = true;

    getDevicePosition()
      .then((coords) => {
        if (!isMounted || !coords) return;
        const { lat, lng } = coords;
        const initialUserLocation = { lat, lng };
        setUserPos(initialUserLocation);
        saveDefaultLocation(initialUserLocation);

        // If the current reminders are still the factory San Francisco defaults
        // and the user is located elsewhere, auto-recenter demo reminders around real location!
        setReminders((prev) => {
          const hasOnlyDefaultSF =
            prev.length > 0 &&
            prev.every(
              (r) =>
                r.id &&
                r.id.startsWith('rem-') &&
                !r.id.startsWith('rem-local-') &&
                r.location?.lat &&
                Math.abs(r.location.lat - 37.7749) < 0.1
            );
          const isFarFromSF =
            Math.abs(lat - 37.7749) > 0.5 || Math.abs(lng - (-122.4194)) > 0.5;

          if (hasOnlyDefaultSF && isFarFromSF) {
            const localSamples = generateLocalSampleReminders(lat, lng);
            saveReminders(localSamples);
            return localSamples;
          }
          return prev;
        });
      })
      .catch((err) => {
        console.warn('Initial geolocation detection error:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live GPS Watcher (when NOT in simulation mode)
  useEffect(() => {
    if (isSimulating) return;

    let cleanup = () => {};

    watchDevicePosition(
      (livePos) => {
        setUserPos(livePos);
        saveDefaultLocation(livePos);
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
      }
    ).then((stopWatching) => {
      if (typeof stopWatching === 'function') {
        cleanup = stopWatching;
      }
    });

    return () => cleanup();
  }, [isSimulating]);

  // Background Tracking & Native Geofence Synchronization
  useEffect(() => {
    // Start background tracking with current active reminders
    startBackgroundTracking(reminders).catch(console.warn);

    // Sync reminders to native background service whenever reminders change
    syncRemindersToBackground(reminders);
  }, [reminders]);

  // Attach native background location & geofence event listeners
  useEffect(() => {
    const unsubLocation = addBackgroundLocationListener((livePos) => {
      if (!isSimulating && livePos) {
        setUserPos(livePos);
        saveDefaultLocation(livePos);
      }
    });

    const unsubGeofence = addBackgroundGeofenceListener((triggerData) => {
      if (triggerData?.reminderId) {
        const found = reminders.find((r) => String(r.id) === String(triggerData.reminderId));
        if (found) {
          setTriggeredReminder(found);
        }
      }
    });

    return () => {
      unsubLocation();
      unsubGeofence();
    };
  }, [isSimulating, reminders]);

  // Request notification and native background permissions
  const handleRequestNotification = async () => {
    await requestAllNativePermissions();
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (isNative()) {
      await requestBatteryOptimizationExemption();
    }
  };

  // Auto-request notifications and background permissions on startup by default
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRequestNotification().catch(console.warn);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Trigger Execution: Modal + Sound + System Push Notification (Pocket / Lock Screen)
  const executeTrigger = (reminder, eventType, distance) => {
    const notifTitle =
      eventType === 'exit'
        ? `Leaving: ${reminder.title}`
        : `Arrived at ${reminder.location?.name || 'Target'}!`;
    const notifBody = reminder.notes || `You are within ${reminder.location?.radius || 100}m of your reminder location.`;

    // Native & Web notification with sound & vibration
    sendArrivalAlert({
      title: notifTitle,
      body: notifBody,
      reminderId: reminder.id,
    });

    // Show In-App Alert Modal if on screen
    setTriggeredReminder(reminder);
  };

  // Main Geofencing Engine: runs whenever userPos updates
  useEffect(() => {
    if (!userPos) return;

    const now = Date.now();
    const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown before re-alerting same geofence

    reminders.forEach((rem) => {
      if (rem.completed || !rem.location || !rem.location.lat || !rem.location.lng) {
        return;
      }

      const { lat, lng, radius = 100, triggerType = 'enter' } = rem.location;
      const distance = calculateDistance(userPos.lat, userPos.lng, lat, lng);
      const isInsideNow = distance <= radius;

      const previousState = geofenceStateMap.current.get(rem.id) || {
        wasInside: false,
        lastTriggeredTime: 0,
      };

      const hasCooldownElapsed = now - previousState.lastTriggeredTime > COOLDOWN_MS;

      // Case A: Enter trigger (User crossed from OUTSIDE to INSIDE)
      if (triggerType === 'enter') {
        if (isInsideNow && (!previousState.wasInside || hasCooldownElapsed)) {
          // Trigger Arrival!
          executeTrigger(rem, 'enter', distance);
          geofenceStateMap.current.set(rem.id, { wasInside: true, lastTriggeredTime: now });
          return;
        }
      }

      // Case B: Exit trigger (User was INSIDE and now exited OUTSIDE)
      if (triggerType === 'exit') {
        if (!isInsideNow && previousState.wasInside && hasCooldownElapsed) {
          // Trigger Departure!
          executeTrigger(rem, 'exit', distance);
          geofenceStateMap.current.set(rem.id, { wasInside: false, lastTriggeredTime: now });
          return;
        }
      }

      // Update position state without triggering
      geofenceStateMap.current.set(rem.id, {
        wasInside: isInsideNow,
        lastTriggeredTime: previousState.lastTriggeredTime,
      });
    });
  }, [userPos, reminders]);

  // Toggle completion
  const handleToggleComplete = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  // Delete reminder
  const handleDeleteReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Open Edit Modal
  const handleEditReminder = (rem) => {
    setEditingReminder(rem);
    setIsModalOpen(true);
  };

  // Open New Modal
  const handleOpenNewModal = () => {
    setEditingReminder(null);
    setPickedLocationCoords(null);
    setIsModalOpen(true);
  };

  // Save Reminder (New or Edit)
  const handleSaveReminder = (reminderData) => {
    if (editingReminder) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editingReminder.id ? { ...reminderData, id: r.id } : r))
      );
    } else {
      const newReminder = {
        ...reminderData,
        id: `rem-${Date.now()}`,
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  // One-click Teleport / Arrival Simulation for a specific reminder
  const handleSimulateArrival = (rem) => {
    if (!rem.location?.lat) return;
    setIsSimulating(true);
    // Move user position right into the center of the geofence
    setUserPos({ lat: rem.location.lat, lng: rem.location.lng });
  };

  // Center map on a specific reminder
  const handleCenterMap = (rem) => {
    if (rem?.location?.lat && rem?.location?.lng) {
      setUserPos({ lat: rem.location.lat, lng: rem.location.lng });
      setMobileTab('map');
      setToastMessage(`📍 Centered on ${rem.location.name || rem.title}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Teleport to coordinates
  const handleTeleport = (lat, lng, name) => {
    setIsSimulating(true);
    setUserPos({ lat, lng });
  };

  const isPickingLocationRef = useRef(false);
  useEffect(() => {
    isPickingLocationRef.current = isPickingLocation;
  }, [isPickingLocation]);

  // Map click handler (when picking a location for a new reminder)
  const handleMapClickCoordinates = async ({ lat, lng }) => {
    if (isPickingLocationRef.current) {
      setPickedLocationCoords({ lat, lng, name: 'Resolving address...' });
      try {
        const placeName = await reverseGeocode(lat, lng);
        setPickedLocationCoords({ lat, lng, name: placeName });
      } catch (err) {
        setPickedLocationCoords({
          lat,
          lng,
          name: `Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
      }
    }
  };

  // Start full map picker mode without closing the draft
  const handleStartMapPicker = (currentLoc) => {
    setIsPickingLocation(true);
    setMobileTab('map');
    if (currentLoc?.lat && currentLoc?.lng) {
      setPickedLocationCoords(currentLoc);
    } else if (userPos) {
      setPickedLocationCoords({
        lat: userPos.lat,
        lng: userPos.lng,
        name: 'Current Spot',
      });
    }
  };

  // Confirm picked location and return to modal
  const handleConfirmMapPickedLocation = () => {
    setIsPickingLocation(false);
    setIsModalOpen(true);
    setMobileTab('list');
  };

  const handleCancelMapPicker = () => {
    setIsPickingLocation(false);
    setIsModalOpen(true);
    setMobileTab('list');
  };

  // Seed sample reminders right around user's current GPS position
  const handleSeedLocalSamples = () => {
    if (!userPos) return;
    const samples = generateLocalSampleReminders(userPos.lat, userPos.lng);
    setReminders((prev) => [...samples, ...prev]);
  };

  // Trigger modal actions
  const handleCompleteTriggered = (id) => {
    handleToggleComplete(id);
    setTriggeredReminder(null);
  };

  const handleSnoozeTriggered = (id) => {
    const reminder = reminders.find((r) => r.id === id);
    setTriggeredReminder(null);
    // Reset cooldown to snooze for 10 minutes in memory
    const record = geofenceStateMap.current.get(id);
    if (record) {
      geofenceStateMap.current.set(id, {
        ...record,
        lastTriggeredTime: Date.now() + 10 * 60 * 1000,
      });
    }

    // Schedule OS-level notification so user is notified even if app is closed/in background
    if (reminder) {
      scheduleSnoozeNotification({ reminder, minutes: 10 });
    }
  };

  // Persist reminders to localStorage and cloud whenever updated
  useEffect(() => {
    if (user) {
      saveReminders(reminders, user.userId || user.id);
      if (user.id && !user.isLocal) {
        pushRemindersToCloud(user.id, reminders);
      }
    }
  }, [reminders, user]);

  // Load user's reminders when user account changes
  useEffect(() => {
    if (user) {
      const stored = getStoredReminders(user.userId || user.id);
      setReminders(stored);
    }
  }, [user?.userId, user?.id]);

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-brand-badge pulse-anim">
          <Navigation size={32} />
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontWeight: 600 }}>
          Loading GeoRemind...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLoginSuccess={() => {
          setToastMessage('✨ Welcome to GeoRemind!');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    );
  }

  return (
    <div className="app-container" data-theme={theme}>
      {/* Top Navigation */}
      <Navbar
        userPos={userPos}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        notificationPermission={notificationPermission}
        onRequestNotification={handleRequestNotification}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        theme={theme}
        setTheme={setTheme}
        onOpenNewModal={handleOpenNewModal}
        onOpenMapSettings={() => setIsMapSettingsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={signOut}
        user={user}
      />

      {/* Overview Stats Bar */}
      <StatsBar reminders={reminders} userPos={userPos} />

      {/* Main Workspace (Split Grid on Desktop, Toggle Tabs on Mobile) */}
      <main className="main-workspace">
        {/* Left Pane: Reminders Feed */}
        <div className={`reminders-panel-wrap ${mobileTab === 'map' ? 'mobile-hide' : ''}`}>
          <ReminderList
            reminders={reminders}
            userPos={userPos}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onToggleComplete={handleToggleComplete}
            onEditReminder={handleEditReminder}
            onDeleteReminder={handleDeleteReminder}
            onSimulateArrival={handleSimulateArrival}
            onOpenNewModal={handleOpenNewModal}
            onSeedLocalSamples={handleSeedLocalSamples}
            onCenterMap={handleCenterMap}
          />
        </div>

        {/* Right Pane: Interactive Map & Simulator */}
        <div className={`map-pane-wrap ${mobileTab === 'list' ? 'mobile-hide' : ''}`} style={{ position: 'relative', height: '100%' }}>
          
          {/* Floating Map Picker Interactive Banner */}
          {isPickingLocation && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1500,
                background: 'rgba(15, 23, 42, 0.95)',
                border: '2px solid var(--color-brand)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                width: 'calc(100% - 24px)',
                maxWidth: '580px',
                backdropFilter: 'blur(16px)',
                animation: 'popIn 0.2s ease-out',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
                <span className="pulse-dot" style={{ background: '#ef4444', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                    Tap map or drag pin
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-brand)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '240px',
                    }}
                  >
                    📍 {pickedLocationCoords?.name || 'Resolving location...'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                  onClick={handleCancelMapPicker}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.74rem' }}
                  onClick={handleConfirmMapPickedLocation}
                  id="btn-confirm-picked-location"
                >
                  <Check size={14} />
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          )}

          {isGoogleMapsActive(mapConfig) ? (
            <GoogleMapView
              userPos={userPos}
              reminders={reminders}
              onSimulateTeleport={handleTeleport}
              isPickingLocation={isPickingLocation}
              onMapClickCoordinates={handleMapClickCoordinates}
              pickedLocationCoords={pickedLocationCoords}
              apiKey={mapConfig.googleApiKey}
              onFallbackToFreeMode={() =>
                handleSaveMapConfig({ ...mapConfig, providerId: 'osm' })
              }
              onSetAsDefault={handleSetAsDefaultLocation}
            />
          ) : (
            <MapView
              userPos={userPos}
              reminders={reminders}
              onSimulateTeleport={handleTeleport}
              isPickingLocation={isPickingLocation}
              onMapClickCoordinates={handleMapClickCoordinates}
              pickedLocationCoords={pickedLocationCoords}
              theme={theme}
              mapConfig={mapConfig}
              onSetAsDefault={handleSetAsDefaultLocation}
            />
          )}

          {/* Floating Desktop GPS Simulator Control */}
          <SimulatorControl
            userPos={userPos}
            setUserPos={setUserPos}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            reminders={reminders}
            onTeleport={handleTeleport}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav-bar">
        <div className="mobile-nav-items">
          <button
            className={`mobile-nav-btn ${mobileTab === 'list' ? 'active' : ''}`}
            onClick={() => setMobileTab('list')}
          >
            <List size={20} />
            <span>Reminders</span>
          </button>

          <button
            className={`mobile-nav-btn ${mobileTab === 'map' ? 'active' : ''}`}
            onClick={() => setMobileTab('map')}
          >
            <MapIcon size={20} />
            <span>Map</span>
          </button>

          {/* Center Elevated Floating Add Button */}
          <button
            className="mobile-fab-btn"
            onClick={handleOpenNewModal}
            title="Create New Reminder"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>

          <button
            className={`mobile-nav-btn ${isSimulating ? 'active' : ''}`}
            onClick={() => {
              setIsSimulating(!isSimulating);
              setMobileTab('map');
            }}
          >
            <Compass size={20} />
            <span>Sim</span>
          </button>

          <button
            className={`mobile-nav-btn ${isMapSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsMapSettingsOpen(true)}
          >
            <Sliders size={20} />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Create / Edit Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsPickingLocation(false);
        }}
        onSave={handleSaveReminder}
        editReminder={editingReminder}
        userPos={userPos}
        onStartMapPicker={handleStartMapPicker}
        pickedLocationCoords={pickedLocationCoords}
        isPickingFullScreen={isPickingLocation}
      />

      {/* Trigger Heads-Up Arrival Celebration Modal */}
      <TriggerAlertModal
        triggeredReminder={triggeredReminder}
        onComplete={handleCompleteTriggered}
        onSnooze={handleSnoozeTriggered}
        onDismiss={() => setTriggeredReminder(null)}
      />

      {/* Map Provider & API Key Settings Modal */}
      <MapSettingsModal
        isOpen={isMapSettingsOpen}
        onClose={() => setIsMapSettingsOpen(false)}
        currentConfig={mapConfig}
        onSaveConfig={handleSaveMapConfig}
      />

      {/* User Auth & Cross-Device Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        googleApiKey={mapConfig?.googleApiKey}
        isSynced={Boolean(user)}
        onForceSync={() => handleUserLoginSync(user, reminders, mapConfig, userPos)}
      />

      {/* Floating Status Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface-elevated)',
            border: '1.5px solid var(--color-brand)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 22px',
            color: 'var(--text-primary)',
            fontSize: '0.86rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'cutePopIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
