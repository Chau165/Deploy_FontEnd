import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import API_BASE_URL from '../../config';
import reactLogo from '../../assets/react.svg';
import { createMapManager } from '../../utils/mapManager';

export default function MapboxMap({
  token,
  stations = [],
  selectedStation,
  setSelectedStation,
  routeGeoJSON,
  onFindPath,
  showPopup = true,
  style = { width: '100%', height: '400px', borderRadius: '16px' },
  userLocation = null,
  onStationsLoaded = null,
  onBookStation = null,
}) {
  const [internalStations, setInternalStations] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const popupRefs = useRef({});
  const batteryCacheRef = useRef({});
  const mapManagerRef = useRef(null);
  const openPopupRef = useRef(null);
  // cờ để biết map đã load style chưa
  const mapLoadedRef = useRef(false);

  /* ========== KHỞI TẠO MAP (CHỈ PHỤ THUỘC TOKEN) ========== */
  useEffect(() => {
    if (!token) return;
    if (!map.current && mapContainer.current) {
      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: stations.length ? [stations[0].lng, stations[0].lat] : [106.7, 10.8],
        zoom: 12,
      });

      // khi map load xong
      map.current.on('load', () => {
        mapLoadedRef.current = true;
        try {
          if (!mapManagerRef.current) {
            mapManagerRef.current = createMapManager(map.current);
          }
        } catch {
          mapManagerRef.current = null;
        }
      });

      // bản gốc có, giữ lại
      try {
        mapManagerRef.current = createMapManager(map.current);
      } catch {
        mapManagerRef.current = null;
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapLoadedRef.current = false;
      }
    };
  }, [token]);

  /* ========== VẼ MARKER + POPUP CHO TRẠM ========== */
  useEffect(() => {
    if (!map.current) return;

    // ưu tiên trạm từ props, nếu không có thì dùng trạm fallback
    const stationsToUse =
      (Array.isArray(stations) && stations.length
        ? stations
        : Array.isArray(internalStations)
        ? internalStations
        : null);

    if (!stationsToUse) return;

    // ✅ chỉ cần check cờ của mình, KHÔNG check isStyleLoaded nữa
    if (!mapLoadedRef.current) {
      try {
        map.current.once('load', () => {
          setTimeout(() => {
            renderStations(stationsToUse);
          }, 0);
        });
      } catch {}
      return;
    }

    // style đã load → vẽ luôn
    renderStations(stationsToUse);

    // ===== helper =====
    function renderStations(list) {
      if (!map.current) return;

      popupRefs.current = {};

      const features = [];

      list.forEach((station) => {
        let lat = station.lat ?? station.latitude;
        let lng = station.lng ?? station.longitude;
        if ((lat === undefined || lng === undefined) && Array.isArray(station.coords)) {
          lng = station.coords[0];
          lat = station.coords[1];
        }
        if (![lat, lng].every((n) => typeof n === 'number' && !Number.isNaN(n))) return;

        // === POPUP ===
        if (showPopup) {
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
          });
          const content = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = station.name;
          const body = document.createElement('div');
          body.className = 'popup-body';
          body.textContent = 'Click marker to load battery info';
          const actions = document.createElement('div');
          actions.style.marginTop = '8px';
          const bookBtn = document.createElement('button');
          bookBtn.textContent = 'Book Now';
          Object.assign(bookBtn.style, {
            padding: '6px 10px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          });
          actions.appendChild(bookBtn);

          content.appendChild(title);
          content.appendChild(body);
          content.appendChild(actions);

          popup.setDOMContent(content);
          popup.setLngLat([lng, lat]);

          popupRefs.current[station.name] = {
            popup,
            body,
            loadBattery: null,
            coords: [lng, lat],
          };

          const loadBattery = async () => {
            try {
              body.textContent = 'Loading battery info...';
              const cacheKey = String(station.id ?? station.stationId ?? station.name);
              if (batteryCacheRef.current[cacheKey]) {
                body.innerHTML = renderBatteryTable(
                  station.name,
                  batteryCacheRef.current[cacheKey]
                );
                return;
              }

              const stationId =
                station.id ??
                station.stationId ??
                station.Station_ID ??
                station.StationId ??
                null;
              const qs = stationId != null ? `?stationId=${encodeURIComponent(stationId)}` : '';
              const url =
                (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest' + qs;

              const res = await fetch(url, {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                  'ngrok-skip-browser-warning': '1',
                },
                credentials: 'include',
              });
              if (!res.ok) throw new Error('Failed to fetch battery report');
              const json = await res.json();

              const rowsAll = Array.isArray(json?.data) ? json.data : [];
              const rows =
                stationId != null
                  ? rowsAll.filter((r) => String(r.stationId) === String(stationId))
                  : rowsAll.filter(
                      (r) => (r.stationName || '').trim() === (station.name || '').trim()
                    );

              batteryCacheRef.current[cacheKey] = rows;
              body.innerHTML = renderBatteryTable(station.name, rows);
            } catch (err) {
              body.textContent = 'Failed to load battery info';
            }
          };

          popupRefs.current[station.name].loadBattery = loadBattery;
          bookBtn.addEventListener('click', (e) => {
            try {
              e.stopPropagation();
            } catch {}
            if (typeof onBookStation === 'function') onBookStation(station);
          });
        }

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { name: station.name },
        });
      });

      const sourceId = 'stations-source';
      const layerId = 'stations-layer';
      const geojson = { type: 'FeatureCollection', features };

      if (map.current.getSource(sourceId)) {
        try {
          map.current.getSource(sourceId).setData(geojson);
        } catch {}
      } else {
        map.current.addSource(sourceId, { type: 'geojson', data: geojson });

        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.src = reactLogo;
        imgEl.onload = () => {
          try {
            if (!map.current.hasImage('gogoro-marker')) {
              map.current.addImage('gogoro-marker', imgEl);
            }
          } catch {}

          try {
            const hasImg = map.current.hasImage && map.current.hasImage('gogoro-marker');
            if (hasImg) {
              map.current.addLayer({
                id: layerId,
                type: 'symbol',
                source: sourceId,
                layout: {
                  'icon-image': 'gogoro-marker',
                  'icon-size': 1.2,
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                },
              });
            } else {
              map.current.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': 14,
                  'circle-color': '#1976d2',
                  'circle-stroke-color': '#fff',
                  'circle-stroke-width': 2,
                },
              });
            }
          } catch {
            try {
              map.current.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': 14,
                  'circle-color': '#1976d2',
                  'circle-stroke-color': '#fff',
                  'circle-stroke-width': 2,
                },
              });
            } catch {}
          }

          // events
          try {
            map.current.on('mouseenter', layerId, () => {
              map.current.getCanvas().style.cursor = 'pointer';
            });
          } catch {}
          try {
            map.current.on('mouseleave', layerId, () => {
              map.current.getCanvas().style.cursor = '';
            });
          } catch {}
          try {
            map.current.on('click', layerId, (e) => {
              const feat = e.features && e.features[0];
              if (!feat) return;
              const name = feat.properties && feat.properties.name;
              if (!name) return;
              const popupObj = popupRefs.current && popupRefs.current[name];

              try {
                if (
                  openPopupRef.current &&
                  openPopupRef.current !== (popupObj && popupObj.popup)
                ) {
                  openPopupRef.current.remove();
                }
              } catch {}

              if (popupObj) {
                try {
                  const sx = window.scrollX || window.pageXOffset;
                  const sy = window.scrollY || window.pageYOffset;
                  popupObj.popup.addTo(map.current);
                  openPopupRef.current = popupObj.popup;
                  try {
                    const el = popupObj.popup.getElement();
                    if (el?.blur) el.blur();
                  } catch {}
                  try {
                    window.scrollTo(sx, sy);
                  } catch {}
                  try {
                    setTimeout(() => {
                      try {
                        window.scrollTo(sx, sy);
                      } catch {}
                    }, 50);
                  } catch {}
                  try {
                    setTimeout(() => {
                      try {
                        window.scrollTo(sx, sy);
                      } catch {}
                    }, 300);
                  } catch {}
                } catch {}

                try {
                  map.current.once('click', () => {
                    try {
                      popupObj.popup.remove();
                    } catch {}
                    if (openPopupRef.current === popupObj.popup) openPopupRef.current = null;
                  });
                } catch {}
                try {
                  setSelectedStation && setSelectedStation(name);
                } catch {}
                try {
                  popupObj.loadBattery && popupObj.loadBattery();
                } catch {}
              }
            });
          } catch {}
        };
        imgEl.onerror = () => {
          try {
            map.current.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 14,
                'circle-color': '#1976d2',
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
              },
            });
          } catch {}
        };
      }
    }
  }, [stations, showPopup, setSelectedStation, internalStations]);

  /* ========== FALLBACK LẤY TRẠM TỪ JSON ========== */
  useEffect(() => {
    if (Array.isArray(stations) && stations.length) return;
    let mounted = true;
    setInternalLoading(true);
    fetch('/src/data/stations.json')
      .then((r) => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        setInternalStations(data);
        setInternalLoading(false);
        if (typeof onStationsLoaded === 'function') onStationsLoaded(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setInternalError(err.message || 'failed');
        setInternalLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [stations, onStationsLoaded]);

  /* ========== KHI CHỌN TRẠM TỪ BÊN NGOÀI ========== */
  useEffect(() => {
    if (!map.current || !selectedStation) return;
    const popupObj = popupRefs.current && popupRefs.current[selectedStation];
    if (!popupObj) return;

    try {
      if (Array.isArray(popupObj.coords) && popupObj.coords.length === 2) {
        map.current.flyTo({ center: popupObj.coords, zoom: 14 });
      }
    } catch {}

    try {
      if (openPopupRef.current && openPopupRef.current !== popupObj.popup) {
        openPopupRef.current.remove();
      }
    } catch {}

    try {
      const sx = window.scrollX || window.pageXOffset;
      const sy = window.scrollY || window.pageYOffset;
      popupObj.popup.addTo(map.current);
      openPopupRef.current = popupObj.popup;
      try {
        const el = popupObj.popup.getElement();
        if (el?.blur) el.blur();
      } catch {}
      try {
        window.scrollTo(sx, sy);
      } catch {}
    } catch {}

    try {
      map.current.once('click', () => {
        try {
          popupObj.popup.remove();
        } catch {}
        if (openPopupRef.current === popupObj.popup) openPopupRef.current = null;
      });
    } catch {}

    try {
      popupObj.loadBattery && popupObj.loadBattery();
    } catch {}
  }, [selectedStation, showPopup]);

  /* ========== VẼ ROUTE (Find Path) ========== */
  useEffect(() => {
    if (!map.current) return;

    const drawRoute = () => {
      if (!map.current) return;

      if (map.current.getSource('route')) {
        try {
          map.current.removeLayer('route');
        } catch {}
        try {
          map.current.removeSource('route');
        } catch {}
      }

      if (routeGeoJSON) {
        map.current.addSource('route', { type: 'geojson', data: routeGeoJSON });
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1976d2', 'line-width': 5 },
        });
      }
    };

    // ✅ chỉ check cờ của mình
    if (!mapLoadedRef.current) {
      try {
        map.current.once('load', drawRoute);
      } catch {}
      return;
    }

    drawRoute();
  }, [routeGeoJSON]);

  /* ========== USER LOCATION ========== */
  useEffect(() => {
    if (!mapManagerRef.current) return;
    if (!userLocation || !Array.isArray(userLocation) || userLocation.length !== 2) {
      try {
        mapManagerRef.current.clearUserLocation?.();
      } catch {}
      return;
    }
    try {
      mapManagerRef.current.setUserLocation?.(userLocation);
    } catch {}
  }, [userLocation]);

  const mergedStyle = { pointerEvents: 'auto', zIndex: 900, ...style };
  return <div ref={mapContainer} style={mergedStyle} />;
}

