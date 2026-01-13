// src/utils/mapManager.js
// Simple Map manager to host map-related helpers that require access to the map instance.
// This keeps features like the user-location marker centralized and reusable.

import mapboxgl from 'mapbox-gl';

export function createMapManager(mapInstance) {
  if (!mapInstance) throw new Error('map instance required');
  let userMarker = null;

  function setUserLocation(coords) {
    // coords: [lng, lat]
    if (!coords || !Array.isArray(coords) || coords.length !== 2) return;
    // remove old marker
    if (userMarker) {
      try { userMarker.remove(); } catch (e) {}
      userMarker = null;
    }
    const el = document.createElement('div');
    el.className = 'map-user-marker';
    userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([coords[0], coords[1]])
      .addTo(mapInstance);
    try { mapInstance.flyTo({ center: [coords[0], coords[1]], zoom: 14 }); } catch (e) {}
    return userMarker;
  }

  function clearUserLocation() {
    if (userMarker) {
      try { userMarker.remove(); } catch (e) {}
      userMarker = null;
    }
  }

  return { setUserLocation, clearUserLocation };
}
