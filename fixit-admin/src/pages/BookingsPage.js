import React, { useState, useEffect } from 'react';
import { getAllBookings, updateBookingStatus } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// BookingsPage
// GET /Booking/List       → all bookings (joined customer + serviceman + service)
// PUT /Booking/UpdateStatus → { bookingId, bookingStatus }
// Status: Pending | Confirmed | InProgress | Completed | Cancelled
// ─────────────────────────────────────────────────────────────────────────────

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS_CFG = {
  Pending:    { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)',  icon: '⏳' },
  Confirmed:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)',  icon: '✅' },
  InProgress: { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)',  icon: '🔧' },
  Completed:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)',  icon: '🎉' },
  Cancelled:  { color: '#F87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '❌' },
};

const ALL_STATUSES = ['Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'];

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: c.color, whiteSpace: 'nowrap' }}>
      {c.icon} {status}
    </span>
  );
}

// ── Detail + Status Modal ─────────────────────────────────────────────────────
function BookingModal({ booking, onClose, onStatusChange }) {
  const [status, setStatus]   = useState(booking.bookingStatus);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (status === booking.bookingStatus) { onClose(); return; }
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const res = await updateBookingStatus({ bookingId: toStr(booking._id), bookingStatus: status });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Status updated successfully!');
        onStatusChange(toStr(booking._id), status);
        setTimeout(() => onClose(), 1200);
      } else { setError(res.data.Result); }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const Row = ({ icon, label, value, mono, highlight }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, color: highlight || '#E8EAF0', fontFamily: mono ? "'JetBrains Mono',monospace" : "'Syne',sans-serif", wordBreak: 'break-all' }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 520, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Booking Details</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#FF6B6B', fontWeight: 700 }}>{booking.bookingNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={booking.bookingStatus} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '8px 28px 24px' }}>
          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
            {/* Customer */}
            <div style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA', letterSpacing: 1, marginBottom: 8 }}>👤 CUSTOMER</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{booking.customer?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{booking.customer?.contactNumber}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{booking.customer?.email || ''}</div>
            </div>
            {/* Serviceman */}
            <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', letterSpacing: 1, marginBottom: 8 }}>🔧 WORKER</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{booking.serviceman?.fullName || '—'}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{booking.serviceman?.contactNumber}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{booking.serviceman?.city || ''}</div>
            </div>
          </div>

          <Row icon="🛠️" label="SERVICE"        value={booking.service?.serviceName} />
          <Row icon="📍" label="ADDRESS"         value={booking.address} />
          <Row icon="👤" label="CONTACT PERSON"  value={`${booking.contactPerson} — ${booking.contactNumber}`} />
          <Row icon="📅" label="BOOKING DATE"    value={booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
          <Row icon="💰" label="TOTAL AMOUNT"    value={`₹${Number(booking.totalAmount).toLocaleString()}`} highlight="#4ADE80" />
          {booking.surgeCharges > 0 && <Row icon="⚡" label="SURGE CHARGES" value={`₹${Number(booking.surgeCharges).toLocaleString()}`} highlight="#FB923C" />}
          <Row icon="💳" label="PAYMENT"         value={`${booking.paymentMode} — ${booking.paymentStatus}`} />
          <Row icon="🕐" label="BOOKED ON"       value={booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : '—'} mono />

          {/* Status change */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 10 }}>UPDATE STATUS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ALL_STATUSES.map(s => {
                const c = STATUS_CFG[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${status === s ? c.border : 'rgba(255,255,255,0.08)'}`, background: status === s ? c.bg : 'transparent', color: status === s ? c.color : '#555A66', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", transition: 'all 0.2s' }}>
                    {c.icon} {s}
                  </button>
                );
              })}
            </div>

            {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{success}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose}
                style={{ flex: 1, height: 44, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, height: 44, background: saving ? '#1a1a1a' : status === booking.bookingStatus ? 'rgba(255,255,255,0.05)' : '#FF4D4D', border: 'none', borderRadius: 10, color: saving ? '#555A66' : status === booking.bookingStatus ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {saving ? '⏳ Saving...' : status === booking.bookingStatus ? 'No Changes' : `Update to ${status}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected]       = useState(null);
  const [sortBy, setSortBy]           = useState('newest');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllBookings();
      if (res.data.Status === 'OK') setBookings(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load bookings');
    } finally { setLoading(false); }
  };

  const handleStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => toStr(b._id) === id ? { ...b, bookingStatus: newStatus } : b));
    setSelected(prev => prev ? { ...prev, bookingStatus: newStatus } : null);
  };

  // Counts
  const counts = bookings.reduce((acc, b) => { acc[b.bookingStatus] = (acc[b.bookingStatus] || 0) + 1; return acc; }, {});
  const totalRevenue = bookings.filter(b => b.bookingStatus === 'Completed').reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  // Filter + sort
  const filtered = bookings
    .filter(b => {
      const matchSearch = !search ||
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.service?.serviceName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || b.bookingStatus === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount') return Number(b.totalAmount) - Number(a.totalAmount);
      return 0;
    });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Bookings 📋</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Monitor and manage all service bookings</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#0D1117', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#60A5FA', marginBottom: 4 }}>{bookings.length}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>TOTAL BOOKINGS</div>
        </div>
        <div style={{ background: '#0D1117', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#4ADE80', marginBottom: 4 }}>₹{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>COMPLETED REVENUE</div>
        </div>
        <div style={{ background: '#0D1117', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{counts['Pending'] || 0}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>PENDING BOOKINGS</div>
          {(counts['Pending'] || 0) > 0 && <div style={{ marginTop: 8, fontSize: 11, color: '#FACC15', fontWeight: 600 }}>⚠️ Needs attention</div>}
        </div>
      </div>

      {/* ── STATUS MINI CARDS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterStatus('')}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${!filterStatus ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.08)'}`, background: !filterStatus ? 'rgba(255,77,77,0.1)' : 'transparent', color: !filterStatus ? '#FF6B6B' : '#555A66', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
          All ({bookings.length})
        </button>
        {ALL_STATUSES.map(s => {
          const c = STATUS_CFG[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${filterStatus === s ? c.border : 'rgba(255,255,255,0.08)'}`, background: filterStatus === s ? c.bg : 'transparent', color: filterStatus === s ? c.color : '#555A66', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
              {c.icon} {s} ({counts[s] || 0})
            </button>
          );
        })}
      </div>

      {/* ── SEARCH + SORT ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by booking number, customer, worker or service..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, display: 'flex', alignItems: 'center' }}>
          <select style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' }}
            value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest" style={{ background: '#0D1117' }}>🕐 Newest First</option>
            <option value="oldest" style={{ background: '#0D1117' }}>🕐 Oldest First</option>
            <option value="amount" style={{ background: '#0D1117' }}>💰 Highest Amount</option>
          </select>
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{search || filterStatus ? 'No bookings match your filter' : 'No bookings yet'}</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Booking No', 'Customer', 'Worker', 'Service', 'Amount', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={toStr(b._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelected(b)}>

                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i + 1}</td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>{b.bookingNumber}</span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.customer?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{b.customer?.contactNumber}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.serviceman?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{b.serviceman?.city}</div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8EAF0' }}>{b.service?.serviceName || '—'}</td>

                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#4ADE80', whiteSpace: 'nowrap' }}>
                    ₹{Number(b.totalAmount).toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 11, color: '#555A66', whiteSpace: 'nowrap' }}>
                    {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  <td style={{ padding: '14px 16px' }}><StatusBadge status={b.bookingStatus} /></td>

                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(b)}
                      style={{ height: 32, padding: '0 14px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 8, color: '#FF6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{bookings.length}</strong> bookings</span>
            <span>Click any row to view details</span>
          </div>
        </div>
      )}

      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
