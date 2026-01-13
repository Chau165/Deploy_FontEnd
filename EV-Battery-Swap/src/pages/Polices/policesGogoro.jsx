
import React from "react";
import "./policesGogoro.css";
import "./policesGogoro.css";

// Small helper to render technical terms with tooltip
function Term({ children, title }) {
  return (
    <abbr className="term-tooltip" title={title} aria-label={title}>
      {children}
    </abbr>
  );
}

function renderTextWithTerms(text) {
  if (typeof text !== 'string') return text;
  // Replace common terms like SoH with tooltip component
  if (text.includes('SoH')) {
    const parts = text.split(/(SoH)/g);
    return parts.map((p, i) => (p === 'SoH' ? <Term key={i} title={'State of Health — tỉ lệ phần trăm cho biết độ bền còn lại của pin'}>SoH</Term> : p));
  }
  return text;
}

// ===================== GOGORO POLICY MODERN DESIGN =====================
export const tabDataGogoro = [
  {
    label: "Chính sách thuê Pin",
    leftTitle: "Áp dụng cho các dòng xe GogoRo (ví dụ: Ludo, Theon, Vento) và các mẫu tương thích",
    left: [
      "Đặt cọc pin: 1.200.000 VNĐ/pin",
      "Khách hàng sẽ được hoàn trả khoản cọc khi thanh lý hợp đồng thuê pin.",
      "Phí chuyển đổi gói cước: Không áp dụng.",
      "Thời hạn hợp đồng thuê: Vô thời hạn đến khi khách hàng hết nhu cầu hoặc hủy xe.",
      "Thời gian & hình thức thanh toán:",
      [
        "Chu kỳ tính cước: Tròn tháng, tính từ ngày đầu tiên của tháng tới ngày cuối cùng của tháng.",
        "Phí thuê bao pin được thu trước ngày 01 của tháng. Khách hàng có thể đóng 1 tháng hoặc nhiều tháng một lúc.",
    "Lịch sử thanh toán: Thanh toán tại đại lý/ứng dụng của nhà cung cấp (VinFast) hoặc các đại lý ủy quyền."
      ]
    ],
    rightTitle: "Phí thuê pin hàng tháng",
    rightNote: "Liên hệ hotline hoặc đại lý để chuyển đổi gói. Giá bên dưới mang tính tham khảo theo gói hiện hành.",
    plans: [
      {
        name: "GÓI CƠ BẢN",
        price: [
          { Basic: 1, value: 200000 },
          { Eco: 1, value: 300000 }
        ],
        note: "Phù hợp người dùng di chuyển trung bình. Đã bao gồm dịch vụ hỗ trợ và đổi pin theo chu kỳ."
      },
      {
        name: "GÓI TIÊU CHUẨN",
        price: [
          { Standard: 1, value: 400000 },
          { Premium: 2, value: 800000 }
        ],
        note: "Gói phổ biến cho người dùng thường xuyên. Không giới hạn quãng đường."
      }
    ]
  },
  {
    label: "Quy định về pin",
    leftTitle: "Quy định về pin",
    left: [
      {
        section: "Quy định chung",
        items: [
          "Để nhận pin đảm bảo, Quý khách lưu ý chỉ nhận pin từ nhân viên tại điểm đổi pin và/hoặc từ nhân viên vận hành của Gogoro khi có yêu cầu cứu hộ pin trên đường.",
          "Quý khách chỉ nhận pin hoạt động tốt, nguyên vẹn, không móp, méo, hỏng hóc, có dấu hiệu cạy mở hoặc xuất hiện các dấu hiệu bất thường trên vỏ pin."
        ]
      },
      {
        section: "Điều kiện đổi/trả pin không mất phí đền bù",
        items: [
          "Pin phải đầy đủ phụ kiện, đúng chủng loại của hãng.",
          "Pin không có chỗ nào cháy sùi có thể quan sát bằng mắt thường.",
          "Pin không có chỗ nào biến dạng, khe hở giữa các thành phần nhỏ hơn 01 mm, có thể quan sát bằng mắt thường.",
          "Pin không có chỗ nào móp, méo có thể dễ dàng quan sát bằng mắt thường.",
          "Pin không có chỗ nào có vết nứt, vỡ có thể dễ dàng quan sát bằng mắt thường.",
          "Pin không có chỗ nào rỉ, sét, ố do bị ngấm nước hoặc tiếp xúc với hóa chất.",
          "Pin không có vết xước nào có độ sâu trên 01 mm.",
          "Khách hàng tuân thủ quy định về sử dụng và bảo quản pin mà nhà cung cấp (VinFast) đã ban hành."
        ]
      }
      ,
      {
        section: "Quy định đền bù pin",
        items: [
          "Trường hợp phải đền bù (một trong các điều kiện): Khách hàng làm mất pin; khách hàng đã tháo vỏ pin hoặc các bộ phận của pin; khách hàng làm vỏ pin bị biến dạng dẫn tới pin không hoạt động; khách hàng làm mất Zplug trên phần vỏ nắp pin.",
          "Đền nguyên giá pin (khi pin bị mất hoặc hỏng nặng): 8.600.000 VNĐ / pin (Bao gồm VAT).",
          "Trường hợp vỏ pin bị biến dạng ở phần nắp, thân hoặc đế nhưng pin vẫn còn hoạt động: bồi thường theo bộ phận vỏ bị biến dạng — 770.000 VNĐ / bộ phận (Bao gồm VAT).",
          "Trường hợp pin không hoạt động do khách hàng không tuân thủ Quy định về sử dụng và bảo quản: mức đền bù tùy theo mức độ thiệt hại (đơn vị cung cấp sẽ thẩm định).",
          "Nếu vỏ pin không bị biến dạng và khách hàng đã tuân thủ Quy định về sử dụng và bảo quản nhưng pin vẫn không hoạt động khi đổi/trả hợp lệ: khách hàng không phải đền bù.",
        ]
      }
    ],
    rightTitle: "",
    rightNote: "",
    plans: []
  }
];

