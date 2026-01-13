#!/usr/bin/env node
/**
 * Node script to fetch station info from an external API, geocode addresses via Mapbox,
 * and update src/data/stations.json with coords.
 *
 * Usage:
 * MAPBOX_TOKEN=pk.xxx API_URL=https://... node scripts/updateStations.js
 */
import fs from 'fs/promises';
import path from 'path';

const OUT_FILE = path.resolve('./src/data/stations.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url, extraHeaders = {}) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  // If env var SKIP_NGROK_WARNING is set, include the ngrok skip header
  if (process.env.SKIP_NGROK_WARNING && !headers['ngrok-skip-browser-warning']) {
    headers['ngrok-skip-browser-warning'] = '1';
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return res.json();
}

async function geocode(address, token, maxRetries = 3) {
  if (!address) return null;
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${token}`;
  let attempt = 0;
  while (true) {
    try {
      const data = await fetchJson(url);
      if (data.features && data.features.length) {
        const [lng, lat] = data.features[0].center;
        return { lng, lat };
      }
      return null;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await sleep(300 * Math.pow(2, attempt - 1));
    }
  }
}

async function main() {
  const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    console.error('Please set API_URL environment variable to your teammate API endpoint or a local file path');
    process.exit(2);
  }
  if (!MAPBOX_TOKEN) {
    console.warn('MAPBOX_TOKEN not set — geocoding will be skipped for stations that lack coordinates.');
  }

  console.log('Fetching stations from API or local file:', API_URL);
  let stations;
  try {
    if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
      const hdrs = {};
      if (process.env.SKIP_NGROK_WARNING) hdrs['ngrok-skip-browser-warning'] = '1';
      stations = await fetchJson(API_URL, hdrs);
    } else {
      // treat as local file path
      const filePath = path.resolve(API_URL);
      const txt = await fs.readFile(filePath, 'utf8');
      stations = JSON.parse(txt);
    }
  } catch (err) {
    console.error('Failed to load stations from API_URL:', err.message || err);
    process.exit(4);
  }
  // Accept either an array directly or an object with `data` array (e.g., { status:'success', data: [...] })
  if (!Array.isArray(stations)) {
    if (stations && Array.isArray(stations.data)) {
      stations = stations.data;
    } else {
      console.error('API did not return an array of stations');
      process.exit(3);
    }
  }

  console.log(`Got ${stations.length} stations — geocoding addresses (this may take a while)...`);

  // simple sequential geocoding to be gentle with rate limits; you can parallelize if desired
  const out = [];
  for (const s of stations) {
    // Accept many possible field names from the teammate API
    const id = s.Station_ID ?? s.id ?? s.ID ?? s.stationId ?? null;
    const name = s.Name ?? s.name ?? '';
    const address = s.Address ?? s.address ?? s.physical_address ?? s.location ?? '';

    // If the incoming record already has Latitude/Longitude (or lat/lng), prefer those
    const incomingLat = s.Latitude ?? s.latitude ?? s.Lat ?? s.lat ?? null;
    const incomingLng = s.Longitude ?? s.longitude ?? s.Lng ?? s.lng ?? null;

    let coords = null;
    if (incomingLat != null && incomingLng != null) {
      coords = { lat: Number(incomingLat), lng: Number(incomingLng) };
    } else if (address && MAPBOX_TOKEN) {
      try {
        coords = await geocode(address, MAPBOX_TOKEN);
      } catch (err) {
        console.warn('Geocode failed for', address, err.message || err);
      }
    } else if (address && !MAPBOX_TOKEN) {
      console.warn(`No MAPBOX_TOKEN; skipping geocode for station ${name || id}`);
    }

    const outItem = {
      id: id,
      name: name,
      address: address,
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null,
    };
    // Add coords array for Home.jsx which expects station.coords = [lng, lat]
    if (coords) outItem.coords = [coords.lng, coords.lat];

    out.push(outItem);
    console.log(`Processed: ${name || id} -> ${coords ? `${coords.lat},${coords.lng}` : 'NO_COORD'}`);
    // small delay to avoid hitting API limits
    await sleep(150);
  }

  // create output dir if needed
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  // Backup existing stations.json if present
  try {
    const existing = await fs.readFile(OUT_FILE, 'utf8');
    const backupDir = path.join(path.dirname(OUT_FILE), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `stations-${timestamp}.json`);
    await fs.writeFile(backupPath, existing, 'utf8');
    console.log('Backed up previous stations.json to', backupPath);
  } catch (err) {
    // ENOENT means file doesn't exist yet — ok to continue
    if (err.code && err.code !== 'ENOENT') {
      console.warn('Warning: failed to backup existing stations.json', err);
    }
  }

  // write new stations file
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUT_FILE);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
