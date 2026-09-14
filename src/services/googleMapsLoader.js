// Dynamic loader for Google Maps JavaScript API

let googleMapsPromise = null;
let currentLoadedKey = null;

export function loadGoogleMapsScript(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return Promise.reject(new Error('No Google Maps API key provided.'));
  }

  const cleanKey = apiKey.trim();

  // If already loaded with the same key, resolve immediately
  if (window.google && window.google.maps && currentLoadedKey === cleanKey) {
    return Promise.resolve(window.google.maps);
  }

  // If already loading with same key, reuse promise
  if (googleMapsPromise && currentLoadedKey === cleanKey) {
    return googleMapsPromise;
  }

  currentLoadedKey = cleanKey;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists and remove old one if key changed
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Hook auth failure
    window.gm_authFailure = () => {
      console.error('Google Maps API authentication failed. Check your API key.');
      reject(new Error('Google Maps API authentication failed. Check your API key.'));
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      cleanKey
    )}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = async () => {
      if (window.google && window.google.maps) {
        if (typeof window.google.maps.importLibrary === 'function') {
          try {
            await window.google.maps.importLibrary('maps');
            await window.google.maps.importLibrary('places');
          } catch (err) {
            console.warn('Google maps importLibrary note:', err);
          }
        }
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps SDK loaded but window.google.maps is undefined.'));
      }
    };

    script.onerror = (err) => {
      reject(new Error('Failed to load Google Maps SDK script.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
