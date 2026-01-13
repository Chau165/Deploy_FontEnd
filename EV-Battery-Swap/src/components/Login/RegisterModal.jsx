import React, { useRef, useEffect, useState } from 'react';
import API_BASE_URL from '../../config';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) {
  const modalRef = useRef();

  // ======= form state =======
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });

  // ======= ui state =======
  const [step, setStep] = useState(1); // 1: nhập thông tin & gửi OTP, 2: nhập OTP & xác thực
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const MAX_RESEND = 5;

  // ======= Lifecycle =======
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose && onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen) return;
    setStep(1);
    setOtp('');
    setError(null);
    setNotice(null);
    setLoading(false);
    setResendCooldown(0);
    setResendCount(0);
    setRegForm({ fullName: '', phone: '', email: '', password: '', confirm: '' });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  // ================== API with debug logs ==================
  async function apiSendOtp(payload) {
    const url = `${API_BASE_URL}/webAPI/api/register/send-otp`;
    console.log('📤 [SEND-OTP] URL =', url);
    console.log('📦 [SEND-OTP] Payload =', payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    console.log('📥 [SEND-OTP] Status =', res.status);
    console.log('📥 [SEND-OTP] Raw Response =', raw);

    let data = {};
    try { data = JSON.parse(raw); } catch (_) {}
    if (!res.ok) throw new Error(data.error || data.message || `Send OTP failed (HTTP ${res.status})`);
    return data;
  }

  async function apiVerifyOtp({ email, otp }) {
    const url = `${API_BASE_URL}/webAPI/api/register/verify-otp`;
    console.log('📤 [VERIFY-OTP] URL =', url);
    console.log('📦 [VERIFY-OTP] Payload =', { email, otp });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email, otp }),
    });

    const raw = await res.text();
    console.log('📥 [VERIFY-OTP] Status =', res.status);
    console.log('📥 [VERIFY-OTP] Raw Response =', raw);

    let data = {};
    try { data = JSON.parse(raw); } catch (_) {}
    if (!res.ok) throw new Error(data.error || data.message || `Verify OTP failed (HTTP ${res.status})`);
    return data;
  }

  async function apiResendOtp({ email }) {
    const url = `${API_BASE_URL}/webAPI/api/register/resend-otp`;
    console.log('📤 [RESEND-OTP] URL =', url);
    console.log('📦 [RESEND-OTP] Payload =', { email });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email }),
    });

    const raw = await res.text();
    console.log('📥 [RESEND-OTP] Status =', res.status);
    console.log('📥 [RESEND-OTP] Raw Response =', raw);

    let data = {};
    try { data = JSON.parse(raw); } catch (_) {}
    if (!res.ok) throw new Error(data.error || data.message || `Resend OTP failed (HTTP ${res.status})`);
    return data;
  }

  // ================== Handlers ==================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const { fullName, phone, email, password, confirm } = regForm;
    if (!fullName || !phone || !email || !password || !confirm) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await apiSendOtp({ fullName, phone, email, password });
      setStep(2);
      setNotice(`Đã gửi OTP tới ${email}. Vui lòng kiểm tra hộp thư (OTP hiệu lực 5 phút).`);
      setResendCooldown(60);
      setResendCount(0);
    } catch (err) {
      console.error('❌ [SEND-OTP] Error:', err);
      setError(err.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!otp) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    try {
      setLoading(true);
      const { email } = regForm;
      const data = await apiVerifyOtp({ email, otp });
      console.log('✅ [VERIFY-OTP] Success data:', data);
      setNotice('Xác thực thành công! Tài khoản đã được tạo.');
      if (onRegisterSuccess) onRegisterSuccess({ token: data.token, user: data.user });
      onSwitchToLogin ? onSwitchToLogin() : onClose && onClose();
    } catch (err) {
      console.error('❌ [VERIFY-OTP] Error:', err);
      setError(err.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);

    if (resendCooldown > 0) return;
    if (resendCount >= MAX_RESEND) {
      setError('Bạn đã vượt quá số lần gửi lại OTP. Vui lòng chờ hoặc đăng ký lại.');
      return;
    }

    try {
      setLoading(true);
      await apiResendOtp({ email: regForm.email });
      setNotice('Đã gửi lại OTP. Vui lòng kiểm tra email.');
      setResendCooldown(60);
      setResendCount((c) => c + 1);
    } catch (err) {
      console.error('❌ [RESEND-OTP] Error:', err);
      setError(err.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ================== Render ==================
  return (
    <div className="modal-backdrop">
      <div className="login-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Đóng">&times;</button>

        <h2 className="modal-title">Đăng ký</h2>
        <p className="modal-subtitle">
          {step === 1 ? 'Nhập thông tin và gửi OTP để xác thực email' : 'Nhập mã OTP để hoàn tất đăng ký'}
        </p>

        {step === 1 && (
          <form className="login-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input name="fullName" value={regForm.fullName} onChange={handleChange} placeholder="Nhập họ và tên" required />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input name="phone" value={regForm.phone} onChange={handleChange} placeholder="Nhập số điện thoại" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={regForm.email} onChange={handleChange} placeholder="Nhập email" required />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input type="password" name="password" value={regForm.password} onChange={handleChange} placeholder="Nhập mật khẩu" required />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input type="password" name="confirm" value={regForm.confirm} onChange={handleChange} placeholder="Nhập lại mật khẩu" required />
            </div>

            {error && <p className="error-message">{error}</p>}
            {notice && <p className="notice-message" style={{ color: '#0a7' }}>{notice}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={regForm.email} disabled />
            </div>
            <div className="form-group">
              <label>Mã OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập OTP 6 chữ số" autoFocus />
            </div>

            {error && <p className="error-message">{error}</p>}
            {notice && <p className="notice-message" style={{ color: '#0a7' }}>{notice}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Xác thực & Tạo tài khoản'}
            </button>

            <div className="form-options" style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(1)} disabled={loading}>← Sửa thông tin</button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0 || resendCount >= MAX_RESEND}
                title={resendCooldown > 0 ? `Chờ ${resendCooldown}s để gửi lại` : undefined}
              >
                {resendCooldown > 0
                  ? `Gửi lại OTP (${resendCooldown}s)`
                  : resendCount >= MAX_RESEND ? 'Đã hết lượt gửi lại' : 'Gửi lại OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
