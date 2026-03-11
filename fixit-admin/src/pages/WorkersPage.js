import React, { useState, useEffect } from 'react';
import { getServicemen, changeServicemanStatus, getServicemanById } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// WorkersPage
// GET /Serviceman/List              → all workers
// PUT /Serviceman/ChangeStatus      → { id, status }
// GET /Serviceman/ById/:id          → full details
// Status values: Pending | Approved | Rejected | Suspended
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending:   { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)',  icon: '⏳' },
  Approved:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)',  icon: '✅' },
  Rejected:  { color: '#F87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '❌' },
  Suspended: { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)',  icon: '🚫' },
};

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: c.color }}>
      {c.icon} {status}
    </span>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ worker, onClose, onStatusChange }) {
  const [status, setStatus]     = useState(worker.status);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [details, setDetails]   = useState(worker);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    // Fetch full details including bank info
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await getServicemanById(toStr(worker._id));
        if (res.data.Status === 'OK') setDetails(res.data.Result);
      } catch (_) {}
      finally { setLoadingDetails(false); }
    };
    fetchDetails();
  }, [worker._id]);

  const handleStatusChange = async (newStatus) => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await changeServicemanStatus({ id: toStr(details._id), status: newStatus });
      if (res.data.Status === 'OK') {
        setStatus(newStatus);
        setSuccess(`✅ Status changed to ${newStatus}`);
        onStatusChange(toStr(details._id), newStatus);
        setTimeout(() => setSuccess(''), 2000);
      } else { setError(res.data.Result); }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to update status');
    } finally { setSaving(false); }
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  const Row = ({ label, value, mono }) => value ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5, minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#E8EAF0', fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit', textAlign: 'right', maxWidth: 220, wordBreak: 'break-all' }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 540, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.bg}`, border: `2px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: cfg.color }}>
              {details.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{details.fullName}</div>
              <StatusBadge status={status} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {loadingDetails ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#555A66' }}>Loading details...</div>
        ) : (
          <div style={{ padding: '20px 28px' }}>

            {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{success}</div>}

            {/* ── Personal Info ── */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#FF4D4D', letterSpacing: 1.5, marginBottom: 8 }}>PERSONAL INFO</div>
            <Row label="Full Name"      value={details.fullName} />
            <Row label="Email"          value={details.email} />
            <Row label="Contact"        value={details.contactNumber} mono />
            <Row label="City"           value={details.city} />
            <Row label="Address"        value={details.address} />
            {details.businessName && <Row label="Business Name"  value={details.businessName} />}
            {details.aboutBusiness && <Row label="About Business" value={details.aboutBusiness} />}

            {/* ── Bank Info ── */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#FF4D4D', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }}>BANK DETAILS</div>
            <Row label="Account Holder" value={details.bankAccountHolderName} />
            <Row label="Bank Name"      value={details.bankName} />
            <Row label="Account No"     value={details.accountNumber} mono />
            <Row label="IFSC Code"      value={details.ifscCode} mono />
            {details.upiId && <Row label="UPI ID" value={details.upiId} mono />}

            {/* ── Joined ── */}
            {details.createdAt && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FF4D4D', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 }}>OTHER</div>
                <Row label="Joined" value={new Date(details.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              </>
            )}

            {/* ── Status Actions ── */}
            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 12 }}>CHANGE STATUS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                  <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || status === s}
                    style={{
                      flex: 1, minWidth: 90, height: 36, borderRadius: 8, border: `1px solid ${status === s ? c.border : 'rgba(255,255,255,0.08)'}`,
                      background: status === s ? c.bg : 'transparent', color: status === s ? c.color : '#555A66',
                      fontSize: 12, fontWeight: 700, cursor: status === s ? 'default' : 'pointer',
                      fontFamily: "'Syne',sans-serif", opacity: saving ? 0.6 : 1, transition: 'all 0.15s',
                    }}>
                    {c.icon} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkersPage() {
  const [workers, setWorkers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity]   = useState('');
  const [selectedWorker, setSelected] = useState(null);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    setLoading(true); setError('');
    try {
      const res = await getServicemen();
      if (res.data.Status === 'OK') setWorkers(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load workers');
    } finally { setLoading(false); }
  };

  // Update status in local state after modal change
  const handleStatusChange = (id, newStatus) => {
    setWorkers(prev => prev.map(w => toStr(w._id) === id ? { ...w, status: newStatus } : w));
  };

  // Unique cities for filter
  const cities = [...new Set(workers.map(w => w.city).filter(Boolean))].sort();

  // Stats
  const counts = workers.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = workers.filter(w => {
    const matchSearch = !search ||
      w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      w.email?.toLowerCase().includes(search.toLowerCase()) ||
      w.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || w.status === filterStatus;
    const matchCity   = !filterCity   || w.city === filterCity;
    return matchSearch && matchStatus && matchCity;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Workers 🔧</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>{workers.length} total workers registered</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            style={{ background: '#0D1117', border: `1px solid ${filterStatus === status ? cfg.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: filterStatus === status ? `0 0 20px ${cfg.bg}` : 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{cfg.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: cfg.color }}>{counts[status] || 0}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>{status.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1, minWidth: 200 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by name, email or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Status filter */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, display: 'flex', alignItems: 'center' }}>
          <select style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="" style={{ background: '#0D1117' }}>All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s} style={{ background: '#0D1117' }}>{s}</option>)}
          </select>
        </div>

        {/* City filter */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, display: 'flex', alignItems: 'center' }}>
          <select style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' }}
            value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="" style={{ background: '#0D1117' }}>All Cities</option>
            {cities.map(c => <option key={c} value={c} style={{ background: '#0D1117' }}>{c}</option>)}
          </select>
        </div>

        {(filterStatus || filterCity || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterCity(''); setSearch(''); }}
            style={{ height: 40, padding: '0 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#F87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading workers...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No workers found</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Try adjusting your filters</div>
        </div>
      ) : (
        /* ── TABLE ── */
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Name', 'Email', 'Contact', 'City', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => (
                <tr key={toStr(w._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#555A66', fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${STATUS_CONFIG[w.status]?.bg || 'rgba(255,77,77,0.1)'}`, border: `1px solid ${STATUS_CONFIG[w.status]?.border || 'rgba(255,77,77,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: STATUS_CONFIG[w.status]?.color || '#FF6B6B', flexShrink: 0 }}>
                        {w.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{w.fullName}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#9CA3AF' }}>{w.email}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>{w.contactNumber}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>
                      📍 {w.city}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: '14px 18px', fontSize: 11, color: '#555A66' }}>
                    {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button onClick={() => setSelected(w)}
                      style={{ height: 32, padding: '0 16px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 8, color: '#FF6B6B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer count */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66' }}>
            Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{workers.length}</strong> workers
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedWorker && (
        <DetailModal
          worker={selectedWorker}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