/** Render 2 loại pin + dải SoH rõ ràng */
function renderBatteryTable(_stationName, rows) {
  const grouped = (Array.isArray(rows) ? rows : []).reduce((acc, r) => {
    const key = String(r.batteryType || 'Unknown');
    acc[key] = acc[key] || { Good: 0, Average: 0, Weak: 0, Below75: 0, Total: 0 };
    acc[key].Good += Number(r.Good || 0);
    acc[key].Average += Number(r.Average || 0);
    acc[key].Weak += Number(r.Weak || 0);
    acc[key].Below75 += Number(r.Below75 || 0);
    acc[key].Total += Number(r.Total || 0);
    return acc;
  }, {});

  const COLOR = {
    good: '#2e7d32',
    avg: '#f9a825',
    weak: '#d32f2f',
    lt75: '#000000',
    total: '#37474f',
  };

  const dot = (c) =>
    `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:6px;transform:translateY(-1px);"></span>`;

  const sohNote = (text) =>
    `<span style="opacity:.85;font-weight:500;font-size:12px;margin-left:6px;color:#475569;">(${text})</span>`;

  const sections =
    Object.entries(grouped)
      .map(
        ([type, v]) => `
      <div style="margin-top:10px; padding:10px 10px; background:#f9fafb; border-radius:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-weight:700; font-size:15px; color:#0f172a;">${escapeHtml(type)}</div>
          <div style="font-size:12px; color:#64748b; background:#e2e8f0; padding:2px 6px; border-radius:999px;">SoH</div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13.5px;">
          <tbody>
            <tr>
              <td style="padding:3px 0;">${dot(COLOR.good)}Tốt:${sohNote('SoH ≥ 85%')}</td>
              <td style="text-align:right; color:${COLOR.good}; font-weight:600;">${escapeHtml(String(v.Good))}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;">${dot(COLOR.avg)}Khá:${sohNote('80% ≤ SoH < 85%')}</td>
              <td style="text-align:right; color:${COLOR.avg}; font-weight:600;">${escapeHtml(String(v.Average))}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;">${dot(COLOR.weak)}Yếu:${sohNote('75% ≤ SoH < 80%')}</td>
              <td style="text-align:right; color:${COLOR.weak}; font-weight:600;">${escapeHtml(String(v.Weak))}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;">${dot(COLOR.lt75)}Dưới 75%:${sohNote('SoH < 75%')}</td>
              <td style="text-align:right; color:${COLOR.lt75}; font-weight:600;">${escapeHtml(String(v.Below75))}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:6px; font-weight:700; color:${COLOR.total}; display:flex; justify-content:space-between;">
                <span>Tổng:</span>
                <span>${escapeHtml(String(v.Total))}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `
      )
      .join('') || `<div style="margin-top:6px;">Không có dữ liệu</div>`;

  return `
    <div style="
      margin-top:8px;
      padding:6px 4px;
      font-family: 'Inter', system-ui, sans-serif;
      line-height:1.45;
      min-width:260px;
      max-width:340px;
    ">
      ${sections}
    </div>
  `;
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

