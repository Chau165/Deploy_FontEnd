import React, { useEffect, useRef, useState } from "react";
import "./polices.css";
import API_BASE_URL from "../../config";
import { GogoroPolicyModern } from "./policesGogoro.jsx";

/* ===================== SLIDE WORDS ===================== */
const slideWords = [
  "Dễ dàng và tiện lợi",
  "Giá trị tốt cho tiền",
  "trình độ cao",
  "Không có hạn chế",
  "Toàn diện",
  "Thêm phản hồi",
  "Bất cứ lúc nào, bất cứ lúc nào",
  "Hiệu quả",
  "Nhiều ưu đãi",
  "Hiểu bạn",
  "Thật vui",
  "có ý nghĩa to lớn",
  "Toàn diện",
  "tương lai",
  "Công suất tối đa",
  "Tùy chỉnh",
  "Nhiều khả năng",
  "độ đàn hồi",
  "Sinh ra là dành cho bạn",
  "đáng tin cậy",
  "Đạt yêu cầu",
  "Dễ dàng và tiện lợi",
];

function PolicesHeader() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideWords.length);
    }, 1800);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <section className="section section-leading">
      <div className="container">
        <h1 className="leading-title texture-solid">
          Làm cho trải nghiệm của bạn nhiều hơn
        </h1>
        <div className="slidewords-row">
          <span className="word-slide sliding" style={{ height: "1.25em" }}>
            <span
              className="words word-slide-track"
              style={{ transform: `translateY(-${current * 1.25}em)` }}
            >
              {slideWords.map((word, idx) => (
                <span className="word" key={idx}>
                  {word}
                </span>
              ))}
            </span>
          </span>
        </div>
        <h2 className="leading-subtitle">
          Sau đó, hãy tạm biệt việc tiếp nhiên liệu và bắt đầu thay pin.
        </h2>
        <p className="leading-description">
          Nhiều gói cước khác nhau, bạn có thể đi theo bất kỳ cách nào bạn muốn!
        </p>
      </div>
    </section>
  );
}

export default function Polices({ onLoginClick, user }) {
  return (
    <>
      <PolicesHeader />
      <PolicesPricingFAQ onLoginClick={onLoginClick} user={user} />
    </>
  );
}

