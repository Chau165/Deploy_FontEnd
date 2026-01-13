// src/components/Booking/BookingModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../config';

export default function BookingModal({
  open,
  onClose,
  stationName,
  onRequirePackage,      // ⬅ sẽ được Driver.jsx truyền vào để nhảy sang tab "Gói dịch vụ"
  onRequireLinkVehicle,  // (tuỳ chọn) mở flow liên kết xe
}) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehLoading, setVehLoading] = useState(true);
  const [vehError, setVehError] = useState('');

  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

  // BE báo chưa thuê gói
  const [needPackage, setNeedPackage] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('booking-modal__backdrop')) {
      onClose && onClose();
    }
  };

  const toNFC = (s) => (typeof s === 'string' ? s.normalize('NFC') : s);

  // ===== Lấy danh sách xe đã liên kết =====
  useEffect(() => {
    if (!open) return;

    setVehLoading(true);
    setVehError('');
    setVehicles([]);
    setVehicleId('');
    setSuccess(false);
    setResult(null);
    setError('');
    setNeedPackage(false);

    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwt_token') ||
      '';

    const url = `${API_BASE_URL}/webAPI/api/secure/my-vehicles`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        });

        const text = await res.text();
        let data = [];
        try { data = text ? JSON.parse(text) : []; } catch { data = []; }

        if (!res.ok) {
          throw new Error(
            (data && data.error) ||
            (data && data.message) ||
            `Tải danh sách xe thất bại (${res.status})`
          );
        }

        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const normalized = arr.map(v => ({
          id: v.Vehicle_ID ?? v.vehicleId ?? v.id ?? v.vehicle_id,
          modelName: v.Model_Name ?? v.model_Name ?? v.modelName ?? v.model,
          licensePlate: v.License_Plate ?? v.license_Plate ?? v.licensePlate,
        })).filter(v => v.id != null);

        setVehicles(normalized);
        if (normalized.length === 1) setVehicleId(String(normalized[0].id));
      } catch (err) {
        setVehError(err?.message || 'Không thể tải danh sách xe.');
      } finally {
        setVehLoading(false);
      }
    })();
  }, [open]);

  // Option hiển thị: "Model — Biển số"
  const vehicleOptions = useMemo(() => {
    return vehicles.map(v => ({
      id: v.id,
      label: `${v.modelName || 'Model ?'} — ${v.licensePlate || 'Biển số ?'}`,
    }));
  }, [vehicles]);

  // Helper: lấy label theo vehicleId (fallback khi BE chưa trả label)
  const getSelectedVehicleLabel = () => {
    const opt = vehicleOptions.find(o => String(o.id) === String(vehicleId));
    return opt?.label || '—';
  };

  // chỉ cho submit khi có vehicle + ngày + giờ
  const canSubmit = useMemo(() => {
    const hasVehicle = !!vehicleId;
    return open && stationName && hasVehicle && date && time && !loading;
  }, [open, stationName, vehicleId, date, time, loading]);

  // ===== Submit tạo booking =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setSuccess(false);
    setResult(null);
    setLoading(true);
    setNeedPackage(false);

    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwt_token') ||
      '';

    const vehicleIdFinal = parseInt(vehicleId, 10);
    if (!vehicleIdFinal || Number.isNaN(vehicleIdFinal)) {
      setLoading(false);
      setError('Vehicle ID không hợp lệ.');
      return;
    }

    try {
      const bookingTime = `${date}T${time}`;
      const stationNameNFC = toNFC(stationName);

      const payload = { stationName: stationNameNFC, vehicleId: vehicleIdFinal, bookingTime };
      const bodyUtf8 = new TextEncoder().encode(JSON.stringify(payload)); // đảm bảo UTF-8

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        credentials: 'include',
        body: bodyUtf8,
      });

      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      if (!res.ok) {
        const msg = (data?.error || data?.message || `HTTP ${res.status}`) + '';

        // Nhận diện đầy đủ các thông báo thiếu gói (VN & EN, có/không dấu)
        const noPackage =
          (/g(ó|o)i\s*pin/i.test(msg) && /(thu(ê|e)|mua|k(í|i)ch\s*ho(ạ|a)t|ch(ư|u)a|ph(ả|a)i)/i.test(msg)) ||
          /chua\s*(thue|mua|kich\s*hoat)\s*goi/i.test(msg) ||
          /no\s*active\s*(package|plan|subscription)/i.test(msg) ||
          /package\s*(required|missing)/i.test(msg) ||
          /subscription\s*(required|inactive|missing)/i.test(msg) ||
          data?.code === 'NO_PACKAGE' ||
          data?.errorCode === 'PACKAGE_REQUIRED';

        if (noPackage) setNeedPackage(true);

        throw new Error(msg);
      }

      setSuccess(true);
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Lỗi đặt lịch.');
    } finally {
      setLoading(false);
    }
  };

  // ===== điều hướng sang tab Gói dịch vụ =====
  const goToServiceTab = () => {
    onClose && onClose();
    if (typeof onRequirePackage === 'function') {
      // dùng callback do Driver.jsx truyền vào để setActiveTab('service') + scroll
      onRequirePackage();
    } else {
      // Fallback: đổi URL (nếu bạn xử lý query để set tab)
      const url = new URL(window.location.href);
      url.hash = '#/dashboard/driver?tab=service';
      window.location.href = url.toString();
    }
  };

  if (!open) return null;

  // ===== Compose vehicle label từ response hoặc fallback =====
  const resolvedVehicleLabel =
    result?.vehicleLabel
      || (result?.vehicleModelName && result?.licensePlate
          ? `${result.vehicleModelName} — ${result.licensePlate}`
          : getSelectedVehicleLabel());

  return (
    <div
      className="booking-modal__backdrop"
      onClick={handleBackdropClick}
      style={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Đặt lịch đổi pin"
    >
      <div className="booking-modal__content" style={styles.modal}>
        <div style={styles.header}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Đặt lịch đổi pin</div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Đóng">×</button>
        </div>

        <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
          Trạm: <b style={{ color: '#0f172a' }}>{stationName || '-'}</b>
        </div>

        {success ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: '#166534', fontWeight: 600, marginBottom: 8 }}>✅ Đặt lịch thành công!</div>
            {result && (
              <div style={styles.resultBox}>
                <div><b>Mã đặt lịch:</b> {result.bookingId}</div>
                {/* Đổi từ Vehicle ID -> Xe (Mẫu xe — Biển số) */}
                <div><b>Xe:</b> {resolvedVehicleLabel}</div>
                <div><b>Loại pin:</b> {result.batteryType}</div>
                <div><b>Thời gian:</b> {result.bookingTime}</div>
                <div><b>Hết hạn:</b> {result.expiredTime}</div>
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 13, color: '#475569' }}>
              Vui lòng đến đúng giờ và cung cấp mã đặt lịch cho nhân viên tại quầy.
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={onClose} style={styles.primaryBtn}>Đóng</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {error && (
              <div style={styles.error}>
                {error}
                {needPackage && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={styles.linkBtn}
                      onClick={goToServiceTab}
                    >
                      Thuê gói ngay
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown xe luôn hiển thị; nếu chưa liên kết → rỗng */}
            <label style={styles.label}>
              Xe của bạn:
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                style={styles.input}
              >
                <option value="">-- Chọn xe --</option>
                {vehicleOptions.map(v => (
                  <option key={v.id} value={String(v.id)}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Gợi ý liên kết xe (không cho nhập ID thủ công) */}
            {!vehLoading && vehicles.length === 0 && (
              <div style={styles.info}>
                Bạn chưa liên kết xe. Vui lòng liên kết xe để có thể đặt lịch.
                {typeof onRequireLinkVehicle === 'function' && (
                  <button
                    type="button"
                    style={{ ...styles.linkBtn, marginLeft: 8 }}
                    onClick={() => {
                      onClose && onClose();
                      onRequireLinkVehicle();
                    }}
                  >
                    Liên kết xe
                  </button>
                )}
              </div>
            )}

            <label style={styles.label}>
              Ngày đổi pin:
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Giờ đổi pin:
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={styles.input}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={onClose} style={styles.ghostBtn}>Hủy</button>
              <button disabled={!canSubmit} type="submit" style={styles.primaryBtn}>
                {loading ? 'Đang đặt…' : 'Đặt lịch'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 22, lineHeight: '30px' },
  label: { display: 'grid', gap: 6, fontSize: 14, color: '#0f172a' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none' },
  primaryBtn: { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#1a7f37', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  ghostBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 600, cursor: 'pointer' },
  linkBtn: { padding: '8px 12px', borderRadius: 10, border: 'none', background: '#0d6efd', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  error: { background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 14 },
  info: { background: '#eff6ff', color: '#1e3a8a', padding: 10, borderRadius: 8, fontSize: 14, marginTop: 4 },
  resultBox: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 10 },
};
