import React, { useEffect, useRef, useState } from "react";
import "./Battery.css";

function Battery() {
  const videoRef = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // đảm bảo video muted để browser cho autoplay
    v.muted = true;
    // playsInline cho mobile
    v.playsInline = true;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // nếu lần đầu tiên nhìn thấy >=50% thì play 1 lần
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasPlayedRef.current) {
            v.play().catch(() => {});
            hasPlayedRef.current = true;
          }
          // khi không hiển thị thì pause luôn
          if (!entry.isIntersecting) {
            v.pause();
          }
        });
      },
      { threshold: [0.5] }
    );

    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  // Scroll đến đúng project-card theo index
  const scrollToProjectCard = (idx) => {
    const el = document.getElementById(`project-card-${idx}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const absoluteY = window.scrollY + rect.top;
      const centerY = absoluteY - (window.innerHeight / 2) + (rect.height / 2);
      window.scrollTo({ top: centerY, behavior: 'smooth' });
    }
  };

  // Card component
  const IntroCard = ({ img, title, desc, onClick }) => (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <img src={img} alt={title} />
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );

  // ImageSwapper - crossfades between two images using CSS opacity transition
  const ImageSwapper = ({ srcA = '/pinswap/img-swap1.jpg', srcB = '/pinswap/img-swap2.jpg', interval = 4000, alt = '' }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
      // Preload images so crossfade is smooth
      const a = new Image();
      const b = new Image();
      a.src = srcA;
      b.src = srcB;

      const id = setInterval(() => {
        setCurrent((c) => (c === 0 ? 1 : 0));
      }, interval);

      return () => clearInterval(id);
    }, [srcA, srcB, interval]);

    return (
      <div className="card-sumary image-swapper" role="img" aria-label={alt}>
        <img className={`swap-img ${current === 0 ? 'visible' : ''}`} src={srcA} alt={alt} />
        <img className={`swap-img ${current === 1 ? 'visible' : ''}`} src={srcB} alt={alt} />
      </div>
    );
  };

  return (
    <div className="battery-page">
      {/* HERO SECTION */}

      <div className="hero" style={{ marginBottom: 40 }}>
        <img src="/img-battery.jpg" alt="Battery Swap" className="hero-image" />
        <div className="hero-content">
          <h1>EV Battery Solutions</h1>
        </div>
      </div>

      {/* Video minh họa quy trình swap pin */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#fff', margin: '40px auto 48px auto' }}>
        <video
          style={{ width: '100%', maxWidth: 1550, aspectRatio: '16/9', background: '#000', borderRadius: 0, boxShadow: 'none', display: 'block' }}
          autoPlay
          muted
          loop
          playsInline
          poster="/img-network-hero.jpg"
        >
          <source src="/video-gn-swap.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* GIỚI THIỆU VỀ GIẢI PHÁP */}
      <section className="intro-section">
        <h2>GIỚI THIỆU GIẢI PHÁP</h2>
        <div className="intro-cards">
          <IntroCard
            img="/img-battery3.jpg"
            title="Giải pháp di động thông minh"
            desc="Hệ sinh thái pin đổi nhanh giúp mọi hành trình xe điện trở nên liền mạch, không còn lo lắng về thời gian sạc. Đổi pin chỉ trong vài giây, sẵn sàng di chuyển mọi lúc, mọi nơi."
            onClick={() => scrollToProjectCard(1)}
          />
          <IntroCard
            img="/img-battery4.jpg"
            title="Trạm lưu trữ & đổi pin tự động"
            desc="Trạm đổi pin tự động hiện đại, lưu trữ năng lượng an toàn, tối ưu hóa vận hành và tiết kiệm chi phí. Đáp ứng tiêu chuẩn quốc tế, thân thiện với môi trường."
            onClick={() => scrollToProjectCard(2)}
          />
          <IntroCard
            img="/img-battery2.jpg"
            title="Công nghệ & thiết kế vượt trội"
            desc="Pin và trạm được thiết kế tối ưu: bền bỉ, thẩm mỹ, dễ sử dụng, tích hợp công nghệ AI và IoT cho trải nghiệm thông minh, an toàn vượt trội."
            onClick={() => scrollToProjectCard(3)}
          />
        </div>
      </section>


      {/* PROJECT SECTION - BỐ CỤC ẢNH 50% - TEXT 50% */}
  <section className="project-section-single" id="project-section-single">
        <h2>NỀN TẢNG NĂNG LƯỢNG TIÊN TIẾN NHẤT CHO XE ĐIỆN</h2>

        <div className="project-card-gogoro">
          {/* THẺ DỰ ÁN 1: ẢNH TRÁI - TEXT PHẢI (Giống Gogoro Smart Batteries) */}
          <div className="card-item" id="project-card-1">
            <div className="card-image-wrapper">
              <img src="img-network-feature-1.jpg" alt="Smart Battery Swapping" />
            </div>
            <div className="card-text-content">
              <h4>Pin thông minh - Đổi pin siêu tốc</h4>
              <h3>Chỉ vài giây, tiếp năng lượng cho hành trình mới.</h3>
              <p>Không còn chờ đợi sạc. Đổi pin nhanh, sạch, tiện lợi. Công nghệ pin hiện đại giúp bạn luôn sẵn sàng di chuyển, tiết kiệm thời gian và bảo vệ môi trường.</p>
            </div>
          </div>

          {/* THẺ DỰ ÁN 2: ẢNH TRÁI - TEXT PHẢI */}
          <div className="card-item" id="project-card-2">
            <div className="card-image-wrapper">
              <img src="/img-network-feature-2.jpg" alt="Energy Storage Application" />
            </div>
            <div className="card-text-content">
              <h4>Trạm đổi pin tự động</h4>
              <h3>Tiết kiệm thời gian, tối ưu chi phí.</h3>
              <p>Trạm đổi pin thông minh vận hành 24/7, lưu trữ năng lượng an toàn, hỗ trợ nhiều loại xe điện. Đảm bảo nguồn pin luôn sẵn sàng, giảm thiểu chi phí bảo trì và vận hành.</p>
            </div>
          </div>

          {/* THẺ DỰ ÁN 3: ẢNH TRÁI - TEXT PHẢI */}
          <div className="card-item" id="project-card-3">
            <div className="card-image-wrapper">
              <img src="/img-network-feature-3.jpg" alt="Design and Technology" />
            </div>
            <div className="card-text-content">
              <h4>Ứng dụng quản lý & kết nối</h4>
              <h3>Kiểm soát pin, hành trình và thanh toán chỉ với một chạm.</h3>
              <p>Kết nối hệ sinh thái pin đổi nhanh, tra cứu trạm gần nhất, quản lý lịch sử sử dụng, thanh toán không tiền mặt, nhận thông báo bảo trì và hỗ trợ 24/7. Trải nghiệm di chuyển thông minh, an toàn, tiện lợi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TẠI SAO CHỌN GIẢI PHÁP CỦA CHÚNG TÔI */}
      <section className="intro-section">
        <h2>VÌ SAO LỰA CHỌN GIẢI PHÁP CỦA CHÚNG TÔI</h2>
        <div className="intro-cards-sumary">
          <ImageSwapper srcA="/pinswap/img-swap1.jpg" srcB="/pinswap/img-swap2.jpg" interval={2000} alt="Pin cho xe điện" />

          <div className="sumary-text-chung">
            <div className="sumary-text-1">
              <h3 className="text">SỰ TIỆN LỢI</h3>
              <p>
Các điểm đổi pin EV sử dụng ít diện tích hơn so với chỗ đỗ xe và lắp đặt nhanh chóng, dễ dàng tại nhiều địa điểm khác nhau. Chỉ cần một điểm đổi pin, bạn có thể phục vụ hàng trăm lượt đổi pin mỗi ngày mà không cần chờ đợi.              </p>
            </div>

            <div className="sumary-text-1">
              <h3 className="text">DỄ VẬN HÀNH</h3>
              <p>
Chống chịu thời tiết. Chống phá hoại. Ít bảo trì. Giám sát 24 giờ, cập nhật từ xa và các biện pháp an toàn tự động mang lại thời gian hoạt động 99%.              </p>
            </div>

            <div className="sumary-text-1">
              <h3 className="text">XÂY DỰNG ĐỂ TRƯỜNG TỒN</h3>
              <p>
Thiết kế chắc chắn, công nghệ tiên tiến và cập nhật liên tục. Được thiết kế để đảm bảo độ tin cậy trong những môi trường đô thị khắc nghiệt nhất. Thay thế liên tục, năm này qua năm khác.              </p>
            </div>
          </div>
        </div>
      </section>

      
      {/* VIDEO SECTION: play/pause on scroll */}
      <section className="video-section video-hero">
        <video
          ref={videoRef}
          src="/video-gn-think-ahead.mp4"
          poster="/img-network-hero.jpg"
          // muted và playsInline đã set trong useEffect
          // không để controls để giống hero
          className="video-cover"
        />
        <div className="video-overlay">
          <div className="eyebrow">SMART &amp; CONNECTED</div>
          <h2 className="video-title">Thinking ahead.</h2>
          <p className="video-desc">
SmartGEN là trung tâm thần kinh kết nối đám mây của chúng tôi. Trí tuệ nhân tạo (AI) của nó liên tục học hỏi từ các kiểu lái xe và hành vi thay đổi để dự đoán thời điểm và địa điểm cần pin đầy. Bằng cách phân phối năng lượng thông minh, chúng tôi giúp hàng trăm nghìn người lái xe di chuyển nhanh chóng trên đường đi.          </p>
        </div>
      </section>


    </div>
  );
}

export default Battery;