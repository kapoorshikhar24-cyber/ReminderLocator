/**
 * Calculate the great circle distance between two points in meters using Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters into human-readable distance (m or km)
 */
export function formatDistance(meters) {
  if (meters === undefined || meters === null || meters === Infinity) {
    return 'Distance unknown';
  }
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Check if user is within the geofence radius
 */
export function isWithinGeofence(userLat, userLng, targetLat, targetLng, radius) {
  const dist = calculateDistance(userLat, userLng, targetLat, targetLng);
  return dist <= radius;
}

/**
 * Interpolate coordinate towards a target by a given distance in meters
 */
export function moveTowards(currentLat, currentLng, targetLat, targetLng, distanceMeters) {
  const totalDist = calculateDistance(currentLat, currentLng, targetLat, targetLng);
  if (totalDist <= distanceMeters || totalDist === 0) {
    return { lat: targetLat, lng: targetLng, reached: true };
  }
  const ratio = distanceMeters / totalDist;
  const newLat = currentLat + (targetLat - currentLat) * ratio;
  const newLng = currentLng + (targetLng - currentLng) * ratio;
  return { lat: newLat, lng: newLng, reached: false };
}
