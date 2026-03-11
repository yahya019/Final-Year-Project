import React, { useState, useEffect } from 'react';
import { getCommissions, settleCommission } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// SettlementPage
// GET /Commission/List         → all commissions (joined booking + serviceman + service)
// PUT /Commission/Settle       → { id }
// settlementStatus: Pending | Settled
// ─────────────────────────────────────────────────────────────────────────────

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// ── Settle Confirm Modal ──────────────────────────────────────────────────────
function SettleModal({ item, onClose, onDone }) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSettle = async () => {
    setError(''); setSaving(true);
    try {
      const res = await settleCommission({ id: toStr(item._id) });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Commission settled successfully!');
        onDone(toStr(item._id));
        setTimeout(() => onClose(), 1200);
      } else { setError(res.data.Result); }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 460 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Settle Commission 💸</div>
          <div style={{ fontSize: 12, color: '#555A66' }}>Confirm payment to serviceman</div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Summary card */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'BOOKING NO',        value: item.booking?.bookingNumber,                        color: '#FF6B6B' },
                { label: 'WORKER',            value: item.serviceman?.fullName || '—',                   color: '#fff'    },
                { label: 'SERVICE',           value: item.service?.serviceName || '—',                   color: '#fff'    },
                { label: 'TOTAL AMOUNT',      value: `₹${Number(item.totalAmount).toLocaleString()}`,    color: '#E8EAF0' },
                { label: 'COMMISSION ('+item.commissionPercentage+'%)', value: `₹${Number(item.commissionAmount).toLocaleString()}`, color: '#F87171' },
                { label: 'WORKER EARNING',    value: `₹${Number(item.servicemanEarning).toLocaleString()}`, color: '#4ADE80' },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Big earning highlight */}
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 6 }}>AMOUNT TO PAY WORKER</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#4ADE80' }}>₹{Number(item.servicemanEarning).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#555A66', marginTop: 4 }}>via UPI: {item.serviceman?.upiId || '—'}</div>
          </div>

          {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{success}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSettle} disabled={saving}
              style={{ flex: 2, height: 46, background: saving ? '#1a1a1a' : '#22C55E', border: 'none', borderRadius: 10, color: saving ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {saving ? '⏳ Processing...' : '💸 Confirm Settlement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettlementPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [selected, setSelected]       = useState(null);

  useEffect(() => { fetchCommissions(); }, []);

  const fetchCommissions = async () => {
    setLoading(true); setError('');
    try {
      const res = await getCommissions();
      if (res.data.Status === 'OK') setCommissions(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load commissions');
    } finally { setLoading(false); }
  };

  const handleDone = (id) => {
    setCommissions(prev => prev.map(c => toStr(c._id) === id ? { ...c, settlementStatus: 'Settled', settledAt: new Date().toISOString() } : c));
  };

  // Stats
  const pending  = commissions.filter(c => c.settlementStatus === 'Pending');
  const settled  = commissions.filter(c => c.settlementStatus === 'Settled');
  const totalPendingAmt  = pending.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0);
  const totalSettledAmt  = settled.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0);
  const totalCommission  = settled.reduce((s, c) => s + Number(c.commissionAmount || 0), 0);

  const filtered = commissions.filter(c => {
    const matchSearch = !search ||
      c.booking?.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.service?.serviceName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.settlementStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Settlement 💸</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Manage commission and worker payment settlements</div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '⏳', label: 'PENDING SETTLEMENTS', value: pending.length,   sub: `₹${totalPendingAmt.toLocaleString()} to pay`, color: '#FACC15', border: 'rgba(250,204,21,0.2)', bg: 'rgba(250,204,21,0.05)' },
          { icon: '✅', label: 'SETTLED',             value: settled.length,   sub: `₹${totalSettledAmt.toLocaleString()} paid`,   color: '#4ADE80', border: 'rgba(74,222,128,0.2)',  bg: 'rgba(74,222,128,0.05)'  },
          { icon: '💰', label: 'COMMISSION EARNED',   value: `₹${totalCommission.toLocaleString()}`, sub: `from ${settled.length} bookings`, color: '#FF6B6B', border: 'rgba(255,77,77,0.2)', bg: 'rgba(255,77,77,0.05)' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D1117', border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px 24px', background: s.bg }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, opacity: 0.8 }}>{s.sub}</div>
            {s.label === 'PENDING SETTLEMENTS' && pending.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#FACC15', fontWeight: 600 }}>⚠️ Needs attention</div>
            )}
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by booking number, worker or service..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>
        <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          {[['', 'All'], ['Pending', '⏳ Pending'], ['Settled', '✅ Settled']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterStatus === val ? (val === 'Settled' ? 'rgba(74,222,128,0.15)' : val === 'Pending' ? 'rgba(250,204,21,0.15)' : '#FF4D4D') : 'transparent', color: filterStatus === val ? (val === 'Settled' ? '#4ADE80' : val === 'Pending' ? '#FACC15' : '#fff') : '#555A66', transition: 'all 0.2s' }}>
              {label} ({val === '' ? commissions.length : val === 'Pending' ? pending.length : settled.length})
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading settlements...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{filterStatus === 'Pending' ? 'No pending settlements 🎉' : 'No settlements found'}</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Booking', 'Worker', 'Service', 'Total', 'Commission', 'Worker Gets', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={toStr(c._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i + 1}</td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>
                      {c.booking?.bookingNumber || '—'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.serviceman?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.serviceman?.upiId}</div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8EAF0' }}>{c.service?.serviceName || '—'}</td>

                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#E8EAF0' }}>
                    ₹{Number(c.totalAmount).toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>₹{Number(c.commissionAmount).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#555A66' }}>{c.commissionPercentage}%</div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: '#4ADE80' }}>
                    ₹{Number(c.servicemanEarning).toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {c.settlementStatus === 'Settled' ? (
                      <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>✅ Settled</span>
                    ) : (
                      <span style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>⏳ Pending</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {c.settlementStatus === 'Pending' ? (
                      <button onClick={() => setSelected(c)}
                        style={{ height: 32, padding: '0 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, color: '#4ADE80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                        💸 Settle
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#555A66' }}>
                        {c.settledAt ? new Date(c.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{commissions.length}</strong> records</span>
            <span style={{ color: '#FACC15', fontWeight: 700 }}>
              {filterStatus === 'Pending' && pending.length > 0 && `Total to pay: ₹${totalPendingAmt.toLocaleString()}`}
            </span>
          </div>
        </div>
      )}

      {selected && (
        <SettleModal
          item={selected}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
