// src/pages/Dashboard/Staff/staff.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import "./staff.css";
import API_BASE_URL from "../../../config";
import DispatchPanel from "./Dispatch/DispatchPanel";

const tabs = [
  { label: "Tồn kho pin", value: "inventory" },
  { label: "Check In", value: "checkin" },
  { label: "Tạo Booking", value: "create" },
  { label: "Tạo tài khoản", value: "account" }, // ⬅️ thêm tab mới
];

/* ========= MessageBox ========= */
function MessageBox({ open, title, children, onClose, tone = "info", hideActions = false }) {
  if (!open) return null;
  const ICON = { success: "✅", error: "⚠️", info: "ℹ️" }[tone] || "ℹ️";
  return (
    <div className="msgbox-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`msgbox ${tone}`} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="msgbox-header">
          <span className="msgbox-icon" aria-hidden>{ICON}</span>
          <h3 className="msgbox-title">{title}</h3>
        </div>
        <div className="msgbox-body">{children}</div>
        {!hideActions && (
          <div className="msgbox-actions">
            <button className="detail-btn" onClick={onClose}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========= MOCKUP TRỤ (có Gán pin + Gỡ pin) ========= */
function PinStationMockup({ slots, title, onReload }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [avail, setAvail] = useState([]);
  const [showSelect, setShowSelect] = useState(false);

  const gridSlots = useMemo(() => {
    const list = Array.isArray(slots) ? [...slots] : [];
    while (list.length < 30) {
      list.push({
        __placeholder: true,
        id: `EMPTY_FAKE_${list.length + 1}`,
        code: `EMPTY${list.length + 1}`,
        state: "Empty",
        condition: "-",
        soh: 0,
        chargingStationName: "-",
        batteryId: null,
      });
    }
    return list.slice(0, 30);
  }, [slots]);

  const selected = selectedIndex != null ? gridSlots[selectedIndex] : null;

  function colorOf(s) {
    if (!s || s.__placeholder || !s.batteryId) return "#e5e7eb";
    const st = String(s.state || "").toLowerCase();
    const cd = String(s.condition || "").toLowerCase();
    if (cd === "damage" || cd === "damaged") return "#000000";
    if (cd === "weak" || cd === "charging" || st === "charging") return "#ef4444";
    if (st === "reserved" || st === "reversed") return "#fbbf24";
    if (st === "occupied" && cd === "good") return "#22c55e";
    return "#d1d5db";
  }

  async function openAddBattery() {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/available-batteries`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : [];
      const normalized = list.map((x) => {
        const id = x.batteryId ?? x.Battery_ID ?? x.id;
        const serial = x.serialNumber ?? x.Serial_Number ?? x.serial;
        const soh = x.soH ?? x.SoH ?? 0;
        const resistance = x.resistance ?? x.Resistance ?? null;
        const typeId = x.typeId ?? x.Type_ID ?? null;
        const typeRaw = x.batteryType ?? x.BatteryType ?? x.typeName ?? x.TypeName ?? x.Model ?? x.model ?? null;
        const typeLabel = String(typeRaw || (typeId === 1 ? "Lithium" : typeId === 2 ? "LFP" : "—")).trim();
        return { id, serial, soh, resistance, typeId, typeLabel };
      });
      setAvail(normalized);
      setShowSelect(true);
    } catch (e) {
      alert("Không tải được danh sách pin khả dụng: " + (e?.message || e));
    }
  }

  async function assignBattery(batteryId) {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/assignBatteryToSlot`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json;charset=UTF-8",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ slotId: Number(selected.slotId), batteryId: Number(batteryId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      alert("✅ Gắn pin thành công!");
      setShowSelect(false);
      setSelectedIndex(null);
      onReload && onReload();
    } catch (e) {
      alert("❌ Gắn pin thất bại: " + (e?.message || e));
    }
  }

  async function removeBattery() {
    try {
      if (!selected?.slotId) return;
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/removeBattery`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams({ slotId: String(selected.slotId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      alert("✅ Đã gỡ pin khỏi ô.");
      setSelectedIndex(null);
      onReload && onReload();
    } catch (e) {
      alert("❌ Không thể gỡ pin: " + (e?.message || e));
    }
  }

  const selectedTypeLabel = useMemo(() => {
    if (!selected) return "—";
    const raw = selected.batteryType ?? selected.BatteryType ?? selected.typeName ?? selected.TypeName ?? selected.chemistry ?? selected.Chemistry ?? null;
    if (raw) return String(raw).trim();
    const tId = Number(selected.batteryTypeId ?? selected.Type_ID ?? selected.typeId ?? 0);
    if (tId === 1) return "Lithium";
    if (tId === 2) return "LFP";
    const bc = String(selected.batteryChemistry || "").toLowerCase();
    if (bc.includes("lfp")) return "LFP";
    if (bc.includes("lithium") || bc === "li") return "Lithium";
    return "—";
  }, [selected]);

  return (
    <div className="station-mockup-minimal">
      {title && <div className="station-mockup-minimal-header">{title}</div>}
      <div className="station-mockup-minimal-inner">
        <div className="station-mockup-minimal-grid">
          {gridSlots.map((s, i) => {
            const color = colorOf(s);
            return (
              <div
                key={s.slotId || s.code || i}
                className={"station-mockup-minimal-battery" + (selectedIndex === i ? " selected" : "") + (!s.batteryId ? " empty" : "")}
                onClick={() => setSelectedIndex(i)}
                title={s.code || s.slotId}
                style={{ cursor: "pointer" }}
              >
                <span
                  className="station-mockup-minimal-dot"
                  style={{
                    background: color,
                    border: `2.5px solid ${color}`,
                    boxShadow: !s.batteryId || color === "#000000" ? "none" : `0 0 14px 3px ${color}55`,
                    opacity: !s.batteryId ? 0.6 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(2,6,23,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="station-popup"
            style={{
              position: "relative",
              zIndex: 10000,
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(25,118,210,.13)",
              padding: "18px 28px",
              minWidth: 280,
              maxWidth: "calc(100% - 40px)",
              textAlign: "left",
              color: "#222",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!selected.batteryId ? (
              <>
                <strong>{selected.code || `Slot #${selected.slotId || "-"}`}</strong> — <em>Ô trống</em>
                <p>Hiện tại chưa có pin trong ô này.</p>
                <div>Vị trí: <b>{selected.chargingStationName || "-"}</b></div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {selected.slotId && !selected.__placeholder ? (
                    <button className="detail-btn" onClick={openAddBattery}>➕ Thêm pin</button>
                  ) : null}
                  <button className="btn-secondary" onClick={() => setSelectedIndex(null)}>Đóng</button>
                </div>
                {selected.__placeholder && (
                  <small className="hint">Ô này là placeholder (API không trả slot). Không thể gán pin.</small>
                )}
              </>
            ) : (
              <>
                <strong>{selected.serial || selected.code || `Slot #${selected.slotId}`}</strong> — {selected.chargingSlotType || "—"}
                <div>Trạng thái: <b>{selected.state || "-"}</b></div>
                <div>Sức khỏe: <b>{Number(selected.soh || 0)}%</b></div>
                <div>Vị trí: <b>{selected.chargingStationName || "-"}</b></div>
                <div>Mã slot: <b>{selected.code || "-"}</b></div>
                <div>Sạc lần cuối: <b>{selected.lastUpdate || "-"}</b></div>
                <div>Loại pin: <b>{selectedTypeLabel}</b></div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    className="detail-btn"
                    onClick={removeBattery}
                    disabled={
                      String(selected.state || "").toLowerCase() !== "occupied" ||
                      String(selected.door || "").toLowerCase() !== "closed" ||
                      !selected.batteryId
                    }
                    title="Gỡ pin khỏi ô này"
                  >
                    🧲 Gỡ pin
                  </button>
                  <button className="btn-secondary" onClick={() => setSelectedIndex(null)}>Đóng</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSelect && selected && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSelect(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,.55)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              width: "min(520px, 92vw)",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 24px 80px rgba(2,6,23,.25)",
            }}
          >
            <h3>Chọn pin để gắn vào {selected?.code || `slot #${selected?.slotId}`}</h3>
            <ul style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
              {avail.length === 0 ? (
                <li>Không có pin khả dụng.</li>
              ) : (
                avail.map((b) => (
                  <li key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <span style={{ minWidth: 260, display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <b>{b.serial || `Battery #${b.id}`}</b>
                      <span aria-label="Loại pin" style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "#eef2ff", border: "1px solid #e5e7eb", lineHeight: 1.8 }}>
                        {b.typeLabel || (b.typeId === 1 ? "Lithium" : b.typeId === 2 ? "LFP" : "—")}
                      </span>
                      <span>SoH {Number(b.soh ?? 0).toFixed(1)}%</span>
                      {b.resistance != null && <span>• R {Number(b.resistance).toFixed(3)} Ω</span>}
                    </span>
                    <button className="detail-btn" onClick={() => assignBattery(b.id)}>Gắn</button>
                  </li>
                ))
              )}
            </ul>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <button className="btn-secondary" onClick={() => setShowSelect(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= TRANG CHÍNH ========= */
export default function StaffDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const role = (user?.role || "").toLowerCase();
  const isManager = role === "manager";

  if (tab === "dispatch") {
    if (!isManager) return <Navigate to="/dashboard/staff" replace />;
    return <DispatchPanel user={user} />;
  }

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [slots, setSlots] = useState([]);

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsErr, setStationsErr] = useState(null);
  const [email, setEmail] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  const [showStationModal, setShowStationModal] = useState(false);
  const [showStationModalLFP, setShowStationModalLFP] = useState(false);

  const [checkinPopup, setCheckinPopup] = useState(null);
  const [createPopup, setCreatePopup] = useState(null);
  const [previewPopup, setPreviewPopup] = useState(null);
  const [probePopup, setProbePopup] = useState(null);
  const [batteryPopup, setBatteryPopup] = useState(null);

  // ==== States cho flow tạo tài khoản (OTP → OCR → Gói & VNPay) ====
  const [accPopup, setAccPopup] = useState(null);
  const [accStep, setAccStep] = useState(1); // 1: nhập thông tin + gửi OTP ; 1.5: nhập OTP ; 2: OCR ; 3: Gói
  const [accLoading, setAccLoading] = useState(false);
  const [accErr, setAccErr] = useState(null);

  // B1: thông tin tài khoản & OTP
  const [accFullName, setAccFullName] = useState("");
  const [accPhone, setAccPhone] = useState("");
  const [accEmail, setAccEmail] = useState("");
  const [accOtp, setAccOtp] = useState("");
  const defaultPassword = "0000";

  // B2: OCR + chỉnh
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrRaw, setOcrRaw] = useState("");
  const [ownerName, setOwnerName] = useState("");          // ⬅️ NEW: chủ xe
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [modelName, setModelName] = useState("");
  const [acceptedModels, setAcceptedModels] = useState([]); // ⬅️ NEW: combobox models
  const [ocrValidVin, setOcrValidVin] = useState(null);
  const [ocrValidPlate, setOcrValidPlate] = useState(null);

  // B3: gói + VNPay
  const [packagesList, setPackagesList] = useState([]);
  const [selPackageId, setSelPackageId] = useState("");

  // ===== Helper fetch với JWT =====
  async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem("authToken") || "";
    const headers = {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${API_BASE_URL}/webAPI${path}`, {
      credentials: "include",
      ...opts,
      headers,
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json")
      ? await res.json().catch(() => ({}))
      : { error: await res.text() };
    return { res, data };
  }

  // ====== Inventory load ======
  const loadSlots = async () => {
    try {
      setLoading(true);
      setErr(null);
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/viewBatterySlotStatus`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected payload");

      const normalized = data.map((x, i) => {
        const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null);
        return {
          slotId: firstDefined(x.Slot_ID, x.slot_ID, x.slotId, i + 1),
          code: firstDefined(x.Slot_Code, x.slot_Code, x.slotCode, `S${i + 1}`),
          state: String(firstDefined(x.State, x.state, "")).trim(),
          condition: String(firstDefined(x.Condition, x.condition, "")).trim(),
          door: String(firstDefined(x.Door_State, x.door_State, x.doorState, "")).trim(),
          batteryId: firstDefined(x.Battery_ID, x.battery_ID, x.batteryId, null),
          soh: firstDefined(x.BatterySoH, x.batterySoH, x.soh, 0),
          serial: firstDefined(x.BatterySerial, x.batterySerial, x.serial, null),
          stationId: firstDefined(x.Station_ID, x.station_ID, x.stationId, null),
          chargingStationId: firstDefined(x.ChargingStation_ID, x.chargingStation_ID, x.chargingStationId, null),
          chargingSlotType: firstDefined(x.ChargingSlotType, x.chargingSlotType, x.slot_Type, ""),
          chargingStationName: firstDefined(x.ChargingStationName, x.chargingStationName, "Station"),
          lastUpdate: firstDefined(x.Last_Update, x.last_Update, x.lastUpdate, ""),
          batteryTypeId: firstDefined(x.BatteryTypeId, x.batteryTypeId, x.Type_ID, x.type_ID, x.typeId, null),
          batteryChemistry: String(firstDefined(x.BatteryChemistry, x.batteryChemistry, x.Chemistry, "")).toLowerCase(),
          batteryType: firstDefined(x.BatteryType, x.batteryType, x.TypeName, x.typeName, x.Model, x.model, null),
        };
      });

      setSlots(normalized);
    } catch (e) {
      setErr(e.message || "Failed to load slots");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
    (async () => {
      try {
        setStationsLoading(true);
        setStationsErr(null);
        const token = localStorage.getItem("authToken") || "";
        const res = await fetch(`${API_BASE_URL}/webAPI/api/getstations`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const ct = res.headers.get("content-type") || "";
        let payload = {};
        if (ct.includes("application/json")) payload = await res.json().catch(() => ({}));
        else payload = { status: "error", message: await res.text() };

        if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
        if (payload.status !== "success") throw new Error(payload.message || "Không lấy được danh sách trạm");

        const list = Array.isArray(payload.data) ? payload.data : [];
        setStations(list);
        if (list.length && !selectedStation) {
          const firstName = list[0].Name ?? list[0].station_Name ?? list[0].Station_Name ?? list[0].name ?? "";
          setSelectedStation(firstName || "");
        }
      } catch (e) {
        setStationsErr(e.message || "Không tải được danh sách trạm");
        setStations([]);
      } finally {
        setStationsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Helpers ======
  const inferChemFromSlot = (s) => {
    const t = String(s.chargingSlotType || "").toLowerCase();
    if (t.includes("lfp")) return "lfp";
    if (t.includes("li")) return "li";
    const id = Number(s.chargingStationId || 0);
    if (id === 11) return "lfp";
    if (id === 12) return "li";
    if (id) return id % 2 === 0 ? "lfp" : "li";
    const bc = String(s.batteryChemistry || "").toLowerCase();
    if (bc.includes("lfp")) return "lfp";
    if (bc.includes("lithium") || bc === "li") return "li";
    if (s.batteryTypeId === 2) return "lfp";
    if (s.batteryTypeId === 1) return "li";
    return "unknown";
  };

  const norm = useMemo(() => (v) => String(v || "").trim().toLowerCase(), []);

  const lithiumDisplaySlots = useMemo(() => {
    return slots.filter(s => {
      const chem = inferChemFromSlot(s);
      const hasBattery = !!s.batteryId;
      const norm = (v) => String(v || "").trim().toLowerCase();
      return (
        norm(s.door) === "closed" &&
        !!s.code &&
        ["occupied", "reserved", "reversed", "empty", "charging"].includes(norm(s.state)) &&
        (
          (hasBattery && Number(s.batteryTypeId) === 1) ||
          (!hasBattery && chem === "li")
        )
      );
    });
  }, [slots]);

  const lfpDisplaySlots = useMemo(() => {
    return slots.filter(s => {
      const chem = inferChemFromSlot(s);
      const hasBattery = !!s.batteryId;
      const norm = (v) => String(v || "").trim().toLowerCase();
      return (
        norm(s.door) === "closed" &&
        !!s.code &&
        ["occupied", "reserved", "reversed", "empty", "charging"].includes(norm(s.state)) &&
        (
          (hasBattery && Number(s.batteryTypeId) === 2) ||
          (!hasBattery && chem === "lfp")
        )
      );
    });
  }, [slots]);

  const { liionReady, lfpReady, totalReady } = useMemo(() => {
    const eligible = slots.filter(s =>
      norm(s.state) === "occupied" &&
      norm(s.door) === "closed" &&
      !!s.batteryId &&
      norm(s.condition) !== "weak" &&
      !!s.code
    );
    return {
      liionReady: eligible.filter(s => Number(s.batteryTypeId) === 1).length,
      lfpReady:   eligible.filter(s => Number(s.batteryTypeId) === 2).length,
      totalReady: eligible.length
    };
  }, [slots, norm]);

  const summary = useMemo(() => {
    let full = 0, charging = 0, maintenance = 0, reserved = 0;
    for (const s of slots) {
      const st = String(s.state || "").trim().toLowerCase();
      const cd = String(s.condition || "").trim().toLowerCase();
      const isReserved = st === "reserved" || st === "reversed";
      const isFull = st === "occupied" && cd === "good";
      const isCharging = st === "charging" || cd === "weak" || cd === "charging";
      const isMaintenance = cd === "damage" || cd === "damaged";
      if (isReserved) reserved++;
      else if (isMaintenance) maintenance++;
      else if (isCharging) charging++;
      else if (isFull) full++;
    }
    return { full, charging, maintenance, reserved };
  }, [slots]);

  const kpis = [
    { icon: "🟢", label: "Pin đầy", value: summary.full, sub: "Sẵn sàng sử dụng" },
    { icon: "🔌", label: "Đang sạc", value: summary.charging, sub: "Đang nạp điện / Weak" },
    { icon: "⚠️", label: "Bảo dưỡng", value: summary.maintenance, sub: "Damaged" },
    { icon: "🟡", label: "Đặt trước", value: summary.reserved, sub: "Reserved/Reversed" },
  ];

  const [bookingId, setBookingId] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  const fmt = (s) => {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s);
    const pad = (n) => String(n).padStart(2, "0");
   return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear())}`;

  };

  // ====== Checkin flow ======
  const startCheckinFlow = async () => {
    const id = bookingId.trim();
    if (!id) return;
    const token = localStorage.getItem("authToken") || "";
    try {
      setCheckingIn(true);
      const r = await fetch(
        `${API_BASE_URL}/webAPI/api/checkin?bookingId=${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);

      const slot = data.slot || {};
      const vehicle = data.vehicle || {};

      const view = {
        bookingId: data.bookingId,
        bookerName: data.bookerName,
        licensePlate: vehicle.licensePlate,
        modelName: vehicle.modelName,
        requestedBattery: data.requestedBattery,
        chargingStationName: slot.chargingStationName,
        slotCode: slot.slotCode,
        bookingTime: fmt(data.bookingTime),
        expiredDate: fmt(data.expiredDate),
      };

      setPreviewPopup({
        title: "Thông tin Booking",
        body: (
          <div style={{ lineHeight: 1.7 }}>
            <div><b>Booking ID:</b> {view.bookingId}</div>
            <div><b>Khách hàng:</b> {view.bookerName || "—"}</div>
            <div><b>Xe:</b> {view.modelName || "—"}</div>
            <div><b>Biển số:</b> {view.licensePlate || "—"}</div>
            <div><b>Gói pin yêu cầu:</b> {view.requestedBattery || "—"}</div>
            <div><b>Kiosk:</b> {view.chargingStationName || "—"}</div>
            <div><b>Slot:</b> {view.slotCode || "—"}</div>
            <div><b>Thời điểm đặt:</b> {view.bookingTime || "—"}</div>
            <div><b>Hết hạn lúc:</b> {view.expiredDate || "—"}</div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="detail-btn"
                onClick={() => {
                  setPreviewPopup(null);
                  setProbePopup({
                    title: "Yêu cầu Driver",
                    body: (
                      <div style={{ lineHeight: 1.7 }}>
                        <p><b>Vui lòng đưa pin cũ vào khe kiểm tra</b> để hệ thống đọc SoH & loại pin.</p>
                        <p style={{ marginTop: 4 }}>Sau khi đã đưa pin vào, bấm <b>Kiểm tra</b>.</p>
                        <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="btn-secondary" onClick={() => setProbePopup(null)}>Đóng</button>
                          <button
                            className="detail-btn"
                            onClick={async () => {
                              setProbePopup(null);
                              await handleCheckBattery();
                            }}
                          >
                            Kiểm tra
                          </button>
                        </div>
                      </div>
                    ),
                  });
                }}
              >
                Tiếp
              </button>
            </div>
          </div>
        ),
      });
    } catch (e) {
      setPreviewPopup({ title: "Lỗi", body: String(e.message || e) });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckBattery = async () => {
    const id = bookingId.trim();
    if (!id) return;

    const token = localStorage.getItem("authToken") || "";
    try {
      setCheckingIn(true);
      const res = await fetch(`${API_BASE_URL}/webAPI/api/checkin`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams({ bookingId: id }),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : { error: await res.text() };

      if (!res.ok || data.error) {
        setBatteryPopup({ title: "Lỗi", body: data.error || `HTTP ${res.status}` });
        return;
      }

      const b = data.newBattery || {};
      const slot = data.slot || {};

      setBatteryPopup({
        title: "Kiểm tra pin",
        body: (
          <div style={{ lineHeight: 1.7 }}>
            <div><b>SoH pin cũ (ước lượng):</b> {data.sohOld != null ? `${Number(data.sohOld)}%` : "—"}</div>
            <div><b>ID pin cấp mới:</b> {b.batteryId ?? "—"}</div>
            <div><b>Serial pin:</b> {b.serial || "—"}</div>
            <div><b>SoH pin mới:</b> {b.soh != null ? `${Number(b.soh)}%` : "—"}</div>
            <div><b>Model/Loại:</b> {b.model || (b.typeId === 2 ? "LFP" : b.typeId === 1 ? "Lithium" : "—")}</div>
            <div><b>Vị trí cấp:</b> {(slot.slotCode || "—") + (slot.chargingStationName ? ` — ${slot.chargingStationName}` : "")}</div>
            <div><b>Phí tạm tính:</b> {data.fee != null ? Number(data.fee).toLocaleString("vi-VN") + " đ" : "—"}</div>
            {data.paymentUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={data.paymentUrl} target="_blank" rel="noreferrer" className="detail-btn">
                  Thanh toán VNPay
                </a>
              </div>
            )}
            {data.message && (
              <div style={{ marginTop: 8, padding: 8, background: "#f1f5f9", borderRadius: 8 }}>{data.message}</div>
            )}
          </div>
        ),
      });

      if (!data.paymentUrl) {
        loadSlots();
      }
    } catch (err) {
      setBatteryPopup({ title: "Lỗi kết nối", body: String(err?.message || err) });
    } finally {
      setCheckingIn(false);
    }
  };

  const formatVehicleLabel = (v) => {
    const model = v?.modelName || v?.brand || "Xe";
    const plate = v?.licensePlate || v?.vin || "Biển số ?";
    return `${model} — ${plate}`;
  };

  // ====== Flow tạo tài khoản: B1 Gửi OTP ======
  async function handleSendOtp() {
    setAccErr(null);
    if (!accFullName.trim() || !accPhone.trim() || !accEmail.trim()) {
      setAccErr("Vui lòng nhập đủ Họ tên, Số điện thoại và Email.");
      return;
    }
    try {
      setAccLoading(true);
      const payload = {
        fullName: accFullName.trim(),
        phone: accPhone.trim(),
        email: accEmail.trim(),
        password: defaultPassword,
      };
      const { res, data } = await apiFetch(`/api/secure/staff/guest/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setAccPopup({ title: "Đã gửi OTP", body: "Mã OTP đã được gửi tới email khách. Nhập OTP để tiếp tục." });
      setAccStep(1.5);
    } catch (e) {
      setAccErr(e.message || "Không gửi được OTP");
    } finally {
      setAccLoading(false);
    }
  }

  // (Tuỳ chọn) B1.5 kiểm OTP (server chỉ check cache, không insert DB)
  async function handleVerifyOtpOnly() {
    setAccErr(null);
    if (!accEmail.trim() || !accOtp.trim()) {
      setAccErr("Vui lòng nhập Email & OTP.");
      return;
    }
    try {
      setAccLoading(true);
      const { res, data } = await apiFetch(`/api/secure/staff/guest/check-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({ email: accEmail.trim(), otp: accOtp.trim() }),
      });
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setAccPopup({ title: "OTP hợp lệ", body: "Tiếp tục bước OCR cà-vẹt xe." });
      setAccStep(2);
    } catch (e) {
      setAccErr(e.message || "OTP không hợp lệ");
    } finally {
      setAccLoading(false);
    }
  }

  // ====== B2 OCR cà-vẹt ======
  async function handleUploadOcr() {
    setAccErr(null);
    if (!ocrFile) {
      setAccErr("Vui lòng chọn ảnh cà-vẹt xe.");
      return;
    }
    try {
      setAccLoading(true);
      const form = new FormData();
      form.append("carDoc", ocrFile);
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staff/vehicle/ocr`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : { error: await res.text() };

      if (!res.ok || data.error || data.status !== "ok") throw new Error(data.error || `HTTP ${res.status}`);

      // Ưu tiên final -> overrides -> suggests
      const pick = (k) => data.final?.[k] ?? data.overrides?.[k] ?? data.suggests?.[k] ?? "";

      setOcrRaw(data.rawText || "");
      setOwnerName(pick("owner"));
      setVin(pick("vin"));
      setPlate(pick("licensePlate"));
      setModelName(pick("model"));

      // BE validity fields: vinFromOcr / plateFromOcr
      setOcrValidVin(data.validity?.vinFromOcr ?? null);
      setOcrValidPlate(data.validity?.plateFromOcr ?? null);

      // Combobox models (5 model Gogoro)
      const models = Array.isArray(data.hints?.acceptedModels) ? data.hints.acceptedModels : [];
      setAcceptedModels(models);

      setAccPopup({ title: "Kết quả OCR", body: "Bạn có thể chỉnh sửa Họ tên / VIN / Biển số / Model trước khi lưu." });
    } catch (e) {
      setAccErr(e.message || "OCR thất bại");
    } finally {
      setAccLoading(false);
    }
  }

  // ====== B3 Gói & VNPay ======
  async function loadPackagesIfNeeded() {
    try {
      if (packagesList.length > 0) return;
      setAccLoading(true);
      const { res, data } = await apiFetch(`/api/getpackages`, { method: "GET" });
      if (!res.ok || data.status !== "success") throw new Error(data.message || `HTTP ${res.status}`);
      const list = Array.isArray(data.data) ? data.data : [];
      setPackagesList(list);
      if (list.length) {
        const firstId = String(list[0].packageId ?? list[0].Package_ID ?? list[0].id);
        setSelPackageId(firstId);
      }
    } catch (e) {
      setAccErr(e.message || "Không tải được danh sách gói");
    } finally {
      setAccLoading(false);
    }
  }

  async function handleVerifyAndOnboard() {
    setAccErr(null);
    if (!accEmail.trim() || !accOtp.trim()) {
      setAccErr("Thiếu Email hoặc OTP.");
      return;
    }
    if (!vin.trim() || !plate.trim() || !modelName.trim()) {
      setAccErr("Vui lòng hoàn tất thông tin xe: VIN, Biển số, Model.");
      return;
    }
    if (!selPackageId) {
      setAccErr("Vui lòng chọn gói pin.");
      return;
    }

    try {
      setAccLoading(true);
      const body = {
        email: accEmail.trim(),
        otp: accOtp.trim(),
        vin: vin.trim(),
        licensePlate: plate.trim(),
        modelName: modelName.trim(),     // ⬅️ lấy từ combobox
        packageId: Number(selPackageId),
        returnUrl: window.location.origin,
        // ownerName có thể gửi thêm nếu BE hỗ trợ:
        // ownerName: ownerName?.trim() || null,
      };

      const { res, data } = await apiFetch(`/api/secure/staff/guest/verify-and-onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify(body),
      });

      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      setAccPopup({
        title: "Tạo tài khoản & liên kết xe thành công",
        body: (
          <div>
            <div>User ID: <b>{data.userId}</b></div>
            <div>Gói: <b>{data.packageName}</b></div>
            <div>Giá: <b>{Number(data.price || 0).toLocaleString("vi-VN")} đ</b></div>
            {data.payUrl ? (
              <div style={{ marginTop: 8 }}>
                <a href={data.payUrl} target="_blank" rel="noreferrer" className="detail-btn">Thanh toán VNPay</a>
              </div>
            ) : (
              <div style={{ marginTop: 8, color: "#ef4444" }}>Không nhận được link thanh toán.</div>
            )}
          </div>
        ),
      });
      setAccStep(3.9);
    } catch (e) {
      setAccErr(e.message || "Gộp verify & onboard thất bại");
    } finally {
      setAccLoading(false);
    }
  }

  // ====== UI ======
  return (
    <div className="staff-dashboard-wrap">
      {/* Panel ảnh 2 trụ */}
      <div className="staff-right-panel" style={{ display: "flex", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <img src="/ping.jpg" alt="Trụ Li-ion" className="staff-right-image" onClick={() => setShowStationModal(true)} style={{ cursor: "pointer" }} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ Li-ion</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <img src="/ping.jpg" alt="Trụ LFP" className="staff-right-image" onClick={() => setShowStationModalLFP(true)} style={{ cursor: "pointer" }} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ LFP</div>
        </div>
      </div>

      {/* Card dashboard */}
      <div className="staff-dashboard-card">
        <h2 className="staff-dashboard-title">Dashboard Nhân viên Trạm</h2>
        <div className="staff-dashboard-subtitle">Quản lý tồn kho pin và Check In</div>

        <div style={{ marginTop: 6, fontSize: 14, color: "#334155" }}>
          <b>Chuẩn Driver (sẵn sàng đổi):</b> Li-ion: {liionReady} • LFP: {lfpReady} • Tổng: {totalReady}
        </div>

        <div className="staff-dashboard-summary">
          {kpis.map((c, i) => (
            <div key={i} className="staff-dashboard-summary-card">
              <div className="staff-dashboard-summary-icon">{c.icon}</div>
              <div className="staff-dashboard-summary-value">{c.value}</div>
              <div className="staff-dashboard-summary-label">{c.label}</div>
              <div className="staff-dashboard-summary-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="staff-dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={"staff-dashboard-tab-btn" + (activeTab === tab.value ? " active" : "")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "inventory" && (
            <div className="staff-inventory-section">
              <div className="staff-inventory-title">Tình trạng trụ</div>
              <div className="staff-inventory-desc">Nhấn vào ảnh trụ ở trên để xem sơ đồ ô.</div>
              {err && <div style={{ color: "#ef4444", marginTop: 8 }}>{err}</div>}
              {loading && <div style={{ marginTop: 8 }}>Đang tải dữ liệu…</div>}
            </div>
          )}

          {activeTab === "checkin" && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Check In</div>
              <div className="staff-transaction-desc">
                1) Nhập <b>Booking ID</b> → bấm <b>Check-in</b> để xem thông tin Booking (9 dòng).<br/>
                2) Trong popup, bấm <b>Tiếp</b> → <b>Yêu cầu Driver</b> (Đưa pin vào) → <b>Kiểm tra</b>.
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập Booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="input"
                  style={{ maxWidth: 280 }}
                />
                <button
                  type="button"
                  className="detail-btn"
                  onClick={startCheckinFlow}
                  disabled={!bookingId.trim() || checkingIn}
                  title="Bắt đầu Check-in (xem thông tin Booking)"
                >
                  {checkingIn ? "Đang xử lý…" : "Check-in"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Tạo Booking</div>
              <div className="staff-transaction-desc">
                Nhập <b>Email</b> khách hàng, chọn <b>Trạm</b> & <b>Xe</b> để tạo booking.
              </div>

              <div className="row">
                <label className="lbl">Email khách hàng</label>
                <div className="row-inline">
                  <input
                    type="email"
                    placeholder="vd: khach@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input grow"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const mail = email.trim();
                      if (!mail) return;
                      try {
                        setLoadingVehicles(true);
                        const token = localStorage.getItem("authToken") || "";
                        const qs = new URLSearchParams({ email: mail, station: selectedStation || "" }).toString();
                        const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking?${qs}`, {
                          method: "GET",
                          credentials: "include",
                          headers: {
                            Accept: "application/json",
                            "ngrok-skip-browser-warning": "1",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
                        const vs = Array.isArray(data.vehicles) ? data.vehicles : [];
                        const vehiclesWithLabel = vs.map((x) => ({
                          ...x,
                          vehicleLabel: x.vehicleLabel || `${x?.modelName || x?.brand || "Xe"} — ${x?.licensePlate || x?.vin || "Biển số ?"}`,
                        }));
                        setVehicles(vehiclesWithLabel);
                        setSelectedVehicle(vehiclesWithLabel.length > 0 ? String(vehiclesWithLabel[0].vehicleId) : "");
                        setCreatePopup({
                          title: "Đã tải danh sách xe",
                          body: vehiclesWithLabel.length ? `Tìm thấy ${vehiclesWithLabel.length} xe. Hãy chọn 1 xe để tạo booking.` : "Không có xe nào cho email này.",
                        });
                      } catch (e) {
                        setVehicles([]);
                        setSelectedVehicle("");
                        setCreatePopup({ title: "Lỗi", body: e.message || "Không tải được xe" });
                      } finally {
                        setLoadingVehicles(false);
                      }
                    }}
                    disabled={!email.trim() || loadingVehicles}
                    title="Tải xe theo email"
                  >
                    {loadingVehicles ? "Đang tải…" : "Lấy xe"}
                  </button>
                </div>
              </div>

              <div className="row">
                <label className="lbl">Chọn trạm</label>
                <select className="input" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                  {stationsLoading && <option>Đang tải trạm…</option>}
                  {!stationsLoading && stations.length === 0 && <option value="">Không có dữ liệu trạm</option>}
                  {!stationsLoading && stations.map((s) => {
                    const key = s.Station_ID ?? s.station_ID ?? s.id;
                    const label = s.Name ?? s.station_Name ?? s.Station_Name ?? s.name ?? `Station #${key ?? ""}`;
                    return <option key={key} value={label}>{label}</option>;
                  })}
                </select>
                {stationsErr && <small className="hint error">{stationsErr}</small>}
              </div>

              <div className="row">
                <label className="lbl">Chọn xe</label>
                <select
                  className="input"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  disabled={vehicles.length === 0}
                >
                  {vehicles.length === 0 && <option value="">Chưa có xe — hãy “Lấy xe”</option>}
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.vehicleLabel || `${v?.modelName || v?.brand || "Xe"} — ${v?.licensePlate || v?.vin || "Biển số ?"}`}
                      {v.batteryType ? ` (${v.batteryType})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <button
                  type="button"
                  className="detail-btn"
                  onClick={async () => {
                    const mail = email.trim();
                    if (!mail || !selectedStation || !selectedVehicle) {
                      setCreatePopup({ title: "Thiếu thông tin", body: "Vui lòng nhập Email, chọn Trạm và chọn Xe trước khi tạo booking." });
                      return;
                    }
                    try {
                      setCreatingBooking(true);
                      const token = localStorage.getItem("authToken") || "";
                      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          Accept: "application/json",
                          "Content-Type": "application/json;charset=UTF-8",
                          "ngrok-skip-browser-warning": "1",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          email: mail,
                          stationName: selectedStation,
                          vehicleId: Number(selectedVehicle),
                        }),
                      });

                      let data = {};
                      const ct = res.headers.get("content-type") || "";
                      if (ct.includes("application/json")) data = await res.json().catch(() => ({}));
                      else data = { error: await res.text() };

                      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

                      const vehicleLine =
                        data.vehicleLabel ||
                        `${data.vehicleModelName || "Xe"}${data.licensePlate ? " — " + data.licensePlate : ""}`;

                      setCreatePopup({
                        title: "Tạo booking thành công",
                        body: (
                          <div>
                            <div>Booking ID: <b>{data.bookingId}</b></div>
                            <div>Trạng thái: <b>{data.status}</b></div>
                            {vehicleLine && vehicleLine.trim() !== "Xe" && (
                              <div>Xe / Biển số: <b>{vehicleLine}</b></div>
                            )}
                            <div>Hết hạn: <b>{data.expiredTime}</b></div>
                          </div>
                        ),
                      });
                    } catch (e) {
                      setCreatePopup({ title: "Tạo booking thất bại", body: e.message || "Không tạo được booking" });
                    } finally {
                      setCreatingBooking(false);
                    }
                  }}
                  disabled={creatingBooking || !email.trim() || !selectedStation || !selectedVehicle}
                >
                  {creatingBooking ? "Đang tạo…" : "Tạo Booking"}
                </button>
                <small className="hint">Hệ thống sẽ tự giữ pin phù hợp tại trạm trong 1 giờ.</small>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Tạo tài khoản (OTP → OCR → Gói & VNPay)</div>
              <div className="staff-transaction-desc">
                Nhập thông tin khách (mật khẩu mặc định <b>0000</b>) → gửi OTP → nhập OTP để tiếp tục → tải ảnh cà-vẹt lên để OCR và chỉnh sửa → chọn gói pin → thanh toán VNPay.
              </div>

              {/* Bước 1: Nhập thông tin + Gửi OTP */}
              {(accStep === 1 || accStep === 1.5) && (
                <>
                  <div className="row">
                    <label className="lbl">Họ và tên</label>
                    <input className="input" value={accFullName} onChange={e => setAccFullName(e.target.value)} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="row">
                    <label className="lbl">Số điện thoại</label>
                    <input className="input" value={accPhone} onChange={e => setAccPhone(e.target.value)} placeholder="09xx..." />
                  </div>
                  <div className="row">
                    <label className="lbl">Email</label>
                    <input className="input" value={accEmail} onChange={e => setAccEmail(e.target.value)} placeholder="khach@example.com" />
                  </div>
                  <div className="row">
                    <small className="hint">Mật khẩu mặc định: <b>{defaultPassword}</b> (khách có thể đổi sau).</small>
                  </div>
                  <div className="row" style={{ display: "flex", gap: 8 }}>
                    <button className="detail-btn" onClick={handleSendOtp} disabled={accLoading}>
                      {accLoading ? "Đang gửi..." : "Gửi OTP"}
                    </button>
                    {accStep === 1.5 && (
                      <>
                        <input className="input" style={{ maxWidth: 160 }} placeholder="Nhập OTP" value={accOtp} onChange={e => setAccOtp(e.target.value)} />
                        <button className="detail-btn" onClick={handleVerifyOtpOnly} disabled={accLoading || !accOtp.trim()}>
                          {accLoading ? "Đang xác minh..." : "Xác minh OTP"}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Bước 2: OCR cà-vẹt & chỉnh */}
              {accStep === 2 && (
                <>
                  <div className="row">
                    <label className="lbl">Ảnh cà-vẹt</label>
                    <input type="file" accept="image/*" onChange={e => setOcrFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="row" style={{ display: "flex", gap: 8 }}>
                    <button className="detail-btn" onClick={handleUploadOcr} disabled={accLoading || !ocrFile}>
                      {accLoading ? "Đang OCR..." : "OCR & Gợi ý"}
                    </button>
                  </div>

                  <div className="row">
                    <label className="lbl">Họ tên chủ xe</label>
                    <input
                      className="input"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="VD: NGUYỄN VĂN A"
                    />
                    <small className="hint">Có thể sửa tay nếu OCR chưa chính xác.</small>
                  </div>

                  <div className="row">
                    <label className="lbl">VIN</label>
                    <input className="input" value={vin} onChange={e => setVin(e.target.value)} />
                    {ocrValidVin != null && <small className={"hint " + (ocrValidVin ? "ok" : "error")}>{ocrValidVin ? "VIN hợp lệ" : "VIN chưa hợp lệ"}</small>}
                  </div>
                  <div className="row">
                    <label className="lbl">Biển số</label>
                    <input className="input" value={plate} onChange={e => setPlate(e.target.value)} />
                    {ocrValidPlate != null && <small className={"hint " + (ocrValidPlate ? "ok" : "error")}>{ocrValidPlate ? "Biển số hợp lệ" : "Biển số chưa hợp lệ"}</small>}
                  </div>

                  <div className="row">
                    <label className="lbl">Model (chọn từ danh sách)</label>
                    <select
                      className="input"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    >
                      <option value="">-- Chọn model --</option>
                      {acceptedModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {acceptedModels.length === 0 && (
                      <small className="hint">Danh sách model sẽ xuất hiện sau khi OCR thành công.</small>
                    )}
                  </div>

                  <div className="row" style={{ display: "flex", gap: 8 }}>
                    <button className="btn-secondary" onClick={() => setAccStep(1.5)}>◀ Quay lại</button>
                    <button className="detail-btn" onClick={() => { setAccStep(3); loadPackagesIfNeeded(); }}>
                      Tiếp tục chọn gói
                    </button>
                  </div>
                </>
              )}

              {/* Bước 3: Chọn gói & thanh toán VNPay */}
              {accStep === 3 && (
                <>
                  <div className="row">
                    <label className="lbl">Chọn gói pin</label>
                    <select className="input" value={selPackageId} onChange={e => setSelPackageId(e.target.value)}>
                      {packagesList.length === 0 && <option value="">Đang tải gói...</option>}
                      {packagesList.map(p => {
                        const id = p.packageId ?? p.Package_ID ?? p.id;
                        const name = p.name ?? p.Name;
                        const price = p.price ?? p.Price ?? 0;
                        return <option key={id} value={id}>{name} — {Number(price).toLocaleString("vi-VN")} đ</option>;
                      })}
                    </select>
                  </div>
                  <div className="row" style={{ display: "flex", gap: 8 }}>
                    <button className="btn-secondary" onClick={() => setAccStep(2)}>◀ Quay lại</button>
                    <button className="detail-btn" onClick={handleVerifyAndOnboard} disabled={accLoading || !selPackageId}>
                      {accLoading ? "Đang xử lý..." : "Xác thực & Thanh toán"}
                    </button>
                  </div>
                </>
              )}

              {accErr && <div style={{ color: "#ef4444", marginTop: 8 }}>{accErr}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Modal trụ Li-ion */}
      {showStationModal && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModal(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: "#ef4444" }}>{err}</div>}
            {!loading && <PinStationMockup slots={lithiumDisplaySlots} title="Trụ Li-ion" onReload={loadSlots} />}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal trụ LFP */}
      {showStationModalLFP && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModalLFP(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: "#ef4444" }}>{err}</div>}
            {!loading && <PinStationMockup slots={lfpDisplaySlots} title="Trụ LFP" onReload={loadSlots} />}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModalLFP(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Check In */}
      <MessageBox
        open={!!checkinPopup}
        title={checkinPopup?.title || ""}
        onClose={() => setCheckinPopup(null)}
        tone={
          checkinPopup?.title?.toLowerCase().includes("thất bại")
            ? "error"
            : checkinPopup?.title?.toLowerCase().includes("thành công")
            ? "success"
            : "info"
        }
      >
        <div className="msgbox-content">{checkinPopup?.body}</div>
      </MessageBox>

      {/* Popup Tạo Booking */}
      <MessageBox
        open={!!createPopup}
        title={createPopup?.title || ""}
        onClose={() => setCreatePopup(null)}
        tone={
          createPopup?.title?.toLowerCase().includes("thành công")
            ? "success"
            : createPopup?.title?.toLowerCase().includes("lỗi") ||
              createPopup?.title?.toLowerCase().includes("thất bại")
            ? "error"
            : "info"
        }
      >
        <div className="msgbox-content">{createPopup?.body}</div>
      </MessageBox>

      {/* Popup: Xem thông tin Booking */}
      <MessageBox
        open={!!previewPopup}
        title={previewPopup?.title || ""}
        onClose={() => setPreviewPopup(null)}
        tone={previewPopup?.title?.toLowerCase().includes("lỗi") ? "error" : "info"}
      >
        <div className="msgbox-content">{previewPopup?.body}</div>
      </MessageBox>

      {/* Popup: Yêu cầu Driver (ẩn footer để không bị 2 nút Đóng) */}
      <MessageBox
        open={!!probePopup}
        title={probePopup?.title || ""}
        onClose={() => setProbePopup(null)}
        tone="info"
        hideActions={true}
      >
        <div className="msgbox-content">{probePopup?.body}</div>
      </MessageBox>

      {/* Popup: Kết quả kiểm tra pin (không có nút Đóng) */}
     {batteryPopup && (
  <div
    className="msgbox-backdrop"
    role="dialog"
    aria-modal="true"
    onClick={() => setBatteryPopup(null)} // Bấm ra ngoài cũng tắt
  >
    <div
      className={
        "msgbox " +
        (batteryPopup?.title?.toLowerCase().includes("lỗi")
          ? "error"
          : batteryPopup?.title?.toLowerCase().includes("kiểm tra pin") ||
            batteryPopup?.title?.toLowerCase().includes("kết quả")
          ? "success"
          : "info")
      }
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <div className="msgbox-header">
        <span className="msgbox-icon" aria-hidden>
          {batteryPopup?.title?.toLowerCase().includes("lỗi")
            ? "⚠️"
            : batteryPopup?.title?.toLowerCase().includes("kiểm tra pin") ||
              batteryPopup?.title?.toLowerCase().includes("kết quả")
            ? "✅"
            : "ℹ️"}
        </span>
        <h3 className="msgbox-title">{batteryPopup?.title || "Kiểm tra pin"}</h3>
      </div>

      <div className="msgbox-body">
        <div className="msgbox-content">{batteryPopup?.body}</div>
      </div>

      {/* ✅ Thêm nút Đóng */}
      <div className="msgbox-actions" style={{ textAlign: "right", marginTop: 12 }}>
        <button className="detail-btn" onClick={() => setBatteryPopup(null)}>
          Đóng
        </button>
      </div>
    </div>
  </div>
)}


      {/* Popup flow Tạo tài khoản */}
      <MessageBox
        open={!!accPopup}
        title={accPopup?.title || ""}
        onClose={() => setAccPopup(null)}
        tone={
          accPopup?.title?.toLowerCase().includes("lỗi") ||
          accPopup?.title?.toLowerCase().includes("thất bại")
            ? "error"
            : accPopup?.title?.toLowerCase().includes("thành công")
            ? "success"
            : "info"
        }
      >
        <div className="msgbox-content">{accPopup?.body}</div>
      </MessageBox>
    </div>
  );
}
