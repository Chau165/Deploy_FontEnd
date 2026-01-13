import React, { useEffect, useState } from "react";
import API_BASE_URL from "../../../../config";
import "./ViewComment.css";

export default function ViewComment() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken") || "";

        const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/viewComments`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setComments(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        setError(e.message || "Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="vc-loading">Đang tải dữ liệu…</div>;
  if (error)   return <div className="vc-error">Lỗi tải: {error}</div>;

  return (
    <div className="view-comment-page">
      <div className="vc-container">
        <h2 className="vc-title">📋 Danh sách nhận xét của trạm</h2>

        {comments.length === 0 ? (
          <div className="vc-empty">Chưa có nhận xét nào được ghi nhận.</div>
        ) : (
          <div className="vc-scroll">
            <table className="vc-table">
              <thead>
                <tr>
                  <th>Mã Comment</th>
                  <th>Tên người lái</th>
                  <th>Nội dung</th>
                  <th>Thời gian</th>
                  <th>Mã Giao dịch</th>
                  <th>Trạng thái</th>
                  <th>Thời gian đổi</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.commentId}>
                    <td>{c.commentId}</td>
                    <td>{c.driverName}</td>
                    <td className="vc-content" title={c.content}>{c.content}</td>
                    <td>{new Date(c.timePost).toLocaleString("vi-VN")}</td>
                    <td>{c.swapId}</td>
                    <td>
                      <span className={`vc-status ${
                        (c.swapStatus || "").toLowerCase() === "completed" ? "ok" : "warn"
                      }`}>
                        {c.swapStatus}
                      </span>
                    </td>
                    <td>{new Date(c.swapTime).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
