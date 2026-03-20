import React, { useState, useEffect } from 'react';
import { getAllReviews, getComplaints, updateComplaintStatus } from '../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const COMPLAINT_STATUS = {
  Open:       { color: '#F87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '🔴' },
  InProgress: { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)', icon: '🟠' },
  Resolved:   { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', icon: '🟢' },
};

// ── Star Display ──────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#FACC15' : '#2A2D35' }}>★</span>
      ))}
    </div>
  );
}

// ── Review Detail Modal ───────────────────────────────────────────────────────
function ReviewModal({ review, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 460 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Review Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '20px 28px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{review.rating}.0</div>
            <StarDisplay rating={review.rating} size={24} />
          </div>
          {review.review && (
            <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14, color: '#E8EAF0', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{review.review}"
            </div>
          )}
          {[
            { icon: '👤', label: 'CUSTOMER',  value: review.customer?.fullName || '—', sub: review.customer?.contactNumber },
            { icon: '🔧', label: 'WORKER',    value: review.serviceman?.fullName || '—', sub: review.serviceman?.city },
            { icon: '🛠️', label: 'SERVICE',   value: review.service?.serviceName || '—' },
            { icon: '📅', label: 'REVIEWED',  value: review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 15 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: '#E8EAF0', fontWeight: 600 }}>{r.value}</div>
                {r.sub && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Complaint Action Modal ────────────────────────────────────────────────────
function ComplaintModal({ complaint, onClose, onDone }) {
  const [status, setStatus]   = useState(complaint.status);
  const [remark, setRemark]   = useState(complaint.adminRemark || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState('');

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (status === 'Resolved' && !remark.trim()) { setError('Please add a remark when resolving'); return; }
    setSaving(true);
    try {
      const res = await updateComplaintStatus({ id: toStr(complaint._id), status, adminRemark: remark.trim() || null });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Complaint updated!');
        onDone(toStr(complaint._id), status, remark);
        setTimeout(() => onClose(), 1200);
      } else { setError(res.data.Result); }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const c = COMPLAINT_STATUS[complaint.status];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 480 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Complaint Details</div>
            <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: c.color }}>{c.icon} {complaint.status}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Info */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 4 }}>CUSTOMER</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{complaint.customer?.fullName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 4 }}>WORKER</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{complaint.serviceman?.fullName || '—'}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 6 }}>COMPLAINT MESSAGE</div>
            <div style={{ fontSize: 13, color: '#E8EAF0', lineHeight: 1.6, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 12px' }}>
              {complaint.message}
            </div>
            {complaint.adminRemark && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 4 }}>PREVIOUS REMARK</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>{complaint.adminRemark}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#555A66', marginTop: 10 }}>
              📅 {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>

          {/* Status buttons */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 10 }}>UPDATE STATUS</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Object.entries(COMPLAINT_STATUS).map(([s, cfg]) => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ flex: 1, height: 40, borderRadius: 8, border: `1.5px solid ${status === s ? cfg.border : 'rgba(255,255,255,0.08)'}`, background: status === s ? cfg.bg : 'transparent', color: status === s ? cfg.color : '#555A66', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", transition: 'all 0.2s' }}>
                {cfg.icon} {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 8 }}>
            ADMIN REMARK {status === 'Resolved' ? '*' : '(optional)'}
          </div>
          <textarea
            placeholder={status === 'Resolved' ? 'Resolution details (required)...' : 'Add a note...'}
            value={remark} onChange={e => setRemark(e.target.value)}
            onFocus={() => setFocused('remark')} onBlur={() => setFocused('')}
            style={{ width: '100%', background: '#0a0d12', border: `1.5px solid ${focused === 'remark' ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 12px', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box', marginBottom: 16 }}
          />

          {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{success}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 44, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, height: 44, background: saving ? '#1a1a1a' : '#FF4D4D', border: 'none', borderRadius: 10, color: saving ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Saving...' : '💾 Update Complaint'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [selected, setSelected]         = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllReviews();
      if (res.data.Status === 'OK') setReviews(res.data.Result);
      else setError(res.data.Result);
    } catch (err) { setError('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const fiveStar  = reviews.filter(r => r.rating === 5).length;
  const lowRating = reviews.filter(r => r.rating <= 2).length;
  const ratingCounts = [5,4,3,2,1].map(r => ({ r, count: reviews.filter(x => x.rating === r).length }));

  const filtered = reviews.filter(r => {
    const matchSearch = !search ||
      r.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.service?.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      r.review?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!filterRating || r.rating === Number(filterRating));
  });

  return (
    <>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#0D1117', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{avgRating}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>AVERAGE RATING</div>
          <StarDisplay rating={Math.round(avgRating)} size={14} />
        </div>
        <div style={{ background: '#0D1117', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌟</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#4ADE80', marginBottom: 4 }}>{fiveStar}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>5 STAR REVIEWS</div>
          <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>{reviews.length ? Math.round(fiveStar/reviews.length*100) : 0}% of total</div>
        </div>
        <div style={{ background: '#0D1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#F87171', marginBottom: 4 }}>{lowRating}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>LOW RATINGS (≤2)</div>
          <div style={{ fontSize: 11, color: lowRating > 0 ? '#F87171' : '#4ADE80', marginTop: 4 }}>{lowRating > 0 ? '⚠️ Needs attention' : '✅ All good'}</div>
        </div>
      </div>

      {/* Rating breakdown */}
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 16 }}>RATING BREAKDOWN</div>
        {ratingCounts.map(({ r, count }) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 2, width: 80 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r ? '#FACC15' : '#2A2D35' }}>★</span>)}
            </div>
            <div style={{ flex: 1, height: 8, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${reviews.length ? (count/reviews.length*100) : 0}%`, background: r >= 4 ? '#4ADE80' : r === 3 ? '#FACC15' : '#F87171', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', width: 24, textAlign: 'right' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <button onClick={() => setFilterRating('')} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !filterRating ? '#FF4D4D' : 'transparent', color: !filterRating ? '#fff' : '#555A66' }}>All</button>
          {[5,4,3,2,1].map(r => (
            <button key={r} onClick={() => setFilterRating(filterRating === String(r) ? '' : String(r))}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterRating === String(r) ? 'rgba(250,204,21,0.15)' : 'transparent', color: filterRating === String(r) ? '#FACC15' : '#555A66' }}>
              {r}★
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading reviews...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No reviews found</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#','Customer','Worker','Service','Rating','Review','Date','Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={toStr(r._id)} style={{ borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelected(r)}>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i+1}</td>
                  <td style={{ padding: '14px 16px' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.customer?.fullName || '—'}</div></td>
                  <td style={{ padding: '14px 16px' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.serviceman?.fullName || '—'}</div></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8EAF0' }}>{r.service?.serviceName || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: r.rating >= 4 ? '#FACC15' : r.rating === 3 ? '#FB923C' : '#F87171' }}>{r.rating}</span>
                      <StarDisplay rating={r.rating} size={12} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 160 }}>
                    {r.review ? <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>"{r.review.length > 35 ? r.review.slice(0,35)+'...' : r.review}"</span> : <span style={{ color: '#333' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 11, color: '#555A66' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(r)} style={{ height: 32, padding: '0 14px', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 8, color: '#FACC15', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>👁️ View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66' }}>
            Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{reviews.length}</strong> reviews
          </div>
        </div>
      )}
      {selected && <ReviewModal review={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── Complaints Tab ────────────────────────────────────────────────────────────
function ComplaintsTab() {
  const [complaints, setComplaints]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('Open');
  const [selected, setSelected]         = useState(null);

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    setLoading(true); setError('');
    try {
      const res = await getComplaints();
      if (res.data.Status === 'OK') setComplaints(res.data.Result);
      else setError(res.data.Result);
    } catch (err) { setError('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  const handleDone = (id, newStatus, remark) => {
    setComplaints(prev => prev.map(c => toStr(c._id) === id ? { ...c, status: newStatus, adminRemark: remark } : c));
  };

  const counts = complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});

  const filtered = complaints.filter(c => {
    const matchSearch = !search ||
      c.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.message?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!filterStatus || c.status === filterStatus);
  });

  return (
    <>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {Object.entries(COMPLAINT_STATUS).map(([status, cfg]) => (
          <div key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            style={{ background: filterStatus === status ? cfg.bg : '#0D1117', border: `1px solid ${filterStatus === status ? cfg.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{cfg.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: cfg.color, marginBottom: 4 }}>{counts[status] || 0}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>{status.toUpperCase()} COMPLAINTS</div>
            {status === 'Open' && (counts['Open'] || 0) > 0 && <div style={{ marginTop: 6, fontSize: 11, color: '#F87171', fontWeight: 600 }}>⚠️ Needs attention</div>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by customer, worker or message..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <button onClick={() => setFilterStatus('')} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !filterStatus ? '#FF4D4D' : 'transparent', color: !filterStatus ? '#fff' : '#555A66' }}>All ({complaints.length})</button>
          {Object.entries(COMPLAINT_STATUS).map(([s, cfg]) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterStatus === s ? cfg.bg : 'transparent', color: filterStatus === s ? cfg.color : '#555A66' }}>
              {cfg.icon} {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading complaints...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{filterStatus === 'Open' ? 'No open complaints — all clear! 🎉' : 'No complaints found'}</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#','Customer','Worker','Message','Status','Remark','Date','Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cfg = COMPLAINT_STATUS[c.status] || COMPLAINT_STATUS.Open;
                return (
                  <tr key={toStr(c._id)} style={{ borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelected(c)}>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i+1}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.customer?.fullName || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.serviceman?.fullName || '—'}</td>
                    <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{c.message?.length > 40 ? c.message.slice(0,40)+'...' : c.message}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.icon} {c.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: 140 }}>
                      {c.adminRemark ? <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>{c.adminRemark.length > 25 ? c.adminRemark.slice(0,25)+'...' : c.adminRemark}</span> : <span style={{ color: '#333' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: '#555A66', whiteSpace: 'nowrap' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelected(c)} style={{ height: 32, padding: '0 14px', background: c.status === 'Open' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.status === 'Open' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: c.status === 'Open' ? '#F87171' : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                        {c.status === 'Open' ? '🔴 Handle' : '✏️ Update'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66' }}>
            Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{complaints.length}</strong> complaints
          </div>
        </div>
      )}
      {selected && <ComplaintModal complaint={selected} onClose={() => setSelected(null)} onDone={handleDone} />}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('reviews');

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Reviews & Complaints ⭐</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Customer feedback and complaint management</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['reviews', '⭐ Reviews'], ['complaints', '🔴 Complaints']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, background: activeTab === tab ? '#FF4D4D' : 'transparent', color: activeTab === tab ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' ? <ReviewsTab /> : <ComplaintsTab />}
    </div>
  );
}
