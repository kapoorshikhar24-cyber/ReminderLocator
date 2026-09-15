import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Footprints, 
  Car, 
  Play, 
  Square, 
  MapPin, 
  Zap, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { moveTowards, calculateDistance, formatDistance } from '../services/geolocation';

export default function SimulatorControl({
  userPos,
  setUserPos,
  isSimulating,
  setIsSimulating,
  reminders,
  onTeleport,
}) {
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [speed, setSpeed] = useState(30); // meters per step
  const [isCollapsed, setIsCollapsed] = useState(false);
  const walkIntervalRef = useRef(null);

  // Find nearest active location reminder
  const activeLocReminders = reminders.filter(
    (r) => r.location && r.location.lat && !r.completed
  );

  let nearest = null;
  let minDistance = Infinity;

  if (userPos) {
    activeLocReminders.forEach((r) => {
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

  // Auto-walk step simulation towards nearest reminder
  useEffect(() => {
    if (isAutoWalking && nearest && userPos) {
      walkIntervalRef.current = setInterval(() => {
        setUserPos((prevPos) => {
          if (!prevPos || !nearest) return prevPos;
          const { lat, lng, reached } = moveTowards(
            prevPos.lat,
            prevPos.lng,
            nearest.location.lat,
            nearest.location.lng,
            speed
          );
          if (reached) {
            setIsAutoWalking(false);
          }
          return { lat, lng };
        });
      }, 1000);
    } else {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    }

    return () => {
      if (walkIntervalRef.current) {
        clearInterval(walkIntervalRef.current);
      }
    };
  }, [isAutoWalking, nearest, speed]);

  // Step 50m closer manually
  const handleStepCloser = () => {
    if (!nearest || !userPos) return;
    const { lat, lng } = moveTowards(
      userPos.lat,
      userPos.lng,
      nearest.location.lat,
      nearest.location.lng,
      50
    );
    setUserPos({ lat, lng });
  };

  if (!isSimulating) {
    return (
      <div
        className="hide-mobile"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <button
          className="btn btn-secondary"
          style={{
            background: 'var(--bg-surface-elevated)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-lg)',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            gap: '8px',
          }}
          onClick={() => setIsSimulating(true)}
        >
          <Compass size={16} color="#f59e0b" />
          <span>Open GPS Movement Simulator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="simulator-panel">
      <div className="sim-header">
        <div className="sim-title">
          <Compass size={18} />
          <span>GPS Movement Simulator</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            onClick={() => {
              setIsAutoWalking(false);
              setIsSimulating(false);
            }}
          >
            Exit Simulator
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick jump to preset location reminders */}
          <div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Teleport immediately into target geofence:
            </div>
            <div className="sim-presets-bar">
              {activeLocReminders.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No active location reminders. Create one or click "Add Nearby Demos"!
                </span>
              ) : (
                activeLocReminders.map((rem) => (
                  <button
                    key={rem.id}
                    className="sim-preset-btn"
                    onClick={() => {
                      setIsAutoWalking(false);
                      onTeleport(rem.location.lat, rem.location.lng, rem.title);
                    }}
                  >
                    🎯 {rem.title.slice(0, 20)}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Real-time simulation walking controls */}
          {nearest && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: '0.8rem',
                gap: '8px',
              }}
            >
              <div style={{ minWidth: '160px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Targeting: </span>
                <b>{nearest.title.slice(0, 24)}</b> ({formatDistance(minDistance)} away)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                  onClick={handleStepCloser}
                  disabled={isAutoWalking}
                  title="Move 50 meters towards the nearest reminder"
                >
                  <Footprints size={14} />
                  <span>Step +50m</span>
                </button>

                <button
                  className={`btn ${isAutoWalking ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                  onClick={() => setIsAutoWalking(!isAutoWalking)}
                  title={isAutoWalking ? 'Stop walking' : 'Auto walk step-by-step towards target'}
                >
                  {isAutoWalking ? (
                    <>
                      <Square size={14} />
                      <span>Stop Walk</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Auto Walk</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Current coordinates status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Current Sim GPS: {userPos?.lat.toFixed(5)}, {userPos?.lng.toFixed(5)}
            </span>
            <span>Speed: {speed}m/sec (~{(speed * 3.6).toFixed(0)} km/h)</span>
          </div>
        </>
      )}
    </div>
  );
}
