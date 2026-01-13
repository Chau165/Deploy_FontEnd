import React, { useState } from "react";
import "./ForgotPass.css";
import API_BASE_URL from "../../config"; // ✅ Import đúng từ config.js

export default function ForgotPass() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/webAPI/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data?.status === "success") {
        setSubmitted(true);
      } else {
        setError(data?.message || "Có lỗi xảy ra khi gửi yêu cầu.");
      }
    } catch (err) {
      console.error("Lỗi FE:", err);
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotpass-container">
      <div className="forgotpass-box">
        <h2>Quên mật khẩu</h2>
        <p>Nhập email bạn đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>

        {submitted ? (
          <div className="forgotpass-success">
            <p>✅ Vui lòng kiểm tra email để nhận hướng dẫn đặt lại mật khẩu.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgotpass-form">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </form>
        )}

        {error && <p className="forgotpass-error">⚠ {error}</p>}
      </div>
    </div>
  );
}
