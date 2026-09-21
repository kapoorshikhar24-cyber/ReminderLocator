export const MAP_PROVIDERS = [
  {
    id: 'osm',
    name: 'OpenStreetMap (Free Mode)',
    description: '100% Free, community-driven, no API key needed',
    requiresKey: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
  },
  {
    id: 'google',
    name: 'Google Maps (Official SDK)',
    description: 'Roadmap, Satellite, Terrain with your Google Maps API Key',
    requiresKey: true,
    keyPlaceholder: 'AIzaSy...',
    attribution: '&copy; Google Maps',
    maxZoom: 22,
  },
  {
    id: 'carto',
    name: 'CARTO / CartoDB',
    description: 'Voyager / Positron styles with your CARTO API Key',
    requiresKey: true,
    keyPlaceholder: 'Enter your CARTO API Key',
    getUrl: (key) =>
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${
        key ? `?api_key=${key}` : ''
      }`,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 20,
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    description: 'High-performance vector / raster tiles with Mapbox token',
    requiresKey: true,
    keyPlaceholder: 'pk.eyJ1IjoieW91ci11c2VybmFtZSI...',
    getUrl: (key) =>
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${key}`,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 22,
  },
  {
    id: 'stadia',
    name: 'Stadia Maps',
    description: 'Modern Alidade / Smooth tiles with Stadia API Key',
    requiresKey: true,
    keyPlaceholder: 'Enter Stadia Maps API Key',
    getUrl: (key) =>
      `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${
        key ? `?api_key=${key}` : ''
      }`,
    attribution: '&copy; Stadia Maps &copy; OpenStreetMap',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 20,
  },
  {
    id: 'custom',
    name: 'Custom Tile Server URL',
    description: 'Any standard XYZ tile URL template',
    requiresKey: false,
    customUrlPlaceholder: 'https://example.com/tiles/{z}/{x}/{y}.png?token=...',
    attribution: '&copy; Custom Provider',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
  },
];

const MAP_SETTINGS_KEY = 'georemind_map_settings_v2';

export function getMapConfig() {
  const envGoogleKey = (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const envProvider = (import.meta.env?.VITE_MAP_PROVIDER || 'osm').trim();
  const envKey = (import.meta.env?.VITE_MAP_API_KEY || '').trim();
  const envCustomUrl = (import.meta.env?.VITE_MAP_CUSTOM_URL || '').trim();

  const defaults = {
    providerId: envProvider || 'osm',
    apiKey: envKey,
    googleApiKey: envGoogleKey,
    customUrl: envCustomUrl,
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const stored = localStorage.getItem(MAP_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaults,
        ...parsed,
        providerId: parsed.providerId || defaults.providerId,
        googleApiKey: parsed.googleApiKey || envGoogleKey,
      };
    }
  } catch (err) {
    console.error('Error reading map settings:', err);
  }

  return defaults;
}

export function saveMapConfig(config) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAP_SETTINGS_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving map settings:', err);
  }
}

export function isGoogleMapsActive(config) {
  return config?.providerId === 'google' && !!config?.googleApiKey?.trim();
}
