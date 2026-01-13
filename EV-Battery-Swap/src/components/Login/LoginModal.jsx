import React, { useRef, useEffect, useState } from 'react';
import RegisterModal from './RegisterModal';
import ForgotPass from './ForgotPass';
import './LoginModal.css';
import API_BASE_URL from '../../config';

/**
 * LoginModal — Ghi nhớ trang hiện tại (cả HashRouter và BrowserRouter)
 * Khi login xong: điều hướng theo role:
 *  - Staff/Manager/Admin: luôn vào dashboard role
 *  - Driver: giữ logic cũ (polices -> payment nếu có gói; ngược lại quay lại trang trước)
 *  - Guest/khác: quay lại trang trước
 */
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const modalRef = useRef(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ======== Hàm lấy đường dẫn hiện tại (hỗ trợ cả HashRouter và BrowserRouter) ========
  const getCurrentPath = () => {
    const hash = window.location.hash; // ví dụ: #/polices
    if (hash && hash.startsWith('#/')) return hash.slice(1); // -> /polices
    return window.location.pathname || '/';
  };

  // ======== Điều hướng an toàn (HashRouter/BrowswerRouter) ========
  const go = (path) => {
    // Nếu đang dùng HashRouter (có hash root) → dùng hash
    if (window.location.hash !== undefined) {
      // Nếu đã có '#', đảm bảo path bắt đầu với '/'
      const normalized = path.startsWith('/') ? path : `/${path}`;
      window.location.hash = '#' + normalized;
    } else {
      window.location.href = path;
    }
  };

  // ======== Map role -> dashboard path ========
const getDashboardPathByRole = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'staff':
      return '/dashboard/staff';
    case 'manager':
      // ✅ Manager cũng dùng chung trang staff
      return '/dashboard/staff';
    case 'admin':
      return '/dashboard/admin';
    case 'driver':
      return null; // giữ logic cũ cho driver
    default:
      return null;
  }
};

  // Đóng modal khi click ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // ======== Gửi request login ========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/webAPI/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = data?.message || data?.error || 'Email hoặc mật khẩu không đúng.';
        throw new Error(msg);
      }

      // Lưu thông tin đăng nhập
      if (data?.token) localStorage.setItem('authToken', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));

      if (onLoginSuccess) onLoginSuccess(data?.user);

      // Điều hướng theo role
      onClose();
      const role = data?.user?.role || data?.user?.Role || data?.user?.roleName;
      if (role) {
        switch (role.toLowerCase()) {
          case 'driver':
            go('/dashboard/driver');
            return;
          case 'staff':
          case 'manager':
            go('/dashboard/staff');
            return;
          case 'admin':
            go('/dashboard/admin');
            return;
        }
      }
      // Nếu không có role, dùng redirect cũ
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      go(redirectPath);
    } catch (err) {
      setError(err.message || 'Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ======== Modal con (Register / Forgot Password) ========
  if (showRegister) {
    return (
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => setShowRegister(false)}
        onLoginSuccess={onLoginSuccess}
      />
    );
  }

  if (showForgot) {
    return (
      <div className="modal-backdrop">
        <div className="login-modal" style={{ padding: 0 }}>
          <button className="close-btn" onClick={() => setShowForgot(false)} aria-label="Đóng">&times;</button>
          <ForgotPass />
        </div>
      </div>
    );
  }

  // ======== UI chính ========
  return (
    <div className="modal-backdrop">
      <div className="login-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Đóng">&times;</button>
        <h2 className="modal-title">Đăng nhập</h2>
        <p className="modal-subtitle">Chào mừng trở lại. Vui lòng nhập thông tin của bạn.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Nhập email của bạn"
              required
              value={formData.email}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              placeholder="Nhập mật khẩu"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="form-options" style={{ marginTop: 12 }}>
            <span
              className="forgot-password"
              style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => setShowForgot(true)}
            >
              Quên mật khẩu?
            </span>
          </div>
        </form>

        <p className="signup-link">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            className="register-link"
            style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onClick={() => setShowRegister(true)}
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}
