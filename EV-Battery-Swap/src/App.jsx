import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LoginModal from './components/Login/LoginModal';

// Pages
import Home from './pages/Home/Home';
import Battery from './pages/Battery Electric/Battery';
import BatteryPin from './pages/Battery Electric/BatteryPin';
import Polices from './pages/Polices/polices';
import ForgotPass from './components/Login/ForgotPass';
import ResetPass from './components/Login/ResetPass';
import AdminDashboard from './pages/Dashboard/Admin/admin';
import StaffDashboard from './pages/Dashboard/Staff/staff';
import DriverDashboard from './pages/Dashboard/Driver/findSation/driver.jsx';
import VehicleLink from './pages/Dashboard/Driver/vehicleLink/VehicleLink';
import UserInfo from './pages/User/UserInfo';
import TransactionHistory from './pages/User/TransactionHistory';
import Booking from './pages/Dashboard/Driver/Booking/booking.jsx';
import BookingHistory from './pages/Dashboard/Driver/Booking/BookingHistory.jsx';

// ✅ Thêm import ViewComment
import ViewComment from './pages/Dashboard/Staff/Comment/ViewComment.jsx';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleOpenModal = () => setIsLoginModalOpen(true);
  const handleCloseModal = () => setIsLoginModalOpen(false);
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setIsLoginModalOpen(false);
  };

  return (
    <Router>
      <AppContent
        user={user}
        isLoginModalOpen={isLoginModalOpen}
        onOpenModal={handleOpenModal}
        onCloseModal={handleCloseModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </Router>
  );
}

function AppContent({ user, isLoginModalOpen, onOpenModal, onCloseModal, onLoginSuccess }) {
  const location = useLocation();
  const isStaffDashboard = location.pathname === '/dashboard/staff';
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect driver về dashboard khi ở trang gốc
    if (
      user?.role?.toLowerCase() === 'driver' &&
      (location.pathname === '/' || location.pathname === '')
    ) {
      navigate('/dashboard/driver');
    }
  }, [user, navigate, location.pathname]);

  return (
    <>
      <Header onLoginClick={onOpenModal} user={user} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battery" element={<Battery />} />
          <Route path="/battery-pin" element={<BatteryPin />} />
          <Route path="/polices" element={<Polices onLoginClick={onOpenModal} user={user} />} />

          <Route path="/dashboard/admin" element={<AdminDashboard user={user} onLoginClick={onOpenModal} />} />
          <Route path="/dashboard/staff" element={<StaffDashboard user={user} onLoginClick={onOpenModal} />} />

          {/* ✅ Thêm route riêng cho trang xem nhận xét */}
          <Route
            path="/dashboard/staff/comment"
            element={<ViewComment />}
          />

          {/* Alias cho manager */}
          <Route path="/manager/dashboard" element={<Navigate to="/dashboard/staff" replace />} />

          <Route path="/dashboard/driver" element={<DriverDashboard />} />
          <Route path="/dashboard/driver/booking" element={<Booking />} />
          <Route path="/driver/booking-history" element={<BookingHistory />} />
          <Route path="/vehicle-link" element={<VehicleLink />} />
          <Route path="/forgot-pass" element={<ForgotPass />} />
          <Route path="/reset-pass" element={<ResetPass />} />
          <Route path="/user/info" element={<UserInfo />} />
          <Route path="/user/transactions" element={<TransactionHistory />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isStaffDashboard && <Footer />}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={onCloseModal}
        onLoginSuccess={onLoginSuccess}
      />
    </>
  );
}

export default App;