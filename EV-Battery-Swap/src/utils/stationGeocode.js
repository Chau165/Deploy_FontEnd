// Lightweight Mapbox geocoding helpers
// Exports:
// - geocodeAddress(address, mapboxToken): Promise<{lng, lat}>
// - enrichStationsWithCoords(stations, mapboxToken, options): Promise<stationsWithCoords>
// - fetchStationsFromApi(apiUrl): Promise<stations>

const defaultOptions = {
  concurrency: 4,
  maxRetries: 3,
  retryBaseMs: 300,
};

// Simple in-memory cache to avoid repeated network calls during a session
const geocodeCache = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function geocodeAddress(address, mapboxToken, { maxRetries = defaultOptions.maxRetries, retryBaseMs = defaultOptions.retryBaseMs } = {}) {
  if (!address) throw new Error('Address is required');
  if (!mapboxToken) throw new Error('Mapbox token is required');

  const key = address.trim();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  const encoded = encodeURIComponent(key);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${mapboxToken}`;

  let attempt = 0;
  while (true) {
    try {
      const data = await fetchJson(url, { method: 'GET' });
      if (data && data.features && data.features.length) {
        const [lng, lat] = data.features[0].center;
        const result = { lng, lat };
        geocodeCache.set(key, result);
        return result;
      }
      // No features found
      geocodeCache.set(key, null);
      return null;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const wait = retryBaseMs * Math.pow(2, attempt - 1);
      await sleep(wait);
    }
  }
}

// Simple concurrency limiter for promises
async function mapWithConcurrency(items, mapper, concurrency = defaultOptions.concurrency) {
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      try {
        results[i] = await mapper(items[i], i);
      } catch (err) {
        results[i] = { error: err };
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function enrichStationsWithCoords(stations, mapboxToken, options = {}) {
  if (!Array.isArray(stations)) throw new Error('stations must be an array');
  const { concurrency = defaultOptions.concurrency } = options;

  const tasks = stations.map((s) => s.address || s.physical_address || s.location || '');

  const results = await mapWithConcurrency(tasks, async (address, i) => {
    if (!address) return null;
    try {
      const coords = await geocodeAddress(address, mapboxToken, options);
      return coords;
    } catch (err) {
      return null;
    }
  }, concurrency);

  // Return a new array with coords merged as `coords: [lng, lat]` when available
  return stations.map((s, i) => {
    const res = results[i];
    if (res && res.lng != null && res.lat != null) {
      return { ...s, coords: [res.lng, res.lat] };
    }
    return { ...s };
  });
}

async function fetchStationsFromApi(apiUrl, options = {}) {
  if (!apiUrl) throw new Error('apiUrl is required');
  const res = await fetchJson(apiUrl, { method: 'GET', ...options });
  // Expecting array of { id, name, address }
  if (!Array.isArray(res)) throw new Error('API did not return an array');
  return res;
}

export { geocodeAddress, enrichStationsWithCoords, fetchStationsFromApi };
