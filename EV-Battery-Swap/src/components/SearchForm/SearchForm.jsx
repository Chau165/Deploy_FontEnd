import React, { useState } from 'react';

export default function SearchForm({ stations, selectedStation, setSelectedStation, onFindPath, mode = 'station', foundStations = [], onFindBattery }) {
  const [selectedBattery, setSelectedBattery] = useState("");
  const [msg, setMsg] = useState("");
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState(mode); // 'station' hoặc 'battery'

  const handleFindPath = () => {
    if (!selectedStation) {
      setMsg("Vui lòng chọn trạm trước khi tìm đường.");
      return;
    }
    setMsg("");
    if (onFindPath) onFindPath();
  };

  return (
    <form
      style={{
        maxWidth: 420,
        padding: 24,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        color: '#333'
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.3em', fontWeight: 600, color: '#222' }}>
        Tìm Trạm Đổi Pin
      </h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setViewMode('battery')}
          style={{
            flex: 1,
            padding: 8,
            background: viewMode === 'battery' ? '#1976d2' : '#eef2f7',
            color: viewMode === 'battery' ? '#fff' : '#222',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Tìm theo loại pin
        </button>
        <button
          type="button"
          onClick={() => setViewMode('station')}
          style={{
            flex: 1,
            padding: 8,
            background: viewMode === 'station' ? '#1976d2' : '#eef2f7',
            color: viewMode === 'station' ? '#fff' : '#222',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Tìm theo tên trạm
        </button>
      </div>

      {viewMode === 'station' && (
        <label style={{ textAlign: 'left', fontWeight: 500 }}>
          Tên trạm:
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: 6,
              borderRadius: 8,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              fontSize: '0.95em'
            }}
          >
            <option value="">Chọn trạm...</option>
            {stations.map(station => (
              <option key={station.id} value={station.name}>{station.name}</option>
            ))}
          </select>
        </label>
      )}

      {viewMode === 'battery' && (
        <div>
          <label style={{ textAlign: 'left', fontWeight: 500, display: 'block' }}>
            Loại pin:
            <select
              value={selectedBattery}
              onChange={e => setSelectedBattery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: 6, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">Chọn loại pin...</option>
              <option value="Li-ion">Li-ion</option>
              <option value="LFP">LFP</option>
            </select>
          </label>
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={async () => {
                if (typeof onFindBattery !== 'function') return;
                setSearching(true);
                try {
                  await onFindBattery(selectedBattery);
                } finally { setSearching(false); }
              }}
              style={{
                padding: '10px',
                width: '100%',
                background: '#0d6efd',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {searching ? 'Đang tìm kiếm…' : 'Tìm trạm có loại pin này'}
            </button>
          </div>

          {searching && <div style={{ marginTop: 12 }}>Đang tìm các trạm gần đó…</div>}
          {!searching && foundStations && foundStations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Các trạm được tìm thấy</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {foundStations.map(fs => (
                  <div
                    key={fs.name}
                    onClick={() => setSelectedStation(fs.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStation(fs.name); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 8,
                      borderRadius: 8,
                      background: '#f7fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{fs.name}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>{(fs.distanceMeters/1000).toFixed(2)} km</div>
                    </div>
                    <div style={{ color: '#1976d2', fontWeight: 700 }}>Xem</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!searching && foundStations && foundStations.length === 0 && (
            <div style={{ marginTop: 12, color: '#666' }}>Không tìm thấy trạm phù hợp với loại pin này.</div>
          )}
        </div>
      )}

      {viewMode === 'station' && (
        <button
          type="button"
          onClick={handleFindPath}
          style={{
            padding: '10px 0',
            background: '#2e7d32',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            fontSize: '1em',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#276c2a'}
          onMouseOut={e => e.currentTarget.style.background = '#2e7d32'}
        >
          Tìm đường đến trạm này
        </button>
      )}

      {msg && (
        <div style={{ color: '#1976d2', marginTop: 8, fontWeight: 500, fontSize: '0.95em' }}>
          {msg}
        </div>
      )}
    </form>
  );
}
