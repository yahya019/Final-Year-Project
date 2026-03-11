import React from 'react';

const STATUS_STYLES = {
  Confirmed:  { bg: '#1A3A2A', border: '#22C55E44', color: '#4ADE80' },
  Ongoing:    { bg: '#FF4D4D22', border: '#FF4D4D44', color: '#FF6B6B' },
  Completed:  { bg: '#1A2A3A', border: '#3B82F644', color: '#60A5FA' },
  Pending:    { bg: '#2A2A1A', border: '#EAB30844', color: '#FACC15' },
  Cancelled:  { bg: '#2A1222', border: '#EF444433', color: '#F87171' },
  Active:     { bg: '#1A3A2A', border: '#22C55E44', color: '#4ADE80' },
  Inactive:   { bg: '#2A2A2A', border: '#55555544', color: '#9CA3AF' },
  Settled:    { bg: '#1A3A2A', border: '#22C55E44', color: '#4ADE80' },
  'On Hold':  { bg: '#1A2A3A', border: '#3B82F644', color: '#60A5FA' },
  Open:       { bg: '#2A1222', border: '#EF444433', color: '#F87171' },
  Resolved:   { bg: '#1A3A2A', border: '#22C55E44', color: '#4ADE80' },
  'In Review':{ bg: '#2A2A1A', border: '#EAB30844', color: '#FACC15' },
  High:       { bg: '#2A1222', border: '#EF444433', color: '#F87171' },
  Medium:     { bg: '#2A2A1A', border: '#EAB30844', color: '#FACC15' },
  Low:        { bg: '#1A3A2A', border: '#22C55E44', color: '#4ADE80' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: '#1a1a1a', border: '#ffffff20', color: '#9CA3AF' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: style.bg, border: `1px solid ${style.border}`,
      borderRadius: 999, padding: '3px 10px',
      fontSize: 11, fontWeight: 700, color: style.color,
      fontFamily: "'Syne', sans-serif", whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.color, display: 'inline-block' }} />
      {status}
    </span>
  );
}
