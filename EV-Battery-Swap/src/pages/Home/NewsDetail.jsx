import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./NewsDetail.css";

const newsData = {
  "gogoro-platform": {
    title: "Think Deeper: Gogoro Platform.",
    date: "2024-03-15",
    meta: "Press Release",
    image: "/e1.jpg",
    content: (
      <>
        <h2 className="news-subtitle">Nền tảng đổi pin thông minh cho xe điện</h2>
        <p className="news-paragraph">Gogoro Platform là giải pháp tiên phong trong lĩnh vực năng lượng di động, mang đến trải nghiệm đổi pin nhanh chóng, tiện lợi và an toàn cho người dùng xe điện. Với hệ thống trạm đổi pin phủ rộng, bạn có thể dễ dàng thay pin chỉ trong vài giây, tiếp tục hành trình mà không lo hết năng lượng.</p>
        <blockquote className="news-quote news-quote-blue">
          "Đổi pin chỉ trong 6 giây, sẵn sàng di chuyển mọi lúc mọi nơi."
        </blockquote>
        <h3 className="news-section-title">Lịch sử phát triển</h3>
        <p className="news-paragraph">Từ năm 2015, Gogoro đã phát triển hệ thống đổi pin tự động đầu tiên tại Đài Loan, nhanh chóng mở rộng ra nhiều quốc gia châu Á. Đến nay, nền tảng này đã phục vụ hàng triệu lượt đổi pin mỗi tháng.</p>
        <h3 className="news-section-title">Công nghệ đột phá</h3>
        <p className="news-paragraph">Gogoro sử dụng công nghệ pin lithium tiên tiến, tích hợp hệ thống quản lý thông minh giúp tối ưu hóa hiệu suất và tuổi thọ pin. Mỗi viên pin đều được kiểm tra nghiêm ngặt về độ an toàn trước khi đưa vào sử dụng.</p>
        <img src="/e1.jpg" alt="Gogoro Platform" className="news-img" />
        <h3 className="news-section-title">Ứng dụng thực tế</h3>
        <p className="news-paragraph">Hệ thống Gogoro đã được triển khai tại các thành phố lớn, giúp giảm ùn tắc giao thông và thúc đẩy xu hướng sử dụng xe điện thân thiện môi trường.</p>
        <h3 className="news-section-title">Nhận xét chuyên gia</h3>
        <blockquote className="news-quote">
          "Gogoro Platform là bước tiến lớn trong ngành năng lượng sạch cho giao thông đô thị."<br />
          <span className="news-quote-author">- TS. Nguyễn Văn A, chuyên gia năng lượng</span>
        </blockquote>
        <h3 className="news-section-title">Thân thiện môi trường</h3>
        <p className="news-paragraph">Việc sử dụng pin tái chế và hệ thống quản lý năng lượng thông minh giúp giảm thiểu khí thải, bảo vệ môi trường sống cho thế hệ tương lai.</p>
        <ul className="news-list">
          <li>Đổi pin nhanh chóng tại hơn 1000 trạm trên toàn quốc</li>
          <li>Hệ thống quản lý pin thông minh, bảo mật dữ liệu</li>
          <li>Tiết kiệm chi phí vận hành xe điện</li>
        </ul>
        <h3 className="news-section-title">Video demo</h3>
        <div className="news-video">
          <iframe width="100%" height="315" src="https://www.youtube.com/embed/1Qb1bQkF1zA" title="Gogoro Platform Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
        <h3 className="news-section-title">Liên hệ</h3>
        <p className="news-paragraph">Mọi thắc mắc về Gogoro Platform vui lòng liên hệ: <a href="mailto:info@gogoro.com" className="news-link">info@gogoro.com</a></p>
      </>
    )
  },
  "smartgen": {
    title: "Think Deeper: SmartGEN.",
    date: "2024-04-10",
    meta: "Press Release",
    image: "/e2.jpg",
    content: (
      <>
        <h2 className="news-subtitle">Thế hệ pin mới - Hiệu suất vượt trội</h2>
        <p className="news-paragraph">SmartGEN là dòng pin mới nhất của Gogoro, được thiết kế để mang lại hiệu suất cao, tuổi thọ dài và khả năng sạc nhanh vượt trội. Công nghệ SmartGEN giúp xe điện vận hành ổn định, tiết kiệm năng lượng và bảo vệ môi trường.</p>
        <blockquote className="news-quote news-quote-blue">
          "SmartGEN - Sức mạnh bền bỉ cho mọi hành trình."
        </blockquote>
        <h3 className="news-section-title">Lịch sử phát triển</h3>
        <p className="news-paragraph">SmartGEN được nghiên cứu và phát triển từ năm 2020, dựa trên nền tảng công nghệ pin lithium tiên tiến. Sau nhiều thử nghiệm thực tế, sản phẩm đã được thương mại hóa vào năm 2024 và nhanh chóng trở thành lựa chọn hàng đầu cho xe điện cá nhân.</p>
        <img src="/e2.jpg" alt="SmartGEN Battery" className="news-img" />
        <h3 className="news-section-title">Ứng dụng thực tế</h3>
        <p className="news-paragraph">Pin SmartGEN đã được sử dụng rộng rãi trong các dòng xe điện Gogoro, giúp người dùng di chuyển xa hơn, an toàn hơn và tiết kiệm chi phí bảo trì. Nhiều doanh nghiệp vận tải cũng đã chuyển sang sử dụng pin SmartGEN để tối ưu hóa hiệu quả hoạt động.</p>
        <h3 className="news-section-title">Nhận xét chuyên gia</h3>
        <blockquote className="news-quote">
          "SmartGEN là bước tiến lớn về công nghệ pin, mang lại sự an tâm tuyệt đối cho người dùng xe điện."<br />
          <span className="news-quote-author">- TS. Trần Bảo, chuyên gia kỹ thuật năng lượng</span>
        </blockquote>
        <h3 className="news-section-title">Tối ưu hóa trải nghiệm người dùng</h3>
        <p className="news-paragraph">Pin SmartGEN có khả năng tự động điều chỉnh hiệu suất theo điều kiện sử dụng, giúp xe luôn vận hành mượt mà và an toàn.</p>
        <ul className="news-list">
          <li>Thời gian sạc nhanh, chỉ 30 phút cho 80% dung lượng</li>
          <li>Tuổi thọ pin lên đến 5 năm</li>
          <li>Khả năng chống nước, chống sốc vượt trội</li>
        </ul>
        <h3 className="news-section-title">Video demo</h3>
        <div className="news-video">
          <iframe width="100%" height="315" src="https://www.youtube.com/embed/1Qb1bQkF1zA" title="SmartGEN Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
        <h3 className="news-section-title">Liên hệ</h3>
        <p className="news-paragraph">Mọi thắc mắc về SmartGEN vui lòng liên hệ: <a href="mailto:info@gogoro.com" className="news-link">info@gogoro.com</a></p>
      </>
    )
  },
  "iq-system": {
    title: "Think Deeper: iQ System.",
    date: "2024-05-05",
    meta: "Press Release",
    image: "/e3.jpg",
    content: (
      <>
        <h2 className="news-subtitle">Hệ thống quản lý pin thông minh</h2>
        <p className="news-paragraph">iQ System là giải pháp quản lý pin toàn diện, giúp người dùng kiểm soát trạng thái pin, lịch sử sử dụng và tối ưu hóa chi phí vận hành xe điện. Hệ thống này tích hợp AI để dự đoán tuổi thọ pin và cảnh báo khi cần thay thế.</p>
        <blockquote className="news-quote news-quote-blue">
          "iQ System - Quản lý năng lượng thông minh, an tâm trên mọi cung đường."
        </blockquote>
        <h3 className="news-section-title">Lịch sử phát triển</h3>
        <p className="news-paragraph">iQ System được phát triển từ năm 2022, dựa trên nhu cầu thực tế của người dùng xe điện về việc giám sát và bảo trì pin. Sau nhiều thử nghiệm, hệ thống đã được triển khai rộng rãi vào năm 2025.</p>
        <img src="/e3.jpg" alt="iQ System" className="news-img" />
        <h3 className="news-section-title">Ứng dụng thực tế</h3>
        <p className="news-paragraph">Nhiều hãng xe điện lớn đã tích hợp iQ System vào sản phẩm của mình, giúp khách hàng dễ dàng kiểm tra tình trạng pin, nhận cảnh báo bảo trì và tối ưu hóa chi phí vận hành.</p>
        <h3 className="news-section-title">Nhận xét chuyên gia</h3>
        <blockquote className="news-quote">
          "iQ System là giải pháp quản lý pin thông minh, giúp người dùng chủ động bảo vệ tài sản và nâng cao hiệu quả sử dụng xe điện."<br />
          <span className="news-quote-author">- KS. Lê Minh, chuyên gia công nghệ ô tô</span>
        </blockquote>
        <h3 className="news-section-title">Tính năng nổi bật</h3>
        <ul className="news-list">
          <li>Giám sát trạng thái pin theo thời gian thực</li>
          <li>Phân tích lịch sử sử dụng và dự báo tuổi thọ pin</li>
          <li>Cảnh báo thông minh khi pin cần bảo trì hoặc thay thế</li>
        </ul>
        <h3 className="news-section-title">Video demo</h3>
        <div className="news-video">
          <iframe width="100%" height="315" src="https://www.youtube.com/embed/1Qb1bQkF1zA" title="iQ System Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
        <h3 className="news-section-title">Liên hệ</h3>
        <p className="news-paragraph">Mọi thắc mắc về iQ System vui lòng liên hệ: <a href="mailto:info@gogoro.com" className="news-link">info@gogoro.com</a></p>
      </>
    )
  }
};

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const news = newsData[id] || null;

  if (!news) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <h2>Không tìm thấy tin tức</h2>
        <button style={{ marginTop: 24, padding: '10px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/')}>Quay về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="news-detail-container">
      <div style={{ width: '100%', height: 320, background: '#eee', overflow: 'hidden' }}>
        <img src={news.image} alt={news.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '32px 28px 24px 28px' }}>
        <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{news.meta}</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.2 }}>{news.title}</h1>
        <div style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>{new Date(news.date).toLocaleDateString('vi-VN')}</div>
        <div style={{ fontSize: 18, color: '#222', lineHeight: 1.7 }}>
          {news.content}
        </div>
      </div>
    </div>
  );
}
