import React from 'react';

export default function StatCard({ icon, label, value, sub, color = '#FF4D4D', trend }) {
  return (
    <div style={{
      background: '#0D1117', border: '1px solid rgba(255,77,77,0.12)',
      borderRadius: 14, padding: '20px 22px', flex: 1,
      fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 8 }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: '#555A66', marginTop: 5 }}>{sub}</div>
          )}
          {trend && (
            <div style={{ fontSize: 11, marginTop: 5, color: trend > 0 ? '#4ADE80' : '#F87171', fontWeight: 600 }}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div style={{
          width: 46, height: 46, background: `${color}18`,
          border: `1px solid ${color}33`, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
