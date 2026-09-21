/**
 * Robust Multi-Provider Geocoding Service
 * Uses Google Places/Geocoder when Google Maps is active,
 * and Photon (fast, unthrottled OpenStreetMap data) with Nominatim fallback for Free Mode.
 */

export async function searchPlaces(query, userPos = null) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // 1. Try Google Maps Geocoder / Places if Google SDK is loaded
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const request = { address: cleanQuery };
      if (userPos?.lat && userPos?.lng) {
        request.location = { lat: userPos.lat, lng: userPos.lng };
      }

      const response = await new Promise((resolve, reject) => {
        geocoder.geocode(request, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });

      if (response.length > 0) {
        return response.slice(0, 6).map((item) => ({
          placeId: item.place_id,
          name: item.formatted_address.split(',')[0],
          displayName: item.formatted_address,
          lat: item.geometry.location.lat(),
          lng: item.geometry.location.lng(),
        }));
      }
    } catch (err) {
      console.warn('Google Geocoder search fallback to Photon:', err);
    }
  }

  // 2. Primary Free Search: Photon API (Fast, CORS-friendly, built on OpenStreetMap)
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=6`;
    if (userPos?.lat && userPos?.lng) {
      url += `&lat=${userPos.lat}&lon=${userPos.lng}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return data.features.map((f) => {
          const p = f.properties;
          const [lon, lat] = f.geometry.coordinates;
          const parts = [p.name, p.street, p.city || p.town || p.district, p.state, p.country].filter(Boolean);
          const name = p.name || parts[0] || 'Found Location';
          const displayName = parts.join(', ');

          return {
            placeId: `photon-${p.osm_id || Math.random()}`,
            name,
            displayName,
            lat,
            lng: lon,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Photon geocode search failed, trying fallback:', err);
  }

  // 3. Fallback: OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&limit=5&addressdetails=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.map((item) => ({
        placeId: `osm-${item.place_id}`,
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    }
  } catch (err) {
    console.warn('Nominatim search failed:', err);
  }

  return [];
}

/**
 * Reverse geocode coordinate to friendly street name / place name
 */
export async function reverseGeocode(lat, lng) {
  if (lat === undefined || lng === undefined) return 'Selected Location';

  // 1. Try Google Geocoder if available
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve(null);
          }
        });
      });
      if (response) {
        const parts = response.split(',');
        return parts.slice(0, 2).join(',').trim();
      }
    } catch (err) {
      console.warn('Google reverse geocode failed, using Photon:', err);
    }
  }

  // 2. Photon reverse geocoding
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features[0]) {
        const p = data.features[0].properties;
        const nameParts = [p.name, p.street, p.city || p.district].filter(Boolean);
        if (nameParts.length > 0) {
          return nameParts.slice(0, 2).join(', ');
        }
      }
    }
  } catch {
    // Fall through
  }

  // 3. Fallback coordinates string
  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