export function renderListGogoro(list) {
  if (!list) return null;
  // Nếu là mảng section, render section title và items
  if (Array.isArray(list) && list[0] && list[0].section) {
    return (
      <div>
        {list.map((section, idx) => (
          <div key={idx} className="gogoro-section-block">
            <div className="section-title">{section.section}</div>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{renderTextWithTerms(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  // Mặc định render như cũ
  return (
    <ul>
      {list.map((item, idx) =>
        Array.isArray(item) ? (
          <ul key={idx} className="gogoro-nested-list">{renderListGogoro(item)}</ul>
        ) : (
          <li key={idx}>{renderTextWithTerms(item)}</li>
        )
      )}
    </ul>
  );
}

export function GogoroPolicyModern({ onLoginClick, user }) {
  const [tab, setTab] = React.useState(0);
  const data = tabDataGogoro[tab];
  const isLoggedIn = !!(user && (user.fullName || user.fullname || user.name));
  return (
    <div className="gogoro-policy-modern polices-container">
      <h1>Chính sách thuê pin Gogoro</h1>
      <div className="gogoro-tabs">
        {tabDataGogoro.map((t, idx) => (
          <button
            key={t.label}
            className={"gogoro-tab" + (tab === idx ? " active" : "")}
            onClick={() => setTab(idx)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="gogoro-policy-content">
        <div className="gogoro-policy-left">
          <h2>{data.leftTitle}</h2>
          <div className="gogoro-left-list">{renderListGogoro(data.left)}</div>
        </div>
        <div className="gogoro-policy-right">
          <h2>{data.rightTitle}</h2>
          <div className="right-note">{data.rightNote}</div>
          {data.plans.map((plan, idx) => (
            <div key={plan.name} className="plan">
              <div className="plan-title">{plan.name}</div>
              <ul>
                {plan.price.map((p, i) => (
                  <li key={i}>{p.pin} Pin: {p.value.toLocaleString()} VNĐ/tháng</li>
                ))}
              </ul>
              <div className="plan-note">{plan.note}</div>
            </div>
          ))}
          {/* Only show VAT and image when NOT viewing the rental policy tab */}
          {data.label !== 'Chính sách thuê Pin' && (
            <>
              {/* Hình minh họa pin Gogoro */}
              <div className="gogoro-image-wrap">
                <img
                  src="/batterypin3-Photoroom.png"
                  alt="Gogoro battery"
                  className="gogoro-policy-image"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="gogoro-actions">
        <button
          className="btn btn--secondary"
          onClick={() => {
            /* show more details - could open modal */
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Xem chi tiết
        </button>
        <button
          className="btn btn--primary"
          onClick={() => {
            // If not logged in, save intended redirect and open login modal
            if (!isLoggedIn) {
              try {
                localStorage.setItem('redirectAfterLogin', '/dashboard/driver/booking');
              } catch (e) {}
              onLoginClick && onLoginClick();
              return;
            }
            // Already logged in — navigate to driver booking page
            // Use hash route to stay in single tab SPA
            window.location.hash = '#/dashboard/driver/booking';
          }}
        >
          Đăng ký ngay
        </button>
        <button className="btn btn--outline" onClick={() => { window.location.href = 'tel:1900232389'; }}>
          Liên hệ hỗ trợ
        </button>
      </div>
    </div>
  );
}