/* --- SVG Icon --- */
const CheckIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* --- Button --- */
const Button = ({
  size = "md",
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const sizeClass = `btn--${size}`;
  const variantClass = `btn--${variant}`;
  return (
    <button className={`btn ${sizeClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

/* ====== Fallback tĩnh nếu API lỗi (tối giản để không crash) ====== */
const fallbackPackages = [
  {
    packageId: 1,
    name: "Basic",
    price: 199000,
    description: "Gói cơ bản",
    minSoH: 80,
    maxSoH: 100,
    requiredSoH: 80,
  },
  {
    packageId: 2,
    name: "Standard",
    price: 299000,
    description: "Gói tiêu chuẩn",
    minSoH: 75,
    maxSoH: 100,
    requiredSoH: 75,
  },
];

/* ===================== MAIN ===================== */
export function PolicesPricingFAQ({ onLoginClick, user }) {
  const isLoggedIn = !!(user && (user.fullName || user.fullname || user.name));

  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState([]);
  const [error, setError] = useState("");

  const cardClassByName = {
    Eco: "card--basic",
    Basic: "card--standard",
    Standard: "card--optimal",
    Premium: "card--advanced",
  };
  const isHighlighted = (name) => name === "Basic";

  // Đọc JSON an toàn
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(`HTTP ${res.status} – ${text.slice(0, 200)}`);
  };

  // Lấy dữ liệu gói pin
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${API_BASE_URL}/webAPI/api/getpackages`;
        const res = await fetch(url, {
          method: "GET",
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const json = await safeJson(res);
        if (abort) return;
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

        const data = Array.isArray(json?.data) ? json.data : [];
        const mapped = data.map((pkg) => ({
          packageId: pkg.packageId,
          nameVi: pkg.name,
          price: pkg.price,
          period: "VND/tháng",
          description: pkg.description,
          features: [
            `Nhận pin trong khoảng SoH ${pkg.minSoH}–${pkg.maxSoH}%`,
            `Pin trả ≥${pkg.requiredSoH}% thì miễn phí`,
            `Yêu cầu SoH tối thiểu: ${pkg.requiredSoH}%`,
            "Phù hợp cho nhu cầu di chuyển đa dạng",
          ],
          cta: `Chọn gói ${pkg.name}`,
          highlighted: isHighlighted(pkg.name),
          cardClass: cardClassByName[pkg.name] || "card--basic",
        }));

        setTiers(mapped);
      } catch (e) {
        console.error("⚠️ getpackages error:", e);
        // Fallback để UI vẫn hiển thị
        const mapped = fallbackPackages.map((pkg) => ({
          packageId: pkg.packageId,
          nameVi: pkg.name,
          price: pkg.price,
          period: "VND/tháng",
          description: pkg.description,
          features: [
            `Nhận pin trong khoảng SoH ${pkg.minSoH}–${pkg.maxSoH}%`,
            `Pin trả ≥${pkg.requiredSoH}% thì miễn phí`,
            `Yêu cầu SoH tối thiểu: ${pkg.requiredSoH}%`,
            "Phù hợp cho nhu cầu di chuyển đa dạng",
          ],
          cta: `Chọn gói ${pkg.name}`,
          highlighted: isHighlighted(pkg.name),
          cardClass: cardClassByName[pkg.name] || "card--basic",
        }));
        setTiers(mapped);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // Lấy userId FE (ưu tiên props.user, fallback localStorage)
  const getUserIdFE = () => {
    if (user?.id) return String(user.id);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.id) return String(u.id);
    } catch {}
    return "";
  };

  /* ======== MUA GÓI (mở VNPay tab mới) ======== */
  const handleChoosePlan = (tier) => {
    if (!tier || !tier.packageId) return;
    if (!isLoggedIn) {
      onLoginClick && onLoginClick();
      return; // ❌ không hiện message đỏ
    }

    const userId = getUserIdFE();
    const amount = typeof tier.price === "number" ? tier.price : 0;
    const packageId = tier.packageId;
    if (!userId) return;

    const params = new URLSearchParams({
      userId: String(userId),
      amount: String(amount),
      orderType: "buyPackage",
      packageId: String(packageId),
    });

    const payUrl = `${API_BASE_URL}/webAPI/api/payment?${params.toString()}`;
    window.open(payUrl, "_blank", "noopener,noreferrer"); // ✅ mở VNPay tab mới
  };

  const currency = (v) =>
    typeof v === "number"
      ? v.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : "-";

  return (
    <>
      <div className="polices-container">
        <header className="page-header">
          <div className="header-icon-wrapper">
            <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="header-title">Gói cước dịch vụ đổi pin</h1>
          <p className="header-subtitle">
            Chọn gói cước phù hợp với nhu cầu di chuyển của bạn. Tất cả các gói
            đều có thể thay đổi bất kỳ lúc nào. Không có chi phí ẩn.
          </p>
        </header>

        <main className="pricing-section">
          {loading ? (
            <div className="pricing-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="pricing-card card--basic">
                  <div className="card-content">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="card-price-wrapper">
                      <div className="skeleton skeleton-price" />
                    </div>
                    <ul className="card-features">
                      {[1, 2, 3, 4].map((j) => (
                        <li key={j} className="feature-item">
                          <span className="skeleton skeleton-line" />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-footer">
                    <Button size="lg" className="w-full" disabled>
                      Đang tải…
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="api-message" style={{ color: "red" }}>
              {error}
            </div>
          ) : (
            <div className="pricing-grid">
              {tiers.map((tier) => (
                <div key={tier.packageId} className={`pricing-card ${tier.cardClass}`}>
                  {tier.highlighted && <div className="highlight-badge">Phổ biến nhất</div>}

                  <div className="card-content">
                    <h3 className="card-title">{tier.nameVi}</h3>
                    <p className="card-description">{tier.description}</p>

                    <div className="card-price-wrapper">
                      {typeof tier.price === "number" && tier.price > 0 ? (
                        <>
                          <div className="card-price">
                            {tier.price.toLocaleString("vi-VN")}
                          </div>
                          <div className="card-period">VND/tháng</div>
                        </>
                      ) : (
                        <div className="card-price-special">
                          {tier.price === 0 ? "Miễn Phí" : currency(tier.price)}
                        </div>
                      )}
                    </div>

                    <ul className="card-features">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="feature-item">
                          <CheckIcon className="feature-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-footer">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => handleChoosePlan(tier)}
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

  {/* ====== GOGORO POLICY MODERN DESIGN BÊN DƯỚI ====== */}
  <GogoroPolicyModern onLoginClick={onLoginClick} user={user} />
    </>
  );
}

/* Chỉ phần gói pin (re-use) */
export function PolicesOnlyPricingFAQ({ onLoginClick, user }) {
  return <PolicesPricingFAQ onLoginClick={onLoginClick} user={user} />;
}