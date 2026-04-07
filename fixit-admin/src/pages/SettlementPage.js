import React, { useState, useEffect } from 'react';
import { getCommissions, settleCommission, bulkSettleCommissions } from '../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// ── Single Settle Modal ───────────────────────────────────────────────────────
function SettleModal({ item, onClose, onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSettle = async () => {
    setError(''); setSaving(true);
    try {
      const res = await settleCommission({ id: toStr(item._id) });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Commission settled!');
        onDone(toStr(item._id));
        setTimeout(() => onClose(), 1200);
      } else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 460 }}>
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px 20px 0 0' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Settle Commission 💸</div>
          <div style={{ fontSize: 12, color: '#555A66' }}>Confirm payment to serviceman</div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'BOOKING NO',    value: item.booking?.bookingNumber,                                 color: '#FF6B6B' },
                { label: 'WORKER',        value: item.serviceman?.fullName || '—',                            color: '#fff'    },
                { label: 'SERVICE',       value: item.service?.serviceName || '—',                            color: '#fff'    },
                { label: 'TOTAL AMOUNT',  value: `₹${Number(item.totalAmount).toLocaleString()}`,             color: '#E8EAF0' },
                { label: `COMMISSION (${item.commissionPercentage}%)`, value: `₹${Number(item.commissionAmount).toLocaleString()}`, color: '#F87171' },
                { label: 'WORKER EARNING', value: `₹${Number(item.servicemanEarning).toLocaleString()}`,      color: '#4ADE80' },
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
            <button onClick={handleSettle} disabled={saving} style={{ flex: 2, height: 46, background: saving ? '#1a1a1a' : '#22C55E', border: 'none', borderRadius: 10, color: saving ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Processing...' : '💸 Confirm Settlement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Settle Modal ─────────────────────────────────────────────────────────
function BulkSettleModal({ items, onClose, onDone }) {
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const totalAmount = items.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0);

  const handleBulkSettle = async () => {
    setError(''); setSaving(true);
    try {
      const ids = items.map(c => toStr(c._id));
      const res = await bulkSettleCommissions({ ids, settledAt: new Date().toISOString() });
      if (res.data.Status === 'OK') {
        setSuccess(`✅ ${items.length} commission${items.length > 1 ? 's' : ''} settled!`);
        onDone(ids);
        setTimeout(() => onClose(), 1200);
      } else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 500 }}>
        <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px 20px 0 0' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Bulk Settle {items.length} Commission{items.length > 1 ? 's' : ''} 💸</div>
          <div style={{ fontSize: 12, color: '#555A66' }}>Confirm bulk payment to selected workers</div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
            {items.map((c, i) => (
              <div key={toStr(c._id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.serviceman?.fullName || '—'}</div>
                  <div style={{ fontSize: 11, color: '#555A66' }}>{c.booking?.bookingNumber || '—'} · UPI: {c.serviceman?.upiId || '—'}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#4ADE80' }}>₹{Number(c.servicemanEarning).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 6 }}>TOTAL AMOUNT TO PAY</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#4ADE80' }}>₹{Math.round(totalAmount).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#555A66', marginTop: 4 }}>across {items.length} worker{items.length > 1 ? 's' : ''}</div>
          </div>
          {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, marginBottom: 14 }}>{success}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleBulkSettle} disabled={saving} style={{ flex: 2, height: 46, background: saving ? '#1a1a1a' : '#22C55E', border: 'none', borderRadius: 10, color: saving ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Processing...' : `💸 Settle ${items.length} Commission${items.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettlementPage() {
  const [commissions, setCommissions]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [activeTab, setActiveTab]         = useState('transactions');
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('Pending');
  const [selected, setSelected]           = useState(null);
  const [checkedIds, setCheckedIds]       = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [dateError, setDateError]         = useState('');

  useEffect(() => { fetchCommissions(); }, []);
  useEffect(() => { setCheckedIds(new Set()); }, [filterStatus, search, dateFrom, dateTo]);

  const fetchCommissions = async () => {
    setLoading(true); setError('');
    try {
      const res = await getCommissions();
      if (res.data.Status === 'OK') setCommissions(res.data.Result);
      else setError(res.data.Result);
    } catch { setError('Failed to load settlements'); }
    finally { setLoading(false); }
  };

  // ── Date validation ───────────────────────────────────────────────────────
  const handleDateFrom = (val) => {
    setDateFrom(val);
    if (dateTo && val && new Date(val) > new Date(dateTo)) {
      setDateError('From date cannot be after To date');
    } else {
      setDateError('');
    }
  };

  const handleDateTo = (val) => {
    setDateTo(val);
    if (dateFrom && val && new Date(val) < new Date(dateFrom)) {
      setDateError('To date cannot be before From date');
    } else {
      setDateError('');
    }
  };

  const handleDone = (id) => {
    setCommissions(prev => prev.map(c =>
      toStr(c._id) === id ? { ...c, settlementStatus: 'Settled', settledAt: new Date().toISOString() } : c
    ));
  };

  const handleBulkDone = (ids) => {
    const idSet = new Set(ids);
    setCommissions(prev => prev.map(c =>
      idSet.has(toStr(c._id)) ? { ...c, settlementStatus: 'Settled', settledAt: new Date().toISOString() } : c
    ));
    setCheckedIds(new Set());
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const pending            = commissions.filter(c => c.settlementStatus === 'Pending');
  const settled            = commissions.filter(c => c.settlementStatus === 'Settled');
  const totalRevenue       = Math.round(commissions.reduce((s, c) => s + Number(c.totalAmount || 0), 0));
  const totalCommission    = Math.round(commissions.reduce((s, c) => s + Number(c.commissionAmount || 0), 0));
  const totalWorkerEarned  = Math.round(commissions.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));
  const pendingPayout      = Math.round(pending.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));
  const settledPayout      = Math.round(settled.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));
  const myCommissionEarned = Math.round(settled.reduce((s, c) => s + Number(c.commissionAmount || 0), 0));

  // ── Worker summary ────────────────────────────────────────────────────────
  const workerSummary = (() => {
    const map = {};
    commissions.forEach(c => {
      const id   = toStr(c.serviceman?._id) || toStr(c.booking?.servicemanId) || 'unknown';
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

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = commissions.filter(c => {
    const matchSearch = !search ||
      c.booking?.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.service?.serviceName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.settlementStatus === filterStatus;
    let matchDate = true;
    if (!dateError && (dateFrom || dateTo)) {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      if (d) {
        if (dateFrom) matchDate = matchDate && d >= new Date(dateFrom);
        if (dateTo)   { const end = new Date(dateTo); end.setHours(23,59,59,999); matchDate = matchDate && d <= end; }
      } else matchDate = false;
    }
    return matchSearch && matchStatus && matchDate;
  });

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const selectablePendingIds = filtered.filter(c => c.settlementStatus === 'Pending').map(c => toStr(c._id));
  const allPendingSelected   = selectablePendingIds.length > 0 && selectablePendingIds.every(id => checkedIds.has(id));
  const someSelected         = checkedIds.size > 0 && !allPendingSelected;

  const toggleSelectAll = () => {
    if (allPendingSelected) setCheckedIds(new Set());
    else setCheckedIds(new Set(selectablePendingIds));
  };
  const toggleOne = (id) => {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectedItems = filtered.filter(c => checkedIds.has(toStr(c._id)));
  const selectedTotal = Math.round(selectedItems.reduce((s, c) => s + Number(c.servicemanEarning || 0), 0));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: "'Syne',sans-serif", color: '#555A66', gap: 12 }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(255,77,77,0.3)', borderTopColor: '#FF4D4D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading settlements...
    </div>
  );

  const S = { fontFamily: "'Syne',sans-serif", color: '#E8EAF0' };

  return (
    <div style={S}>

      {/* ── HEADER ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Settlement 💸</div>
          <div style={{ fontSize: 12, color: '#555A66', marginTop: 2 }}>Commission tracking · Worker payment management</div>
        </div>
        {/* Settle All Pending — top right */}
        {pending.length > 0 && (
          <button
            onClick={() => { setCheckedIds(new Set(pending.map(c => toStr(c._id)))); setShowBulkModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 18px', background: 'linear-gradient(135deg,#FF4D4D,#cc2200)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 18px rgba(255,77,77,0.35)' }}>
            💸 Settle All Pending
            <span style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '1px 7px', fontSize: 11, fontWeight: 900 }}>{pending.length}</span>
          </button>
        )}
      </div>

      {/* ── COMPACT STAT STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '💰', label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString()}`,        sub: `${commissions.length} bookings`,   color: '#60A5FA', bg: 'rgba(96,165,250,0.07)',   border: 'rgba(96,165,250,0.18)'  },
          { icon: '🏦', label: 'My Commission',     value: `₹${myCommissionEarned.toLocaleString()}`,  sub: `${settled.length} settled`,         color: '#FF6B6B', bg: 'rgba(255,77,77,0.07)',    border: 'rgba(255,77,77,0.18)'   },
          { icon: '🔧', label: 'Worker Earnings',   value: `₹${totalWorkerEarned.toLocaleString()}`,   sub: 'all workers combined',              color: '#4ADE80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.18)'  },
          { icon: '⏳', label: 'Pending Payout',    value: `₹${pendingPayout.toLocaleString()}`,       sub: `${pending.length} unsettled`,       color: '#FACC15', bg: 'rgba(250,204,21,0.07)',  border: pending.length > 0 ? 'rgba(250,204,21,0.4)' : 'rgba(250,204,21,0.18)', warn: pending.length > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: s.warn ? s.color : '#555A66', marginTop: 1 }}>{s.warn ? '⚠️ ' : ''}{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── REVENUE BAR + SPLIT — compact single row ── */}
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>REVENUE SPLIT</div>
        <div style={{ flex: 1, height: 8, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${totalRevenue ? (myCommissionEarned/totalRevenue*100) : 0}%`, background: '#FF4D4D' }} />
          <div style={{ width: `${totalRevenue ? (settledPayout/totalRevenue*100) : 0}%`, background: '#4ADE80' }} />
          <div style={{ flex: 1, background: '#FACC15' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { color: '#FF4D4D', label: 'Commission', value: `₹${myCommissionEarned.toLocaleString()}` },
            { color: '#4ADE80', label: 'Paid Out',   value: `₹${settledPayout.toLocaleString()}` },
            { color: '#FACC15', label: 'Pending',    value: `₹${pendingPayout.toLocaleString()}` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{r.label}: <strong style={{ color: r.color }}>{r.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3, marginBottom: 16, width: 'fit-content' }}>
        {[['transactions','📋 Transactions'],['overview','📊 Overview'],['workers','🔧 Workers']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, background: activeTab === tab ? '#FF4D4D' : 'transparent', color: activeTab === tab ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}

      {/* ════════════════════════════════════════════════════════════════════
          TRANSACTIONS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transactions' && (
        <>
          {/* ── Filter bar ── */}
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0 12px', height: 36, flex: 1, minWidth: 180 }}>
              <span style={{ opacity: 0.35, fontSize: 13 }}>🔍</span>
              <input
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 12, width: '100%' }}
                placeholder="Search booking, worker, service..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>}
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden', height: 36 }}>
              {[['','All'],['Pending','⏳ Pending'],['Settled','✅ Settled']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  style={{ padding: '0 14px', fontSize: 11, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', height: 36,
                    background: filterStatus === val ? (val === 'Settled' ? 'rgba(74,222,128,0.18)' : val === 'Pending' ? 'rgba(250,204,21,0.18)' : '#FF4D4D') : 'transparent',
                    color: filterStatus === val ? (val === 'Settled' ? '#4ADE80' : val === 'Pending' ? '#FACC15' : '#fff') : '#555A66',
                    borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  {label} ({val === '' ? commissions.length : val === 'Pending' ? pending.length : settled.length})
                </button>
              ))}
            </div>

            {/* Date range — single unified pill */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${dateError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, height: 36, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', fontSize: 12 }}>📅</span>
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)' }} />
              <input
                type="date"
                value={dateFrom}
                onChange={e => handleDateFrom(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: dateFrom ? '#E8EAF0' : '#555A66', fontFamily: "'Syne',sans-serif", fontSize: 11, padding: '0 10px', outline: 'none', colorScheme: 'dark', height: 36, cursor: 'pointer' }}
              />
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ padding: '0 6px', fontSize: 10, color: '#555A66', fontWeight: 700 }}>TO</span>
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)' }} />
              <input
                type="date"
                value={dateTo}
                onChange={e => handleDateTo(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: dateTo ? '#E8EAF0' : '#555A66', fontFamily: "'Syne',sans-serif", fontSize: 11, padding: '0 10px', outline: 'none', colorScheme: 'dark', height: 36, cursor: 'pointer' }}
              />
              {(dateFrom || dateTo) && (
                <>
                  <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)' }} />
                  <button onClick={() => { setDateFrom(''); setDateTo(''); setDateError(''); }}
                    style={{ background: 'rgba(255,77,77,0.15)', border: 'none', color: '#F87171', fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, padding: '0 12px', cursor: 'pointer', height: 36 }}>✕</button>
                </>
              )}
            </div>
          </div>

          {/* Date validation error */}
          {dateError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>{dateError}</span>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {checkedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '9px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80' }}>{checkedIds.size} selected</span>
                </div>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Payout: <strong style={{ color: '#4ADE80' }}>₹{selectedTotal.toLocaleString()}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setCheckedIds(new Set())}
                  style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Deselect
                </button>
                <button onClick={() => setShowBulkModal(true)}
                  style={{ height: 30, padding: '0 14px', background: '#22C55E', border: 'none', borderRadius: 7, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  💸 Settle Selected ({checkedIds.size})
                </button>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#555A66', background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💸</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{filterStatus === 'Pending' ? 'No pending settlements 🎉' : 'No records found'}</div>
              {(dateFrom || dateTo) && !dateError && <div style={{ fontSize: 12, color: '#555A66', marginTop: 6 }}>Try adjusting the date range</div>}
            </div>
          ) : (
            <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Select All checkbox col */}
                    <th style={{ padding: '12px 14px', width: 110 }}>
                      {selectablePendingIds.length > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={allPendingSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={toggleSelectAll}
                            style={{ cursor: 'pointer', accentColor: '#4ADE80', width: 14, height: 14, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>SELECT ALL</span>
                        </label>
                      )}
                    </th>
                    {['#','Booking','Worker','Service','Total','Commission','Worker Gets','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const id        = toStr(c._id);
                    const isPending = c.settlementStatus === 'Pending';
                    const isChecked = checkedIds.has(id);
                    return (
                      <tr key={id}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isChecked ? 'rgba(74,222,128,0.04)' : 'transparent', transition: 'background 0.12s' }}
                        onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isChecked ? 'rgba(74,222,128,0.04)' : 'transparent'; }}>
                        <td style={{ padding: '12px 14px' }}>
                          {isPending && (
                            <input type="checkbox" checked={isChecked} onChange={() => toggleOne(id)}
                              style={{ cursor: 'pointer', accentColor: '#4ADE80', width: 14, height: 14 }} />
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: '#555A66' }}>{i + 1}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#FF6B6B', fontWeight: 700 }}>{c.booking?.bookingNumber || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.serviceman?.fullName || '—'}</div>
                          <div style={{ fontSize: 10, color: '#555A66' }}>{c.serviceman?.upiId || ''}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#E8EAF0' }}>{c.service?.serviceName || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#E8EAF0' }}>₹{Number(c.totalAmount).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#F87171' }}>₹{Number(c.commissionAmount).toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#555A66' }}>{c.commissionPercentage}%</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 900, color: '#4ADE80' }}>₹{Number(c.servicemanEarning).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {isPending
                            ? <span style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#FACC15' }}>⏳ Pending</span>
                            : <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#4ADE80' }}>✅ Settled</span>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {isPending
                            ? <button onClick={() => setSelected(c)} style={{ height: 30, padding: '0 12px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 7, color: '#4ADE80', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>💸 Settle</button>
                            : <span style={{ fontSize: 10, color: '#555A66' }}>{c.settledAt ? new Date(c.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: '#555A66', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{commissions.length}</strong> records</span>
                {filterStatus === 'Pending' && pending.length > 0 && <span style={{ color: '#FACC15', fontWeight: 700 }}>Total to pay: ₹{pendingPayout.toLocaleString()}</span>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: 0.3 }}>Settlement Status</div>
            {[
              { label: 'Settled', count: settled.length, amount: settledPayout, color: '#4ADE80' },
              { label: 'Pending', count: pending.length, amount: pendingPayout, color: '#FACC15' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label} ({s.count})</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>₹{s.amount.toLocaleString()}</span>
                </div>
                <div style={{ height: 7, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${commissions.length ? (s.count / commissions.length * 100) : 0}%`, background: s.color, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: 0.3 }}>Money Split</div>
            {[
              { label: 'Total Revenue',     value: totalRevenue,      color: '#60A5FA', pct: 100 },
              { label: 'My Commission',     value: totalCommission,   color: '#FF4D4D', pct: totalRevenue ? totalCommission / totalRevenue * 100 : 0 },
              { label: 'Worker Earnings',   value: totalWorkerEarned, color: '#4ADE80', pct: totalRevenue ? totalWorkerEarned / totalRevenue * 100 : 0 },
              { label: 'Pending Payout',    value: pendingPayout,     color: '#FACC15', pct: totalRevenue ? pendingPayout / totalRevenue * 100 : 0 },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 110, fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{r.label}</div>
                <div style={{ flex: 1, height: 6, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.color, width: 76, textAlign: 'right' }}>₹{r.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          WORKERS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'workers' && (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#','Worker','UPI ID','Total Charged','My Commission','Worker Earns','Pending Payout','Status'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workerSummary.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#555A66' }}>No worker data yet</td></tr>
              ) : workerSummary.map((w, i) => (
                <tr key={w.id}
                  style={{ borderBottom: i < workerSummary.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: '#555A66' }}>{i + 1}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#FF6B6B', flexShrink: 0 }}>
                        {w.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{w.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>{w.upi}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#60A5FA' }}>₹{w.totalCharged.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#F87171' }}>₹{w.myCommission.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>₹{w.totalEarned.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: w.pendingPayout > 0 ? '#FACC15' : '#555A66' }}>
                    {w.pendingPayout > 0 ? `₹${w.pendingPayout.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {w.pendingPayout > 0
                      ? <span style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#FACC15' }}>⏳ Pending</span>
                      : <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#4ADE80' }}>✅ Clear</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0 }}>
            <div style={{ gridColumn: '1/4', fontSize: 11, fontWeight: 700, color: '#555A66' }}>{workerSummary.length} workers total</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#60A5FA' }}>₹{workerSummary.reduce((s,w)=>s+w.totalCharged,0).toLocaleString()}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#F87171' }}>₹{workerSummary.reduce((s,w)=>s+w.myCommission,0).toLocaleString()}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#4ADE80' }}>₹{workerSummary.reduce((s,w)=>s+w.totalEarned,0).toLocaleString()}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#FACC15' }}>₹{workerSummary.reduce((s,w)=>s+w.pendingPayout,0).toLocaleString()}</div>
            <div />
          </div>
        </div>
      )}

      {selected && <SettleModal item={selected} onClose={() => setSelected(null)} onDone={handleDone} />}
      {showBulkModal && (
        <BulkSettleModal
          items={selectedItems}
          onClose={() => setShowBulkModal(false)}
          onDone={(ids) => { handleBulkDone(ids); setShowBulkModal(false); }}
        />
      )}
    </div>
  );
}
