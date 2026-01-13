// src/hooks/useGeolocation.js
// Small reusable geolocation utilities (promise-based)
export default function useGeolocation() {
  function getCurrentPositionAsync(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async function checkPermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state; // 'granted' | 'prompt' | 'denied'
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  return { getCurrentPositionAsync, checkPermission };
}
