import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, PlusCircle, Navigation, MapPin, Bookmark } from 'lucide-react';
import { calculateDistance, formatDistance } from '../services/geolocation';
import { MAP_PROVIDERS } from '../services/mapProviders';

export default function MapView({
  userPos,
  reminders,
  onSelectReminder,
  onSimulateTeleport,
  isPickingLocation,
  onMapClickCoordinates,
  pickedLocationCoords,
  theme,
  mapConfig,
  onSetAsDefault,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);
  const pickedMarkerRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const onMapClickRef = useRef(onMapClickCoordinates);
  const hasAutoCenteredRef = useRef(false);
  const [savedDefault, setSavedDefault] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClickCoordinates;
  }, [onMapClickCoordinates]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = userPos?.lat || 37.7749;
    const initialLng = userPos?.lng || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
    });

    // Add zoom control to top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Handle map clicks (e.g. For picking locations)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (onMapClickRef.current) {
        onMapClickRef.current({ lat, lng });
      }
    });

    // Auto-invalidate map size when container is resized or unhidden on mobile
    let resizeObserver = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer dynamically when mapConfig changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const provider =
      MAP_PROVIDERS.find((p) => p.id === mapConfig?.providerId) || MAP_PROVIDERS[0];
    let tileUrl = provider.url;
    if (provider.getUrl) {
      tileUrl = provider.getUrl(mapConfig?.apiKey);
    } else if (provider.id === 'custom' && mapConfig?.customUrl) {
      tileUrl = mapConfig.customUrl;
    }

    const newTiles = L.tileLayer(tileUrl, {
      maxZoom: provider.maxZoom || 19,
      subdomains: provider.subdomains || ['a', 'b', 'c'],
      attribution: provider.attribution,
    }).addTo(map);

    currentTileLayerRef.current = newTiles;
  }, [mapConfig]);

  // Update User Marker & Auto-Center on Initial Load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPos) return;

    // Automatically pan to user's real location when it is detected on app load
    if (!hasAutoCenteredRef.current) {
      map.setView([userPos.lat, userPos.lng], 16);
      hasAutoCenteredRef.current = true;
    }

    const userIcon = L.divIcon({
      className: 'user-radar-divicon',
      html: `
        <div class="user-radar-marker">
          <div class="user-marker-ring"></div>
          <div class="user-marker-center"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarkerRef.current.bindTooltip('<b>Your Current Location</b>', {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
      });
    } else {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    }
  }, [userPos]);

  // Update Reminder Markers & Geofence Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const activeRemindersWithLocation = reminders.filter(
      (r) => r.location && r.location.lat && r.location.lng && !r.completed
    );

    activeRemindersWithLocation.forEach((rem) => {
      const { lat, lng, radius = 100, name = 'Target Location' } = rem.location;
      const distance = userPos ? calculateDistance(userPos.lat, userPos.lng, lat, lng) : null;
      const isInside = distance !== null && distance <= radius;

      // Color scheme based on state
      const circleColor = isInside ? '#10b981' : '#38bdf8';
      const circleFill = isInside ? '#10b981' : '#0284c7';

      // 1. Geofence Circle
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: circleColor,
        weight: 2,
        fillColor: circleFill,
        fillOpacity: isInside ? 0.28 : 0.12,
        dashArray: isInside ? null : '4, 4',
        interactive: !isPickingLocation,
      }).addTo(group);

      // 2. Custom Marker Pin
      const pinIcon = L.divIcon({
        className: 'custom-pin-divicon',
        html: `
          <div class="custom-pin-marker">
            <div class="pin-icon-circle" style="border-color: ${circleColor}; ${
              isInside ? 'background:#064e3b; color:#34d399;' : ''
            }">
              <span>📍</span>
            </div>
            <div class="pin-label-pill">${escapeHtml(rem.title.slice(0, 22))}${
              rem.title.length > 22 ? '...' : ''
            }</div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(group);

      if (isPickingLocation) {
        marker.on('click', () => {
          if (onMapClickCoordinates) {
            onMapClickCoordinates({ lat, lng });
          }
        });
      } else {
        // Interactive Popup
        const popupHtml = `
          <div style="min-width: 200px; padding: 4px; font-family: sans-serif;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(rem.title)}</h4>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">📍 ${escapeHtml(name)}</p>
            <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: ${isInside ? '#059669' : '#0284c7'};">
              ${isInside ? '🎯 Inside Geofence!' : `Proximity: ${formatDistance(distance)} (Radius: ${radius}m)`}
            </div>
            <div style="display: flex; gap: 6px;">
              <button id="sim-btn-${rem.id}" style="
                flex: 1;
                background: #0284c7;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
              ">
                🚀 Simulate Arriving
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`sim-btn-${rem.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSimulateTeleport) {
                onSimulateTeleport(lat, lng, rem.title);
              }
            };
          }
        });
      }
    });
  }, [reminders, userPos, isPickingLocation]);

  // Update Picked Location Pin on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickedLocationCoords?.lat && pickedLocationCoords?.lng) {
      const { lat, lng, name } = pickedLocationCoords;

      const pickedIcon = L.divIcon({
        className: 'picked-pin-divicon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; box-shadow: 0 0 15px rgba(239, 68, 68, 0.7);">
              📍
            </div>
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap;">
              ${escapeHtml(name || 'Selected Pin')} (Drag to adjust)
            </div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 30],
      });

      if (!pickedMarkerRef.current) {
        pickedMarkerRef.current = L.marker([lat, lng], {
          icon: pickedIcon,
          draggable: true,
          zIndexOffset: 2000,
        }).addTo(map);

        pickedMarkerRef.current.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          if (onMapClickCoordinates) {
            onMapClickCoordinates({ lat: newPos.lat, lng: newPos.lng });
          }
        });
      } else {
        pickedMarkerRef.current.setLatLng([lat, lng]);
      }
    } else {
      if (pickedMarkerRef.current) {
        map.removeLayer(pickedMarkerRef.current);
        pickedMarkerRef.current = null;
      }
    }
  }, [pickedLocationCoords]);

  // Recenter map handler
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map && userPos) {
      map.flyTo([userPos.lat, userPos.lng], 16, { duration: 1.2 });
    }
  };

  const handleSaveAsDefault = () => {
    if (onSetAsDefault && userPos) {
      onSetAsDefault(userPos);
      setSavedDefault(true);
      setTimeout(() => setSavedDefault(false), 2500);
    }
  };

  return (
    <div className="map-workspace" style={{ cursor: isPickingLocation ? 'crosshair' : 'default' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating map controls */}
      <div className="map-overlay-controls">
        <button
          className="map-control-btn"
          onClick={handleRecenter}
          title="Recenter map to my position"
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

        {isPickingLocation && (
          <div
            style={{
              background: '#0284c7',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MapPin size={16} />
            <span>Click map to place reminder pin</span>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
