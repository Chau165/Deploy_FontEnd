import React, { useEffect, useState } from "react";
import "./DispatchPanel.css";
import API_BASE_URL from "../../../../config";

export default function DispatchPanel({ user }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    batteryName: "",
    qtyGood: 0,
    qtyAverage: 0,
    qtyBad: 0,
  });

  // loading khi ấn xác nhận từng dòng
  const [confirmingId, setConfirmingId] = useState(null);

  /* ======= Handle input ======= */
  const onChange = (e) => {
    const { name, value } = e.target;

    // Chuẩn hóa riêng cho input số: ép >= 0, integer
    if (name === "qtyGood" || name === "qtyAverage" || name === "qtyBad") {
      let v = String(value || "0").replace(/[^\d]/g, "");
      const n = Math.max(0, parseInt(v || "0", 10));
      setForm((prev) => ({ ...prev, [name]: n }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ======= Load danh sách yêu cầu (đang dùng /dispatchPending) ======= */
  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchPending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadRequests error:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  /* ======= Submit form gửi yêu cầu ======= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validate cơ bản phía FE
      if (!form.batteryName) throw new Error("Vui lòng chọn loại pin.");
      const total = Number(form.qtyGood || 0) + Number(form.qtyAverage || 0) + Number(form.qtyBad || 0);
      if (total === 0) throw new Error("Tổng số lượng phải > 0.");

      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
        // ❗ Không gửi stationName nữa — BE tự lấy Station_ID theo Manager đăng nhập
        body: new URLSearchParams({
          batteryName: form.batteryName,
          qtyGood: String(form.qtyGood),
          qtyAverage: String(form.qtyAverage),
          qtyBad: String(form.qtyBad),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gửi yêu cầu thất bại.");

      setResult({
        type: "success",
        message: `Gửi yêu cầu thành công (Mã #${data.requestId || "?"})`,
      });

      // Reset form (không reset loại pin để thao tác nhanh)
      setForm((prev) => ({ ...prev, qtyGood: 0, qtyAverage: 0, qtyBad: 0 }));
      await loadRequests();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ======= Xác nhận đã nhận pin (Manager trạm request) ======= */
  const handleConfirm = async (dispatchId) => {
    if (!dispatchId) return;
    setConfirmingId(dispatchId);
    setResult(null);

    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchConfirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
        body: new URLSearchParams({ dispatchId: String(dispatchId) }),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { success: false, message: text }; }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Xác nhận thất bại (HTTP ${res.status})`);
      }

      const moved = `Đã chuyển Good:${data.movedGood ?? 0} / Avg:${data.movedAverage ?? data.movedAvg ?? 0} / Weak:${data.movedBad ?? 0}`;
      const warn = data.warning ? ` — Cảnh báo: ${data.warning}` : "";
      setResult({ type: "success", message: `Xác nhận thành công. ${moved}${warn}` });

      await loadRequests();
    } catch (err) {
      setResult({ type: "error", message: err.message || "Xác nhận thất bại." });
    } finally {
      setConfirmingId(null);
    }
  };

  /* ======= Helper ======= */
  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = iso.includes("T") ? iso.split("T")[0] : iso;
    return d;
  };

  const totalOf = (r) =>
    Number(r?.qtyGood || 0) + Number(r?.qtyAverage || 0) + Number(r?.qtyBad || 0);

  const renderStatus = (status) => {
    const key = String(status || "pending").toLowerCase();
    const map = {
      pending: "Đang chờ",
      preparing: "Đang chuẩn bị",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      complete: "Hoàn tất",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    };
    return map[key] || status || "Không rõ";
  };

  const canConfirm = (row) =>
    String(row?.status || "").toLowerCase() === "preparing";

  /* ======= JSX ======= */
  return (
    <div className="dispatch-panel">
      <h2 className="dispatch-title">📦 Điều phối pin</h2>
      <p className="dispatch-desc">
        Quản lý gửi yêu cầu điều phối pin về cho <b>Admin</b> phê duyệt.
      </p>

      {/* Banner: nhắc không cần nhập tên trạm */}
      <div className="info-banner" role="status" aria-live="polite">
        <span className="info-dot" aria-hidden>ℹ️</span>
        <div>
          <div><b>Gợi ý:</b> Bạn không cần chọn trạm.</div>
          <div>Hệ thống sẽ tự gắn yêu cầu với <b>trạm của Manager đang đăng nhập</b>.</div>
        </div>
      </div>

      {/* ==== FORM ==== */}
      <form className="dispatch-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Loại pin</label>
            <select
              name="batteryName"
              value={form.batteryName}
              onChange={onChange}
              required
            >
              <option value="">-- Chọn loại pin --</option>
              {/* Giá trị nên khớp với tên trong bảng Battery_Type (Model) để DAO map chính xác */}
              <option value="Lithium-ion">Lithium-ion</option>
              <option value="LFP">LFP</option>
            </select>
            <small className="hint">Tên hiển thị phải trùng “Model”/tên loại mà BE đang map.</small>
          </div>

          <div className="form-group soh-col">
            <label>Số lượng theo SoH</label>
            <div className="soh-row">
              <div>
                <span>Good:</span>
                <input
                  type="number"
                  name="qtyGood"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyGood}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>Average:</span>
                <input
                  type="number"
                  name="qtyAverage"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyAverage}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>Weak:</span>
                <input
                  type="number"
                  name="qtyBad"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyBad}
                  onChange={onChange}
                />
              </div>
            </div>
            <small className="hint">
              Tổng số lượng phải &gt; 0. Hệ thống sẽ kiểm tra thêm ở máy chủ.
            </small>
          </div>
        </div>

        <button type="submit" className="dispatch-btn" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>

      {result && (
        <div className={`dispatch-result ${result.type}`}>
          {result.type === "success" ? "✅" : "⚠️"} {result.message}
        </div>
      )}

      {/* ==== DANH SÁCH ==== */}
      <h3 className="dispatch-subtitle">📋 Yêu cầu đã gửi</h3>

      <div className="table-wrapper">
        <table className="req-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Trạm gửi</th>
              <th>Trạm nhận</th>
              <th>Loại pin</th>
              <th>Số lượng<br /><small>(Good/Avg/Weak • Tổng)</small></th>
              <th>Thời gian Request</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-cell">
                  Chưa có yêu cầu nào.
                </td>
              </tr>
            )}

            {requests.map((r) => (
              <tr key={r.requestId}>
                <td className="id-cell">#{r.requestId}</td>
                <td>{r.stationRequestName || "—"}</td>
                <td>{r.stationRespondName || "—"}</td>
                <td>{r.batteryName || "—"}</td>
                <td>
                  {`${r.qtyGood || 0}/${r.qtyAverage || 0}/${r.qtyBad || 0}`}
                  {"  •  "}
                  <b>{totalOf(r)}</b>
                </td>
                <td>{formatDate(r.requestTime)}</td>
                <td>
                  <span
                    className={`status-badge ${String(
                      r.status || "pending"
                    ).toLowerCase()}`}
                  >
                    {renderStatus(r.status)}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleConfirm(r.requestId)}
                      disabled={!canConfirm(r) || confirmingId === r.requestId}
                      className="btn-confirm"
                      title="Xác nhận đã nhận pin"
                    >
                      {confirmingId === r.requestId ? "Đang xác nhận…" : "Xác nhận"}
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={loadRequests}
                      title="Tải lại"
                    >
                      ↻
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
