// src/pages/.../VehicleLink.jsx
import React, { useMemo, useState } from "react";
import "./VehicleLink.css";
import API_BASE_URL from "../../../../config";

const GOGORO_MODELS = [
  "Gogoro SuperSport",
  "Gogoro 2 Delight",
  "Gogoro Viva Mix",
  "Gogoro CrossOver S",
  "Gogoro S2 ABS",
];

// ===== Helpers =====
const toNoMark = (s) => {
  if (!s) return "";
  // CHỈ dùng khi submit/validate, KHÔNG dùng onChange
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/\s{2,}/g, " ") // gom cụm space nhưng vẫn cho phép space
    .trim(); // bỏ space đầu/cuối khi SUBMIT
};

const normalizePlate = (raw) => {
  if (!raw) return "";
  const p = raw.toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
  const m = p.match(/^([0-9]{2}[A-Z]{1,2}[0-9]{1})([0-9]{4,6})$/);
  return m ? `${m[1]}-${m[2]}` : p;
};

const isVinOk = (vin) =>
  /^[A-HJ-NPR-Z0-9]{17}$/.test(String(vin || "").toUpperCase());

// [SỬA] validate trên bản đã chuẩn hoá (plateNorm), không chặn người dùng gõ space trong input
const isPlateOk = (plate) =>
  /^[0-9]{2}[A-Z]{1,2}[0-9]{1}-[0-9]{4,6}$/.test(
    String(normalizePlate(plate || "")) // validate theo bản chuẩn hoá
  );

