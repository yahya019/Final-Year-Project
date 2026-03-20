import React, { useState, useEffect } from 'react';
import { getCommissions, settleCommission } from '../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// ── Settle Modal ──────────────────────────────────────────────────────────────
function SettleModal({ item, onClose, onDone }) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSettle = async () => {
    setError(''); setSaving(true);
    try {
      const res = await settleCommission({ id: toStr(item._id) });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Commission settled!');
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
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Settle Commission 💸</div>
          <div style={{ fontSize: 12, color: '#555A66' }}>Confirm payment to serviceman</div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'BOOKING NO',   value: item.booking?.bookingNumber,                           color: '#FF6B6B' },
                { label: 'WORKER',       value: item.serviceman?.fullName || '—',                      color: '#fff'    },
                { label: 'SERVICE',      value: item.service?.serviceName || '—',                      color: '#fff'    },
                { label: 'TOTAL AMOUNT', value: `₹${Number(item.totalAmount).toLocaleString()}`,       color: '#E8EAF0' },
                { label: `COMMISSION (${item.commissionPercentage}%)`, value: `₹${Number(item.commissionAmount).toLocaleString()}`, color: '#F87171' },
                { label: 'WORKER EARNING', value: `₹${Number(item.servicemanEarning).toLocaleString()}`, color: '#4ADE80' },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 6 }}>AMOUNT TO PAY WORKER</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#4ADE80' }}>₹{Number(item.servicemanEarning).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#555A66', marginTop: 4 }}>via UPI: {item.serviceman?.upiId || '—'}</div>
          </div>
          {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, marginBottom: 14 }}>{success}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSettle} disabled={saving}
              style={{ flex: 2, height: 46, background: saving ? '#1a1a1a' : '#22C55E', border: 'none', borderRadius: 10, color: saving ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Processing...' : '💸 Confirm Settlement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['overview', 'transactions', 'workers'];

export default function SettlementPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState('overview');
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
    } catch (err) { setError('Failed to load settlements'); }
    finally { setLoading(false); }
  };

  const handleDone = (id) => {
    setCommissions(prev => prev.map(c =>
      toStr(c._id) === id ? { ...c, settlementStatus: 'Settled', settledAt: new Date().toISOString() } : c
    ));
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pending = commissions.filter(c => c.settlementStatus === 'Pending');
  const settled = commissions.filter(c => c.settlementStatus === 'Settled');

  const totalRevenue      = Math.round(commissions.reduce((s, c) => s + Number(c.totalAmount || 0), 0));
  const totalCommission   = Math.round(commissions.reduce((s, c) => s + Number(c.commissionAmount || 0), 0));
  const totalWorkerEarned = Math.round(commissions.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));
  const pendingPayout     = Math.round(pending.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));
  const settledPayout     = settled.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0);
  const myCommissionEarned = Math.round(settled.reduce((s, c) => s + Number(c.commissionAmount || 0), 0));

  // ── Worker summary ─────────────────────────────────────────────────────────
  const workerSummary = (() => {
    const map = {};
    commissions.forEach(c => {
      const id  = toStr(c.serviceman?._id) || toStr(c.booking?.servicemanId) || 'unknown';
      const name = c.serviceman?.fullName || '—';
      const upi  = c.serviceman?.upiId || '—';
      if (!map[id]) map[id] = { id, name, upi, totalCharged: 0, totalEarned: 0, myCommission: 0, pendingPayout: 0 };
      map[id].totalCharged  += Math.round(Number(c.totalAmount || 0));
      map[id].totalEarned   += Math.round(Number(c.servicemanEarning || 0));
      map[id].myCommission  += Math.round(Number(c.commissionAmount || 0));
      if (c.settlementStatus === 'Pending') map[id].pendingPayout += Math.round(Number(c.servicemanEarning || 0));
    });
    return Object.values(map).sort((a, b) => b.totalCharged - a.totalCharged);
  })();

  // ── Filtered transactions ──────────────────────────────────────────────────
  const filtered = commissions.filter(c => {
    const matchSearch = !search ||
      c.booking?.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.service?.serviceName?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!filterStatus || c.settlementStatus === filterStatus);
  });

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#555A66', fontFamily: "'Syne',sans-serif" }}>Loading settlements...</div>;

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Settlement 💸</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Commission tracking and worker payment management</div>
      </div>

      {/* ── TOP 4 STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '💰', label: 'TOTAL SERVICE REVENUE', value: `₹${totalRevenue.toLocaleString()}`,      sub: `${commissions.length} bookings`, color: '#60A5FA', border: 'rgba(96,165,250,0.2)'  },
          { icon: '🏦', label: 'MY COMMISSION',          value: `₹${myCommissionEarned.toLocaleString()}`, sub: `from ${settled.length} settled`, color: '#FF6B6B', border: 'rgba(255,77,77,0.2)'   },
          { icon: '🔧', label: 'WORKER EARNINGS',        value: `₹${totalWorkerEarned.toLocaleString()}`, sub: 'total across all workers',       color: '#4ADE80', border: 'rgba(74,222,128,0.2)'  },
          { icon: '⏳', label: 'PENDING PAYOUT',         value: `₹${pendingPayout.toLocaleString()}`,     sub: `${pending.length} unsettled`,    color: '#FACC15', border: 'rgba(250,204,21,0.2)',  warn: pending.length > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, opacity: 0.7 }}>{s.sub}</div>
            {s.warn && <div style={{ marginTop: 6, fontSize: 11, color: '#FACC15', fontWeight: 700 }}>⚠️ Needs attention</div>}
          </div>
        ))}
      </div>

      {/* ── REVENUE BREAKDOWN ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 16 }}>REVENUE BREAKDOWN</div>
        <div style={{ display: 'flex', gap: 0, height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${totalRevenue ? (myCommissionEarned/totalRevenue*100) : 0}%`, background: '#FF4D4D', transition: 'width 0.5s' }} />
          <div style={{ width: `${totalRevenue ? (settledPayout/totalRevenue*100) : 0}%`, background: '#4ADE80', transition: 'width 0.5s' }} />
          <div style={{ flex: 1, background: '#FACC15' }} />
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { color: '#FF4D4D', label: 'My Commission (Settled)', value: `₹${myCommissionEarned.toLocaleString()}` },
            { color: '#4ADE80', label: 'Paid to Workers',         value: `₹${settledPayout.toLocaleString()}` },
            { color: '#FACC15', label: 'Pending Payout',          value: `₹${pendingPayout.toLocaleString()}` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{r.label}: <strong style={{ color: r.color }}>{r.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[['overview','📊 Overview'],['transactions','📋 Transactions'],['workers','🔧 Worker Summary']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 22px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, background: activeTab === tab ? '#FF4D4D' : 'transparent', color: activeTab === tab ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Settlement status */}
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Settlement Status</div>
            {[
              { label: 'Settled',  count: settled.length,  amount: settledPayout, color: '#4ADE80' },
              { label: 'Pending',  count: pending.length,  amount: pendingPayout, color: '#FACC15' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label} ({s.count})</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>₹{s.amount.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${commissions.length ? (s.count/commissions.length*100) : 0}%`, background: s.color, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
          {/* Commission vs earnings */}
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Money Split</div>
            {[
              { label: 'Total Service Revenue', value: totalRevenue,        color: '#60A5FA', pct: 100 },
              { label: 'My Total Commission',   value: totalCommission,     color: '#FF4D4D', pct: totalRevenue ? totalCommission/totalRevenue*100 : 0 },
              { label: 'Total Worker Earnings', value: totalWorkerEarned,   color: '#4ADE80', pct: totalRevenue ? totalWorkerEarned/totalRevenue*100 : 0 },
              { label: 'Pending Payout',        value: pendingPayout,       color: '#FACC15', pct: totalRevenue ? pendingPayout/totalRevenue*100 : 0 },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 120, fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{r.label}</div>
                <div style={{ flex: 1, height: 7, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.color, width: 80, textAlign: 'right' }}>₹{r.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === 'transactions' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1 }}>
              <span style={{ opacity: 0.4 }}>🔍</span>
              <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
                placeholder="Search by booking, worker or service..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 14 }}>✕</button>}
            </div>
            <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
              {[['','All'],['Pending','⏳ Pending'],['Settled','✅ Settled']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterStatus === val ? (val === 'Settled' ? 'rgba(74,222,128,0.15)' : val === 'Pending' ? 'rgba(250,204,21,0.15)' : '#FF4D4D') : 'transparent', color: filterStatus === val ? (val === 'Settled' ? '#4ADE80' : val === 'Pending' ? '#FACC15' : '#fff') : '#555A66' }}>
                  {label} ({val === '' ? commissions.length : val === 'Pending' ? pending.length : settled.length})
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{filterStatus === 'Pending' ? 'No pending settlements 🎉' : 'No records found'}</div>
            </div>
          ) : (
            <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {['#','Booking','Worker','Service','Total','Commission','Worker Gets','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={toStr(c._id)}
                      style={{ borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i+1}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>{c.booking?.bookingNumber || '—'}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.serviceman?.fullName || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.serviceman?.upiId}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#E8EAF0' }}>{c.service?.serviceName || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#E8EAF0' }}>₹{Number(c.totalAmount).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>₹{Number(c.commissionAmount).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#555A66' }}>{c.commissionPercentage}%</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: '#4ADE80' }}>₹{Number(c.servicemanEarning).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {c.settlementStatus === 'Settled'
                          ? <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>✅ Settled</span>
                          : <span style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>⏳ Pending</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {c.settlementStatus === 'Pending'
                          ? <button onClick={() => setSelected(c)} style={{ height: 32, padding: '0 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, color: '#4ADE80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>💸 Settle</button>
                          : <span style={{ fontSize: 11, color: '#555A66' }}>{c.settledAt ? new Date(c.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66', display: 'flex', justifyContent: 'space-between' }}>
                <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{commissions.length}</strong> records</span>
                {filterStatus === 'Pending' && pending.length > 0 && <span style={{ color: '#FACC15', fontWeight: 700 }}>Total to pay: ₹{pendingPayout.toLocaleString()}</span>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── WORKER SUMMARY TAB ── */}
      {activeTab === 'workers' && (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#','Worker','UPI ID','Total Charged','My Commission','Worker Earns','Pending Payout','Status'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workerSummary.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#555A66' }}>No worker data yet</td></tr>
              ) : workerSummary.map((w, i) => (
                <tr key={w.id}
                  style={{ borderBottom: i < workerSummary.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#555A66' }}>{i+1}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#FF6B6B', flexShrink: 0 }}>
                        {w.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{w.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>{w.upi}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>₹{w.totalCharged.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#F87171' }}>₹{w.myCommission.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#4ADE80' }}>₹{w.totalEarned.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: w.pendingPayout > 0 ? '#FACC15' : '#555A66' }}>
                    {w.pendingPayout > 0 ? `₹${w.pendingPayout.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {w.pendingPayout > 0
                      ? <span style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#FACC15' }}>⏳ Pending</span>
                      : <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>✅ Clear</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Footer totals */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0 }}>
            <div style={{ gridColumn: '1/4', fontSize: 12, fontWeight: 700, color: '#555A66' }}>{workerSummary.length} workers total</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#60A5FA' }}>₹{workerSummary.reduce((s,w)=>s+w.totalCharged,0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#F87171' }}>₹{workerSummary.reduce((s,w)=>s+w.myCommission,0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#4ADE80' }}>₹{workerSummary.reduce((s,w)=>s+w.totalEarned,0).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>₹{workerSummary.reduce((s,w)=>s+w.pendingPayout,0).toLocaleString()}</div>
            <div />
          </div>
        </div>
      )}

      {selected && <SettleModal item={selected} onClose={() => setSelected(null)} onDone={handleDone} />}
    </div>
  );
}
