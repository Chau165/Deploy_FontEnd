import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../../../../config";
import "./booking.css";

export default function Booking() {
  // form state
  const [station, setStation] = useState("");
  const [vehicleId, setVehicleId] = useState(""); // <-- vehicleId thay cho vehicleName
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // data state
  const [vehicles, setVehicles] = useState([]); // list các xe của user
  const [stations, setStations] = useState([
    // TODO: nếu có API trạm, thay bằng fetch
    "Gogoro Central Park",
    "Gogoro Grand Park - Khu 1",
    "Gogoro Central Đồng Khởi",
    "Gogoro Golden River",
  ]);

  // ui state
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // token (đặt nhiều key cho chắc)
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("jwt_token");

  // ===== Load vehicles của user =====
  useEffect(() => {
    async function loadVehicles() {
      setLoadingVehicles(true);
      setError("");
      try {
        const url = `${API_BASE_URL}/webAPI/api/secure/my-vehicles`;
        console.log("[Booking] GET", url);
        const res = await fetch(url, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
          credentials: "include",
        });

        const text = await res.text();
        const ct = res.headers.get("content-type") || "";
        console.log("[Booking] vehicles HTTP", res.status, "| CT:", ct);
        console.log("[Booking] vehicles RAW:", text);

        let data = [];
        try {
          data = text && text.trim() ? JSON.parse(text) : [];
        } catch {
          data = [];
        }

        if (!res.ok) {
          throw new Error(
            (data && data.error) ||
              (data && data.message) ||
              `Tải danh sách xe thất bại (${res.status})`
          );
        }

        setVehicles(Array.isArray(data) ? data : []);
        // nếu user chỉ có 1 xe → tự set sẵn
        if (Array.isArray(data) && data.length === 1) {
          setVehicleId(String(data[0].vehicle_ID || data[0].Vehicle_ID));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Không tải được danh sách xe!");
      } finally {
        setLoadingVehicles(false);
      }
    }

    if (token) loadVehicles();
  }, [token]);

  // build label hiển thị cho option xe
  const vehicleOptions = useMemo(() => {
    return vehicles.map((v) => {
      // DTO của bạn dùng PascalCase — tuỳ mapper sẽ là Vehicle_ID hay vehicle_ID.
      const id = v.Vehicle_ID ?? v.vehicle_ID ?? v.vehicleId;
      const model = v.Model_Name ?? v.model_Name ?? v.modelName ?? v.model;
      const plate = v.License_Plate ?? v.license_Plate ?? v.licensePlate;
      return {
        id,
        label: `${model || "Model ?"} — ${plate || "Biển số ?"}`,
      };
    });
  }, [vehicles]);

  // ===== Submit booking =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResult(null);

    if (!station || !vehicleId || !date || !time) {
      setError("Vui lòng chọn trạm, xe, ngày và giờ.");
      return;
    }
    // Ghép về ISO Local DateTime chuẩn backend
    const bookingTime = `${date}T${time}`;
    // Kiểm tra thời gian đặt lịch phải lớn hơn hiện tại
    const bookingDateTime = new Date(bookingTime);
    const now = new Date();
    if (isNaN(bookingDateTime.getTime())) {
      setError("Thời gian đặt lịch không hợp lệ.");
      return;
    }
    if (bookingDateTime <= now) {
      setError("Thời gian đặt lịch phải lớn hơn thời gian hiện tại.");
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE_URL}/webAPI/api/secure/booking`;
      console.log("[Booking] POST", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          stationName: station, // BE chấp nhận stationName|station
          bookingTime,          // "YYYY-MM-DDTHH:mm"
          vehicleId: Number(vehicleId),
        }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") || "";
      console.log("[Booking] HTTP", res.status, res.statusText, "| CT:", ct);
      console.log("[Booking] RAW:", text);

      let data = {};
      try {
        data = text && text.trim() ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        const msg =
          data?.error || data?.message || `Đặt lịch thất bại (${res.status})`;
        throw new Error(msg);
      }

      // Thành công
      if (data.bookingId) {
        setSuccess(true);
        setResult(data);
      } else {
        setError(data.message || "Đặt lịch thất bại!");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-container">
      <h2 className="booking-title">Đăng ký lịch đổi pin</h2>

      {success ? (
        <div className="booking-success">
          <div>✅ Đăng ký thành công! Vui lòng đến trạm đúng giờ để đổi pin.</div>
          {result && (
            <div className="booking-result">
              <div>
                Mã đặt lịch: <b>{result.bookingId}</b>
              </div>
              <div>
                Trạm: <b>{result.stationId}</b> • Trạm sạc:{" "}
                <b>{result.chargingStationId}</b>
              </div>
              <div>
                Ô pin: <b>{result.slotId}</b>
              </div>
              <div>
                Loại pin: <b>{result.batteryType}</b>
              </div>
              {result.vehicleId && (
                <div>
                  Vehicle ID: <b>{result.vehicleId}</b>
                </div>
              )}
              <div>Thời gian: {result.bookingTime}</div>
              <div>Hết hạn: {result.expiredTime}</div>
              {result.qrCode && (
                <div style={{ marginTop: 12 }}>
                  <img
                    alt="QR Booking"
                    src={`data:image/png;base64,${result.qrCode}`}
                    style={{ width: 160, height: 160 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="booking-error">{error}</div>}

          {/* Trạm */}
          <label>
            Tên trạm:
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              required
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          {/* Xe của tôi (từ API) */}
          <label>
            Xe của tôi:
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              disabled={loadingVehicles}
            >
              <option value="">
                {loadingVehicles ? "Đang tải danh sách xe..." : "-- Chọn xe --"}
              </option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          {/* Ngày & giờ */}
          <label>
            Ngày đổi pin:
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label>
            Giờ đổi pin:
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={submitting || loadingVehicles}>
            {submitting ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
      )}
    </div>
  );
}