export default function VehicleLink() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loadingOCR, setLoadingOCR] = useState(false);
  const [saving, setSaving] = useState(false);

  // OCR results / options
  const [acceptedModels, setAcceptedModels] = useState(GOGORO_MODELS);

  // Form fields (RAW hiển thị cho user)
  // [SỬA] giữ "raw" khi người dùng gõ, không trim/normalize ngay trên onChange
  const [owner, setOwner] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [model, setModel] = useState("");
  const [modelSupported, setModelSupported] = useState(null);

  const typeLabel = useMemo(() => {
    if (modelSupported === true) return "Gogoro";
    if (modelSupported === false) return "Khác";
    return model ? "Không rõ" : "-";
  }, [modelSupported, model]);

  const jwt =
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    "";

  // ========== Handlers ==========
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setOwner("");
    setVin("");
    setLicensePlate("");
    setModel("");
    setModelSupported(null);
  };

  const handleOCR = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Vui lòng chọn ảnh cà vẹt!");
      return;
    }

    setLoadingOCR(true);
    try {
      const formData = new FormData();
      formData.append("carDoc", file);

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/vehicleOcr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data?.message || "OCR thất bại");
      }

      const s = data?.data?.suggests || {};
      const hints = data?.data?.hints || {};
      setAcceptedModels(
        Array.isArray(hints?.acceptedModels)
          ? hints.acceptedModels
          : GOGORO_MODELS
      );

      // [SỬA] Hiển thị OWNER ở dạng "không dấu" nhưng KHÔNG trim space trong lúc gõ (chỉ từ OCR thì cho gọn)
      const plainOwnerFromOCR = toNoMark(s?.ownerWithMarks || s?.owner || "");
      setOwner(plainOwnerFromOCR.toUpperCase()); // hiển thị gợi ý (người dùng vẫn sửa thêm space được)

      // VIN / plate (đổ gợi ý, vẫn cho user chỉnh)
      setVin(s?.vin || "");
      setLicensePlate(normalizePlate(s?.licensePlate || "")); // gợi ý đã chuẩn hoá, user vẫn gõ lại được

      // Model
      const beModel = s?.model || "";
      if (beModel && (hints?.acceptedModels || GOGORO_MODELS).includes(beModel)) {
        setModel(beModel);
        setModelSupported(true);
      } else {
        setModel("");
        setModelSupported(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi OCR!");
    } finally {
      setLoadingOCR(false);
    }
  };

  // [SỬA] Validate theo bản chuẩn hoá nhưng không ép người dùng mất space khi gõ
  const canSave = useMemo(() => {
    const vinUpper = (vin || "").toUpperCase();
    const plateNorm = normalizePlate(licensePlate || "");
    if (!vinUpper || !plateNorm || !model) return false;
    return isVinOk(vinUpper) && isPlateOk(plateNorm);
  }, [vin, licensePlate, model]);

  // [SỬA] Không normalize trên onChange nữa → cho gõ dấu cách tự nhiên
  const handleOwnerChange = (val) => {
    setOwner(val); // giữ raw; sẽ no-mark khi submit
  };

  const handlePlateChange = (val) => {
    setLicensePlate(val); // giữ raw; sẽ normalize khi validate/submit
  };

  const handleSave = async () => {
    if (!canSave) {
      alert("Vui lòng kiểm tra lại VIN / Biển số / Model!");
      return;
    }
    setSaving(true);
    try {
      // [SỬA] Chuẩn hoá CHỈ khi submit
      const ownerNoMark = toNoMark(owner || "") || null;
      const vinUpper = (vin || "").toUpperCase().trim();
      const plateNorm = normalizePlate(licensePlate || "");

      const res = await fetch(
        `${API_BASE_URL}/webAPI/api/secure/vehicleConfirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            vin: vinUpper,                 // chuẩn hoá khi gửi
            licensePlate: plateNorm,       // chuẩn hoá khi gửi
            owner: ownerNoMark,            // gửi không dấu
            ownerNoMark: ownerNoMark,      // giữ key cũ để tương thích
            model: (model || "").trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        if (Array.isArray(data?.acceptedModels)) {
          setAcceptedModels(data.acceptedModels);
        }
        throw new Error(data?.message || "Lưu thất bại");
      }

      alert("✅ Liên kết xe thành công!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi lưu!");
    } finally {
      setSaving(false);
    }
  };

  // ========== UI ==========
  // [SỬA] Gợi ý/nhắc người dùng: hiển thị validate theo chuẩn hoá nhưng không sửa text họ đang gõ
  const platePreview = useMemo(() => normalizePlate(licensePlate || ""), [licensePlate]);
  const vinPreview = useMemo(() => (vin || "").toUpperCase(), [vin]);

  return (
    <div className="vehicle-link-center">
      <div className="vehicle-link-page">
        <h2>🚗 Liên kết xe của bạn</h2>

        {/* Upload & OCR */}
        <form onSubmit={handleOCR} className="vehicle-upload-form">
          <label className="upload-label">
            Chọn ảnh cà vẹt xe:
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="preview" />
            </div>
          )}

          <button
            type="submit"
            className="upload-btn"
            disabled={loadingOCR || !file}
          >
            {loadingOCR ? "Đang OCR..." : "Đọc ảnh (OCR)"}
          </button>
        </form>

        {/* Form */}
        {(vin || licensePlate || owner || model) && (
          <div className="vehicle-form">
            <h4>Thông tin xe (có thể chỉnh trước khi lưu)</h4>

            <div className="field">
              <label>Tên chủ xe (Gõ Không Dấu, In Hoa ):</label>
              {/* [SỬA] không ép uppercase/trim khi gõ */}
              <input
                value={owner}
                onChange={(e) => handleOwnerChange(e.target.value)}
                placeholder="VD: LA THI MY NGHI"
              />
              {/* Gợi ý: khi lưu sẽ tự bỏ dấu & gom space thừa */}
              <small className="hint">
                Khi lưu hệ thống sẽ tự bỏ dấu và gom khoảng trắng thừa.
              </small>
            </div>

            <div className="field">
              <label>Số khung (VIN) – 17 ký tự:</label>
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="VD: LJHZZZ1C0ABCDEF12"
              />
              {!isVinOk(vin) && vin && (
                <small className="warn">VIN chưa hợp lệ.</small>
              )}
              {!!vin && (
                <small className="hint">Xem trước khi chuẩn hoá: <b>{vinPreview}</b></small>
              )}
            </div>

            <div className="field">
              <label>Biển số (được phép gõ có/không dấu cách; hệ thống tự chuẩn hoá khi lưu):</label>
              <input
                value={licensePlate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="VD: 59X3-40351 hoặc 59x340351"
              />
              {!isPlateOk(licensePlate) && licensePlate && (
                <small className="warn">Biển số chưa đúng định dạng (sau chuẩn hoá).</small>
              )}
              {!!licensePlate && (
                <small className="hint">Xem trước khi chuẩn hoá: <b>{platePreview}</b></small>
              )}
            </div>

            <div className="field">
              <label>Loại xe:</label>
              <input value={typeLabel} readOnly />
            </div>

            <div className="field">
              <label>Mẫu xe (Model):</label>
              <select
                value={acceptedModels.includes(model) ? model : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setModel(v);
                  setModelSupported(v ? true : null);
                }}
              >
                <option value="">-- Chọn model Gogoro --</option>
                {acceptedModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              className="upload-btn"
              disabled={!canSave || saving}
            >
              {saving ? "Đang lưu..." : "Lưu (Save)"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
