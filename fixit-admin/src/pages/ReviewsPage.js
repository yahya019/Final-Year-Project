import React, { useState, useEffect } from 'react';
import { getAllReviews } from '../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

function StarDisplay({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#FACC15' : '#2A2D35' }}>★</span>
      ))}
    </div>
  );
}

function ReviewModal({ review, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 460 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Review Details</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Rating big display */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FACC15', marginBottom: 4 }}>{review.rating}.0</div>
            <StarDisplay rating={review.rating} size={24} />
          </div>

          {/* Review text */}
          {review.review && (
            <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14, color: '#E8EAF0', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{review.review}"
            </div>
          )}

          {/* Info rows */}
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

export default function ReviewsPage() {
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [selected, setSelected]       = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllReviews();
      if (res.data.Status === 'OK') setReviews(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load reviews');
    } finally { setLoading(false); }
  };

  // Stats
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
    const matchRating = !filterRating || r.rating === Number(filterRating);
    return matchSearch && matchRating;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Reviews ⭐</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Customer feedback and ratings for services</div>
      </div>

      {/* STAT CARDS */}
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
          <div style={{ fontSize: 11, color: lowRating > 0 ? '#F87171' : '#555A66', marginTop: 4 }}>
            {lowRating > 0 ? '⚠️ Needs attention' : '✅ All good'}
          </div>
        </div>
      </div>

      {/* RATING BREAKDOWN */}
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 16 }}>RATING BREAKDOWN</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ratingCounts.map(({ r, count }) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 2, width: 80, flexShrink: 0 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r ? '#FACC15' : '#2A2D35' }}>★</span>)}
              </div>
              <div style={{ flex: 1, height: 8, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${reviews.length ? (count/reviews.length*100) : 0}%`, background: r >= 4 ? '#4ADE80' : r === 3 ? '#FACC15' : '#F87171', borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', width: 30, textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1, minWidth: 220 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by customer, worker, service or review text..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>
        {/* Star filter */}
        <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <button onClick={() => setFilterRating('')}
            style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !filterRating ? '#FF4D4D' : 'transparent', color: !filterRating ? '#fff' : '#555A66' }}>
            All
          </button>
          {[5,4,3,2,1].map(r => (
            <button key={r} onClick={() => setFilterRating(filterRating === String(r) ? '' : String(r))}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterRating === String(r) ? 'rgba(250,204,21,0.15)' : 'transparent', color: filterRating === String(r) ? '#FACC15' : '#555A66' }}>
              {r}★
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{search || filterRating ? 'No reviews match your filter' : 'No reviews yet'}</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Customer', 'Worker', 'Service', 'Rating', 'Review', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={toStr(r._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelected(r)}>

                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i + 1}</td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.customer?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.customer?.contactNumber}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.serviceman?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.serviceman?.city}</div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8EAF0' }}>{r.service?.serviceName || '—'}</td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: r.rating >= 4 ? '#FACC15' : r.rating === 3 ? '#FB923C' : '#F87171' }}>{r.rating}</span>
                      <StarDisplay rating={r.rating} size={12} />
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                    {r.review ? (
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                        "{r.review.length > 35 ? r.review.slice(0, 35) + '...' : r.review}"
                      </span>
                    ) : <span style={{ color: '#333' }}>—</span>}
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 11, color: '#555A66', whiteSpace: 'nowrap' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(r)}
                      style={{ height: 32, padding: '0 14px', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 8, color: '#FACC15', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{reviews.length}</strong> reviews</span>
            <span>Click any row to view details</span>
          </div>
        </div>
      )}

      {selected && <ReviewModal review={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
