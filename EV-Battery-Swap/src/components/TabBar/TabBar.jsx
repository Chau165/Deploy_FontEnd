import React from 'react';
import './TabBar.css';

/**
 * TabBar component
 * @param {Array} tabs - [{ label: string, value: string }]
 * @param {string} active - value của tab đang chọn
 * @param {function} onChange - callback khi đổi tab
 */
// TabBar hỗ trợ badge: mỗi tab có thể có { label, value, badge }
export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tabbar-wrap">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`tabbar-tab${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.badge ? <span className="tabbar-badge">{tab.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}
