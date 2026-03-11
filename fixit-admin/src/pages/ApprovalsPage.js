import React, { useState, useEffect } from 'react';
import { getServicemanServices, changeServicemanServiceStatus } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalsPage — Serviceman Service Approvals
// GET /ServicemanService/List         → all applications (joined serviceman + service)
// PUT /ServicemanService/ChangeStatus → { _id, status, adminRemark }
// Status: Pending | Approved | Rejected
// ─────────────────────────────────────────────────────────────────────────────

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS_CFG = {
  Pending:  { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)',  icon: '⏳' },
  Approved: { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)',  icon: '✅' },
  Rejected: { color: '#F87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '❌' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: c.color }}>
      {c.icon} {status}
    </span>
  );
}

// ── Action Modal ──────────────────────────────────────────────────────────────
function ActionModal({ item, onClose, onDone }) {
  const [status, setStatus]   = useState('');
  const [remark, setRemark]   = useState(item.adminRemark || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!status) { setError('Please select Approve or Reject'); return; }
    if (status === 'Rejected' && !remark.trim()) { setError('Please enter a remark when rejecting'); return; }
    setSaving(true);
    try {
      // PUT /ServicemanService/ChangeStatus → { _id, status, adminRemark }
      const res = await changeServicemanServiceStatus({
        _id: toStr(item._id),
        status,
        adminRemark: remark.trim() || null,
      });
      if (res.data.Status === 'OK') {
        setSuccess(`✅ Application ${status} successfully!`);
        onDone(toStr(item._id), status, remark);
        setTimeout(() => onClose(), 1500);
      } else { setError(res.data.Result); }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, padding: 32, width: 480 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Review Application</div>
            <div style={{ fontSize: 12, color: '#555A66' }}>Approve or reject this service application</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Application info card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 4 }}>WORKER</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.serviceman?.fullName}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.serviceman?.email}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.serviceman?.city}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 4 }}>SERVICE APPLIED</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.service?.serviceName}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Max Price: ₹{item.service?.maximumPrice?.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={item.status} />
            <span style={{ fontSize: 11, color: '#555A66' }}>
              Applied {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
          {item.adminRemark && (
            <div style={{ marginTop: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F87171' }}>
              Previous remark: {item.adminRemark}
            </div>
          )}
        </div>

        {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{success}</div>}

        {/* Approve / Reject toggle */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 10 }}>DECISION *</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <button onClick={() => setStatus('Approved')}
            style={{ flex: 1, height: 46, borderRadius: 10, border: `2px solid ${status === 'Approved' ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.08)'}`, background: status === 'Approved' ? 'rgba(74,222,128,0.12)' : 'transparent', color: status === 'Approved' ? '#4ADE80' : '#555A66', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif", transition: 'all 0.2s' }}>
            ✅ Approve
          </button>
          <button onClick={() => setStatus('Rejected')}
            style={{ flex: 1, height: 46, borderRadius: 10, border: `2px solid ${status === 'Rejected' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`, background: status === 'Rejected' ? 'rgba(239,68,68,0.12)' : 'transparent', color: status === 'Rejected' ? '#F87171' : '#555A66', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif", transition: 'all 0.2s' }}>
            ❌ Reject
          </button>
        </div>

        {/* Admin Remark */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 8 }}>
          ADMIN REMARK {status === 'Rejected' ? '*' : '(optional)'}
        </div>
        <textarea
          placeholder={status === 'Rejected' ? 'Reason for rejection (required)...' : 'Add a note for the worker (optional)...'}
          value={remark} onChange={e => setRemark(e.target.value)}
          onFocus={() => setFocused('remark')} onBlur={() => setFocused('')}
          style={{ width: '100%', background: '#0a0d12', border: `1.5px solid ${focused === 'remark' ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '12px 14px', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 20 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !status}
            style={{ flex: 2, height: 46, background: saving || !status ? '#1a1a1a' : status === 'Approved' ? '#22C55E' : '#EF4444', border: 'none', borderRadius: 10, color: saving || !status ? '#555A66' : '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving || !status ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {saving ? '⏳ Saving...' : status ? `${status === 'Approved' ? '✅ Approve' : '❌ Reject'} Application` : 'Select a Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending'); // default to pending
  const [selectedItem, setSelected]     = useState(null);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true); setError('');
    try {
      const res = await getServicemanServices();
      if (res.data.Status === 'OK') setApplications(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load applications');
    } finally { setLoading(false); }
  };

  // After approve/reject — update local state
  const handleDone = (id, newStatus, remark) => {
    setApplications(prev => prev.map(a =>
      toStr(a._id) === id ? { ...a, status: newStatus, adminRemark: remark } : a
    ));
  };

  // Counts per status
  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = applications.filter(a => {
    const matchSearch = !search ||
      a.serviceman?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      a.service?.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceman?.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Service Approvals ✅</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>Review and approve serviceman service applications</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            style={{ background: '#0D1117', border: `1px solid ${filterStatus === status ? cfg.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: filterStatus === status ? `0 0 20px ${cfg.bg}` : 'none' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{cfg.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: cfg.color, marginBottom: 4 }}>{counts[status] || 0}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>{status.toUpperCase()} APPLICATIONS</div>
            {status === 'Pending' && (counts['Pending'] || 0) > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#FACC15', fontWeight: 600 }}>⚠️ Needs your attention</div>
            )}
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1, minWidth: 200 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by worker name, service or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Status tabs */}
        <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <button onClick={() => setFilterStatus('')}
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !filterStatus ? '#FF4D4D' : 'transparent', color: !filterStatus ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
            All ({applications.length})
          </button>
          {Object.entries(STATUS_CFG).map(([s, c]) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: filterStatus === s ? c.bg : 'transparent', color: filterStatus === s ? c.color : '#555A66', transition: 'all 0.2s' }}>
              {c.icon} {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {filterStatus === 'Pending' ? 'No pending applications — all caught up! 🎉' : 'No applications found'}
          </div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Worker', 'Service', 'City', 'Applied On', 'Status', 'Remark', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={toStr(item._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#555A66', fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>

                  {/* Worker */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.serviceman?.fullName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.serviceman?.email}</div>
                  </td>

                  {/* Service */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.service?.serviceName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#4ADE80' }}>₹{item.service?.maximumPrice?.toLocaleString()}</div>
                  </td>

                  {/* City */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>
                      📍 {item.serviceman?.city || '—'}
                    </span>
                  </td>

                  {/* Applied on */}
                  <td style={{ padding: '14px 18px', fontSize: 11, color: '#555A66' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={item.status} /></td>

                  {/* Remark */}
                  <td style={{ padding: '14px 18px', maxWidth: 160 }}>
                    {item.adminRemark ? (
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }} title={item.adminRemark}>
                        {item.adminRemark.length > 30 ? item.adminRemark.slice(0, 30) + '...' : item.adminRemark}
                      </span>
                    ) : <span style={{ color: '#333' }}>—</span>}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '14px 18px' }}>
                    <button onClick={() => setSelected(item)}
                      style={{ height: 32, padding: '0 16px', background: item.status === 'Pending' ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${item.status === 'Pending' ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: item.status === 'Pending' ? '#FACC15' : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      {item.status === 'Pending' ? '⏳ Review' : '✏️ Update'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66' }}>
            Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{applications.length}</strong> applications
          </div>
        </div>
      )}

      {selectedItem && (
        <ActionModal
          item={selectedItem}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
