// Slider component cho hình w1, w2, w3

function HomeSlider() {
  const slides = [
    {
      img: '/home/w1.jpg',
      title: 'Batteries Swapped',
      value: '798,220,048',
      desc: 'More than 394,634 batteries swapped per day in the last 30 days.'
    },
    {
      img: '/home/w3.jpg',
      title: 'CO₂ Saved',
      value: '1,237,756,119 kg',
      desc: 'The same amount of CO₂ as 123,775,611 trees absorb every year.'
    },
    {
      img: '/home/w2.jpg',
      title: 'Total Distance Covered',
      value: '13,974,062,302 km',
      desc: `Equal to traveling around the Earth's equator 349,351 times.`
    }
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);
  return (
    <div className="home-slider">
      <div className="home-slider-img-wrapper">
        {slides.map((slide, idx) => (
          <div
            key={slide.img}
            className={`home-slider-img${current === idx ? ' active' : ''}`}
            style={{ opacity: current === idx ? 1 : 0, zIndex: current === idx ? 2 : 1 }}
          >
            <img src={slide.img} alt={slide.title} style={{ width: '100vw', height: '100%', objectFit: 'cover' }} />
            {current === idx && (
              <div className="home-slider-overlay">
                <h2 className="home-slider-title">{slide.title}</h2>
                <div className="home-slider-value">{slide.value}</div>
                <div className="home-slider-desc">{slide.desc}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="home-slider-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`home-slider-dot${current === idx ? ' active' : ''}`}
            onClick={() => setCurrent(idx)}
            aria-label={`Chuyển đến slide ${idx+1}`}
          />
        ))}
      </div>
    </div>
  );
}
// DEBUG: log mọi lần gọi fetch để biết URL + method + nơi khởi tạo
if (typeof window !== 'undefined' && !window.__FETCH_SPY__) {
  window.__FETCH_SPY__ = true;
  const _fetch = window.fetch;
  window.fetch = function (...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input?.url;
    const method = (init?.method || 'GET').toUpperCase();
    if (url?.includes('/webAPI/api/getStationBatteryReportGuest')) {
      console.group('[FETCH getStationBatteryReportGuest]');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Init:', init);
      console.trace('Initiator stack');
      console.groupEnd();
    }
    return _fetch.apply(this, args);
  };
}

import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import SearchForm from '../../components/SearchForm/SearchForm';
import MapboxMap from '../../components/Mapbox/MapboxMap';
import API_BASE_URL from '../../config';
import useGeolocation from '../../hooks/useGeolocation';
import LocationPermissionModal from '../../components/LocationPermissionModal/LocationPermissionModal';
import RegisterModal from '../../components/Login/RegisterModal';
import { Link, useNavigate } from 'react-router-dom';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function Home() {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState("");
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [bookingMsg, setBookingMsg] = useState("");

  // onStationsLoaded will be called by MapboxMap when it loads stations.json internally
  const handleStationsLoaded = (data) => {
    setStations(Array.isArray(data) ? data : (data.data || []));
    setStationsLoading(false);
    setStationsError("");
  };

  const handleBookStation = (station) => {
    // If guest (no auth), open register modal with explanation
    // For now we assume this page is guest-only; show register modal
    setShowRegister(true);
    setRegisterNote(`To book a battery at ${station.name} you need an account. Please register to continue.`);
  };

  const [showRegister, setShowRegister] = useState(false);
  const [registerNote, setRegisterNote] = useState('');

  // Helper: distance in meters between two [lng,lat] points (Haversine)
  function distanceMeters(a, b) {
    const toRad = v => v * Math.PI / 180;
    const [lon1, lat1] = a; const [lon2, lat2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lat2 - lat1) ? toRad(lon2 - lon1) : toRad(lon2 - lon1); // keep function body unchanged in spirit
    const lat1r = toRad(lat1); const lat2r = toRad(lat2);
    const aHarv = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1-aHarv));
    return R * c;
  }

  const [foundStations, setFoundStations] = useState([]);

  // Find stations that have batteries of the given chemistry. This flow requests location permission first.
 // Find stations that have batteries of the given chemistry. This flow requests location permission first.
const handleFindBattery = async (chemistry) => {
  setFoundStations([]);
  if (!chemistry) return setRouteError('Please select a battery chemistry');
  setRouteError('');

  // Request user location via the geolocation hook
  const perm = await checkPermission();
  if (perm === 'denied') {
    setRouteError('Location access blocked. Please enable location permission.');
    return;
  }
  if (perm === 'prompt') {
    setShowPrePerm(true);
    const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
    setShowPrePerm(false);
    prePermResolveRef.current = null;
    if (!resp) {
      setRouteError('Location permission required to find nearest stations.');
      return;
    }
  }

  let pos;
  try {
    pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
    const userCoords = [pos.coords.longitude, pos.coords.latitude];
    setUserLocation(userCoords);

    // Fetch the full battery report once and group results by stationName.
    const candidates = [];
    try {
      const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest';
      const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' } });
      if (res.ok) {
        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
        // group by stationName (normalize casing/whitespace)
        const grouped = {};
        for (const item of list) {
          const nameRaw = item.stationName || item.station || '';
          const name = String(nameRaw).trim().toLowerCase();
          if (!grouped[name]) grouped[name] = [];
          grouped[name].push(item);
        }
        for (const st of stations) {
          const key = String(st.name || '').trim().toLowerCase();
          const items = grouped[key] || [];
          const has = items.some(b => String(b.batteryType || b.chemistry || b.type || b.Battery_Type || '').toLowerCase().includes(chemistry.toLowerCase()));
          if (has) candidates.push({ name: st.name, station: st });
        }
      }
    } catch (e) {
      // fallthrough to empty candidates
    }

    if (!candidates.length) {
      setFoundStations([]);
      return [];
    }

    // Compute straight-line distance (meters) from user to each candidate and pick top 3 closest.
    const withDistances = candidates.map(c => {
      const dest = c.station.coords || [(c.station.lng || c.station.longitude), (c.station.lat || c.station.latitude)];
      const dist = distanceMeters(userCoords, dest);
      return { ...c, distanceMeters: dist };
    });

    withDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
    const top3 = withDistances.slice(0, 3);
    const mapped = top3.map(r => ({ name: r.name, distanceMeters: r.distanceMeters, coords: r.station.coords || [r.station.lng || r.station.longitude, r.station.lat || r.station.latitude] }));
    setFoundStations(mapped);
    return mapped;
  } catch (err) {
    setRouteError('Could not get location.');
    return [];
  }
};

  const handleFindPath = async () => {
    setRouteError("");
    if (!selectedStation) {
      setRouteError("Please select a station first.");
      return;
    }
    // Permissions API pre-check: use the reusable hook
    let permState = await checkPermission();
    if (permState === 'denied') {
      // show in-page guidance — browser will not prompt again until user changes settings
      setRouteError('Location access is blocked for this site. Please enable location in your browser settings.');
      return;
    }
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError("Station not found.");
      return;
    }
    setRouteLoading(true);
    // Always attempt to get the user's current position when guiding.
    // The browser will show its permission prompt if the permission state is "prompt".
    let start;
    try {
      // If permission state is 'prompt' show a pre-permission explanation modal
      if (permState === 'prompt') {
        setShowPrePerm(true);
        const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
        setShowPrePerm(false);
        prePermResolveRef.current = null;
        if (!resp) {
          setRouteLoading(false);
          setRouteError('Location permission required to guide.');
          return;
        }
      }
      const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
      start = [pos.coords.longitude, pos.coords.latitude];
      // store the user's location so the map can render a marker
      try { setUserLocation(start); } catch (e) {}
    } catch (err) {
      // If the user denies or an error occurs, show a helpful message and fall back to default coords
      if (err && err.code === 1) setRouteError('Location permission denied. Using default location.');
      else if (err && err.code === 2) setRouteError('Position unavailable. Using default location.');
      else if (err && err.code === 3) setRouteError('Location request timed out. Using default location.');
      else setRouteError('Could not get current location. Using default location.');
      start = [106.660172, 10.762622];
    }
    const end = stationObj.coords;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteGeoJSON(data.routes[0].geometry);
      } else {
        setRouteError("No route found.");
        setRouteGeoJSON(null);
      }
    } catch (err) {
      setRouteError("Failed to fetch route.");
      setRouteGeoJSON(null);
    }
    setRouteLoading(false);
  };

  const { getCurrentPositionAsync, checkPermission } = useGeolocation();
  const [showPrePerm, setShowPrePerm] = useState(false);
  const prePermResolveRef = useRef(null);

  return (
    <>
      <main className="home-main">
        <video
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="home-video"
        >
          <source src="/promo.mp4" type="video/mp4" />
        </video>
        <div className="home-map-section">
          <img
            src="/homemap.jpg"
            alt="Sơ đồ các trạm"
            className="home-map-img"
          />
          {/* Nội dung overlay trên hình homemap */}
          <div className="home-map-overlay">
            Chào mừng bạn đến với hệ thống đổi pin thông minh!
            <div className="home-map-desc">
              Đổi pin nhanh chóng, tiện lợi, an toàn và tiết kiệm cho xe điện của bạn.
            </div>
          </div>
        </div>
        <div className="home-content-row">
          <div className="home-content-left">
            {stationsLoading && <div>Loading stations...</div>}
            {stationsError && <div className="home-error">{stationsError}</div>}
            {!stationsLoading && !stationsError && (
              <SearchForm
                stations={stations}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
                onFindPath={handleFindPath}
                foundStations={foundStations}
                onFindBattery={handleFindBattery}
              />
            )}
            {routeLoading && <div className="home-info">Finding route...</div>}
            {routeError && <div className="home-error">{routeError}</div>}
          </div>
          <div className="home-content-right">
            <MapboxMap
              token={MAPBOX_TOKEN}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              routeGeoJSON={routeGeoJSON}
              showPopup={true}
              userLocation={userLocation}
              onStationsLoaded={handleStationsLoaded}
              onBookStation={handleBookStation}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
            />
          </div>
        </div>
        {/* Latest News Section */}
        <section className="latest-news-section">
          <h2 className="latest-news-title">Latest News</h2>
          <div className="latest-news-list">
            <div className="latest-news-card">
              <img src="/e1.jpg" alt="Gogoro Most Innovative Company" className="latest-news-img" />
              <div className="latest-news-meta">Press</div>
              <div className="latest-news-headline">Think Deeper: Gogoro Platform.</div>
            <Link to="/news/gogoro-platform" className="latest-news-link">LEARN MORE &rarr;</Link>
            </div>
            <div className="latest-news-card">
              <img src="/e2.jpg" alt="Gogoro Pulse" className="latest-news-img" />
              <div className="latest-news-meta">Press</div>
              <div className="latest-news-headline">Think Deeper: SmartGEN.</div>
            <Link to="/news/smartgen" className="latest-news-link">LEARN MORE &rarr;</Link>
            </div>
            <div className="latest-news-card">
              <img src="/e3.jpg" alt="Uber Eats Gogoro" className="latest-news-img" />
              <div className="latest-news-meta">Press</div>
              <div className="latest-news-headline">Think Deeper: iQ System.</div>
            <Link to="/news/iq-system" className="latest-news-link">LEARN MORE &rarr;</Link>
            </div>
          </div>
  </section>
  {/* Slider hình ảnh w1, w2, w3 nằm trên footer */}
        {/* Gogoro Network Banner Section */}
        <section className="gogoro-banner-section">
          <div className="gogoro-banner-img">
            <img src="/img1.jpg" alt="Gogoro Battery Swap" />
            <div className="gogoro-banner-content">
              <h2 className="gogoro-banner-title">Gogoro Network</h2>
              <p className="gogoro-banner-desc">The world's most advanced battery swapping system, vehicles recharged in seconds.</p>
              <div className="gogoro-banner-link">
                <button className="gogoro-banner-btn" onClick={() => { navigate('/battery'); window.scrollTo(0,0); }}>
                  DISCOVER MORE &rarr;
                </button>
              </div>
            </div>
          </div>
  </section>
      <HomeSlider />
    </main>
      <LocationPermissionModal
        open={showPrePerm}
        onCancel={() => { if (prePermResolveRef.current) { prePermResolveRef.current(false); prePermResolveRef.current = null; } }}
        onConfirm={() => { if (prePermResolveRef.current) { prePermResolveRef.current(true); prePermResolveRef.current = null; } }}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { setShowRegister(false); }}
      >
        <div style={{ padding: '12px 20px', background: '#fff', color: '#333' }}>{registerNote}</div>
      </RegisterModal>
    </>
  );
}
