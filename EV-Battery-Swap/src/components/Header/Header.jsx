import { useEffect, useState, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import logo from "../../assets/react.svg";
import "./Header.css";
import { useNavigate, Link, useLocation } from "react-router-dom";

/* ---------------- Brand ---------------- */
function Brand() {
  return (
    <a className="brand" href="/" aria-label="home">
      <img src={logo} alt="Logo" className="brand-logo" />
      <span className="brand-title">GogoRo Battery Swapping</span>
    </a>
  );
}

/* ---------------- Battery dropdown ---------------- */
function BatteryDropdown({ show, onEnter, onLeave, isActive }) {
  return (
    <div className="nav-dropdown" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <span className={`nav-link dropdown-trigger ${isActive ? "active" : ""}`}>
        Pin và Trạm đổi pin
        <svg className="dropdown-arrow" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      {show && (
        <div className="dropdown-menu">
          <Link
            to="/battery"
            className={`dropdown-item ${isActive === "/battery" ? "active" : ""}`}
          >
            Trạm đổi pin
          </Link>
          <Link
            to="/battery-pin"
            className={`dropdown-item ${isActive === "/battery-pin" ? "active" : ""}`}
          >
            Công nghệ pin
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------------- Navigation ---------------- */
function Navigation({
  isActive,
  isBatteryActive,
  showBatteryDropdown,
  setShowBatteryDropdown,
  user,
}) {
  const role = user?.role?.toLowerCase() || "";

  // Staff/Admin/Driver: không có tab nào
  if (role === "staff" || role === "admin" || role === "driver") {
    return <nav className="main-nav" aria-label="Primary" />;
  }

  // Manager: chỉ 2 mục
  if (role === "manager") {
    return (
      <nav className="main-nav" aria-label="Primary">
        <Link
          to="/dashboard/Staff/Comment"
          className={`nav-link ${isActive("/dashboard/Staff/Comment") ? "active" : ""}`}
        >
          Xem Nhận Xét
        </Link>
        <Link
          to="/dashboard/staff?tab=dispatch"
          className={`nav-link ${isActive("/dashboard/staff") ? "active" : ""}`}
        >
          Điều phối pin
        </Link>
      </nav>
    );
  }

  // Khách (chưa đăng nhập): tab public
  return (
    <nav className="main-nav" aria-label="Primary">
      <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
        Trang Chủ
      </Link>

      <BatteryDropdown
        show={showBatteryDropdown}
        onEnter={() => setShowBatteryDropdown(true)}
        onLeave={() => setShowBatteryDropdown(false)}
        isActive={isBatteryActive()}
      />

      <Link
        to="/polices"
        className={`nav-link ${isActive("/polices") ? "active" : ""}`}
      >
        Gói dịch vụ
      </Link>
    </nav>
  );
}

/* ---------------- Header chính ---------------- */
export default function Header({ onLoginClick, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showBatteryDropdown, setShowBatteryDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;
  const isBatteryActive = () =>
    location.pathname === "/battery" || location.pathname === "/battery-pin";

  const role = user?.role?.toLowerCase() || "";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showUserMenu]);

  return (
    <header
      className={`site-header ${scrolled ? "scrolled" : hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="header-inner">
        <Brand />

        <Navigation
          isActive={isActive}
          isBatteryActive={isBatteryActive}
          showBatteryDropdown={showBatteryDropdown}
          setShowBatteryDropdown={setShowBatteryDropdown}
          user={user}
        />

        <div className="actions">
          {/* Driver có "Liên kết xe" + User menu */}
          {role === "driver" && (
            <Link to="/vehicle-link" className="cta vehicle-link">
              Liên kết xe
            </Link>
          )}

          {user && user.fullName ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="User menu"
              >
                <FaUserCircle className="user-menu-icon" />
              </button>
              <span className="user-menu-name">{user.fullName}</span>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <button
                    className="user-menu-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/user/info");
                    }}
                  >
                    Tài khoản
                  </button>
                  <button
                    className="user-menu-btn logout"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="#"
              className="cta login"
              onClick={(e) => {
                e.preventDefault();
                onLoginClick();
              }}
            >
              Đăng Nhập
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
