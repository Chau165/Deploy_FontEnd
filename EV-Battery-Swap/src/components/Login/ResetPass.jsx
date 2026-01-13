import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ResetPass.css";
import API_BASE_URL from "../../config"; // ✅ Import đúng từ config.js

export default function ResetPass() {
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get("token") || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tokenFromLink) {
      setError("Thiếu token đặt lại mật khẩu trong liên kết.");
      return;
    }
    if (!otp || otp.trim().length !== 6) {
      setError("Vui lòng nhập OTP gồm 6 chữ số.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/webAPI/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          token: tokenFromLink,
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.status === "success") {
        setSubmitted(true);
      } else {
        setError(data?.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch (err) {
      console.error("Lỗi FE:", err);
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-center-wrap">
      <div className="card-box">
        <h2>Đặt lại mật khẩu</h2>
        <p>Nhập OTP từ email và đặt mật khẩu mới.</p>

        {submitted ? (
          <div className="success-msg">
            <p>✅ Đổi mật khẩu thành công. Bạn có thể quay lại trang đăng nhập.</p>
            <a href="/login">← Quay lại đăng nhập</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-col">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Nhập mã OTP (6 số)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <div className="error-msg">⚠ {error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
