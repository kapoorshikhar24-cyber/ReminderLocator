import React, { useEffect, useRef, useState } from 'react';
import { Locate, MapPin, AlertTriangle, RefreshCw, Bookmark } from 'lucide-react';
import { loadGoogleMapsScript } from '../services/googleMapsLoader';
import { calculateDistance, formatDistance } from '../services/geolocation';

export default function GoogleMapView({
  userPos,
  reminders,
  onSimulateTeleport,
  isPickingLocation,
  onMapClickCoordinates,
  pickedLocationCoords,
  apiKey,
  onFallbackToFreeMode,
  onSetAsDefault,
}) {
  const containerRef = useRef(null);
  const googleMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const reminderMarkersRef = useRef([]);
  const circlesRef = useRef([]);
  const infoWindowRef = useRef(null);
  const pickedMarkerRef = useRef(null);
  const onMapClickRef = useRef(onMapClickCoordinates);
  const hasAutoCenteredRef = useRef(false);
  const [savedDefault, setSavedDefault] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClickCoordinates;
  }, [onMapClickCoordinates]);

  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google Map
  useEffect(() => {
    if (!containerRef.current || !apiKey) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!isMounted || !containerRef.current) return;

        const initialCenter = {
          lat: userPos?.lat || 37.7749,
          lng: userPos?.lng || -122.4194,
        };

        const MapClass = maps.Map || window.google?.maps?.Map;
        if (!MapClass) {
          throw new Error('Google Maps Map constructor is not available yet.');
        }

        const map = new MapClass(containerRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        googleMapRef.current = map;
        const InfoWindowClass = maps.InfoWindow || window.google?.maps?.InfoWindow;
        infoWindowRef.current = new InfoWindowClass();

        // Map click handler
        map.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (onMapClickRef.current) {
            onMapClickRef.current({ lat, lng });
          }
        });

        setIsLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Google Maps initialization error:', err);
          setLoadError(err.message || 'Could not load Google Maps with provided key.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Update User Marker & Auto-Center on Initial Load
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !userPos || !window.google?.maps) return;

    if (!hasAutoCenteredRef.current) {
      map.setCenter({ lat: userPos.lat, lng: userPos.lng });
      map.setZoom(16);
      hasAutoCenteredRef.current = true;
    }

    const maps = window.google.maps;
    const pos = { lat: userPos.lat, lng: userPos.lng };

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maps.Marker({
        position: pos,
        map,
        title: 'Your Location',
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#38bdf8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        zIndex: 999,
      });
    } else {
      userMarkerRef.current.setPosition(pos);
    }
  }, [userPos]);

  // Update Picked Location Pin (Draggable & Clickable)
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !window.google?.maps) return;

    const maps = window.google.maps;

    if (pickedLocationCoords?.lat && pickedLocationCoords?.lng) {
      const pos = { lat: pickedLocationCoords.lat, lng: pickedLocationCoords.lng };

      if (!pickedMarkerRef.current) {
        pickedMarkerRef.current = new maps.Marker({
          position: pos,
          map,
          title: 'Picked Location (Drag to adjust)',
          draggable: true,
          animation: maps.Animation.DROP,
          zIndex: 1001,
        });

        pickedMarkerRef.current.addListener('dragend', (e) => {
          if (onMapClickCoordinates) {
            onMapClickCoordinates({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      } else {
        pickedMarkerRef.current.setPosition(pos);
      }
    } else {
      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.setMap(null);
        pickedMarkerRef.current = null;
      }
    }
  }, [pickedLocationCoords]);

  // Update Reminder Markers & Geofence Circles
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !window.google?.maps) return;

    const maps = window.google.maps;

    // Clear existing markers & circles
    reminderMarkersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current.forEach((c) => c.setMap(null));
    reminderMarkersRef.current = [];
    circlesRef.current = [];

    const activeReminders = reminders.filter(
      (r) => r.location && r.location.lat && r.location.lng && !r.completed
    );

    activeReminders.forEach((rem) => {
      const { lat, lng, radius = 100, name = 'Target Location' } = rem.location;
      const center = { lat, lng };

      const distance = userPos
        ? calculateDistance(userPos.lat, userPos.lng, lat, lng)
        : null;
      const isInside = distance !== null && distance <= radius;
      const circleColor = isInside ? '#10b981' : '#0284c7';

      // 1. Geofence Circle - clickable false so map clicks are not blocked!
      const circle = new maps.Circle({
        map,
        center,
        radius,
        strokeColor: circleColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: circleColor,
        fillOpacity: isInside ? 0.25 : 0.12,
        clickable: false,
      });
      circlesRef.current.push(circle);

      // 2. Marker Pin
      const marker = new maps.Marker({
        position: center,
        map,
        title: rem.title,
      });

      marker.addListener('click', () => {
        // If picking, clicking a marker picks that location
        if (isPickingLocation && onMapClickCoordinates) {
          onMapClickCoordinates({ lat, lng });
          return;
        }

        const content = document.createElement('div');
        content.style.cssText = 'padding: 4px; font-family: sans-serif; color: #0f172a; min-width: 200px;';
        content.innerHTML = `
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${escapeHtml(rem.title)}</h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">📍 ${escapeHtml(name)}</p>
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 700; color: ${
            isInside ? '#10b981' : '#0284c7'
          };">
            ${isInside ? '🎯 Inside Geofence!' : `Distance: ${formatDistance(distance)} (Radius: ${radius}m)`}
          </div>
          <button id="gm-sim-${rem.id}" style="
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
          ">
            🚀 Simulate Arriving
          </button>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);

        setTimeout(() => {
          const btn = document.getElementById(`gm-sim-${rem.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSimulateTeleport) {
                onSimulateTeleport(lat, lng, rem.title);
              }
              infoWindowRef.current.close();
            };
          }
        }, 100);
      });

      reminderMarkersRef.current.push(marker);
    });
  }, [reminders, userPos, isPickingLocation]);

  // Recenter handler
  const handleRecenter = () => {
    const map = googleMapRef.current;
    if (map && userPos) {
      map.panTo({ lat: userPos.lat, lng: userPos.lng });
      map.setZoom(16);
    }
  };

  const handleSaveAsDefault = () => {
    if (onSetAsDefault && userPos) {
      onSetAsDefault(userPos);
      setSavedDefault(true);
      setTimeout(() => setSavedDefault(false), 2500);
    }
  };

  if (loadError) {
    return (
      <div
        className="map-workspace"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          gap: '14px',
        }}
      >
        <AlertTriangle size={48} color="#ef4444" />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Google Maps Error</h3>
        <p style={{ maxWidth: '400px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {loadError}
        </p>
        <button className="btn btn-primary" onClick={onFallbackToFreeMode}>
          <RefreshCw size={16} />
          <span>Switch to Free Mode (OpenStreetMap)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="map-workspace" style={{ cursor: isPickingLocation ? 'crosshair' : 'default' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating map controls */}
      <div className="map-overlay-controls">
        <button
          className="map-control-btn"
          onClick={handleRecenter}
          title="Recenter to my position"
        >
          <Locate size={16} />
          <span>My Location</span>
        </button>

        <button
          className="map-control-btn"
          onClick={handleSaveAsDefault}
          title="Set current position as default location on app load"
        >
          <Bookmark size={15} color={savedDefault ? '#34d399' : '#38bdf8'} />
          <span>{savedDefault ? '✓ Default Saved!' : 'Set as Default'}</span>
        </button>
      </div>
    </div>
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
