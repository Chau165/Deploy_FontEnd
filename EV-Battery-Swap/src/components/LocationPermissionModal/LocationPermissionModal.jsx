import React from 'react';
import './LocationPermissionModal.css';

export default function LocationPermissionModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="location-perm-backdrop">
      <div className="location-perm-card">
        <h3>Cho phép truy cập vị trí?</h3>
        <p>
          Ứng dụng sẽ yêu cầu quyền truy cập vị trí của bạn để cung cấp chỉ đường từng chặng 
          từ vị trí hiện tại. Trình duyệt sẽ hiển thị một thông báo xin quyền tiếp theo.
        </p>
        <div className="location-perm-actions">
          <button className="location-perm-cancel" onClick={onCancel}>Từ chối</button>
          <button className="location-perm-allow" onClick={onConfirm}>Cho phép</button>
        </div>
      </div>
    </div>
  );
}
