import React, { useState, useEffect } from 'react';
import { getCustomers } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// CustomersPage
// GET /Customer/List → all customers (password excluded)
// Fields: fullName, contactNumber, email, status, createdAt
// ─────────────────────────────────────────────────────────────────────────────

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
function CustomerModal({ customer, onClose }) {
  const Row = ({ icon, label, value, mono }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#E8EAF0', fontFamily: mono ? "'JetBrains Mono',monospace" : "'Syne',sans-serif", wordBreak: 'break-all' }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 20, width: 420, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg,#0f0505,#1a0808)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {/* Avatar */}
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,77,77,0.2)', border: '2px solid rgba(255,77,77,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#FF6B6B', flexShrink: 0 }}>
            {customer.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{customer.fullName}</div>
            <span style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>
              ● {customer.status || 'Active'}
            </span>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#555A66', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Details */}
        <div style={{ padding: '8px 28px 24px' }}>
          <Row icon="📞" label="CONTACT NUMBER" value={customer.contactNumber} mono />
          <Row icon="✉️" label="EMAIL"           value={customer.email} />
          <Row icon="📅" label="JOINED ON"       value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
          <Row icon="🆔" label="CUSTOMER ID"     value={toStr(customer._id)} mono />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [sortBy, setSortBy]       = useState('newest'); // newest | oldest | name

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true); setError('');
    try {
      const res = await getCustomers();
      if (res.data.Status === 'OK') setCustomers(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load customers');
    } finally { setLoading(false); }
  };

  // Sort
  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name')   return (a.fullName || '').localeCompare(b.fullName || '');
    return 0;
  });

  const filtered = sorted.filter(c =>
    !search ||
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactNumber?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const thisMonth = customers.filter(c => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Customers 👥</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>All registered customers on the platform</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '👥', label: 'TOTAL CUSTOMERS',    value: customers.length,  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.2)'  },
          { icon: '✅', label: 'ACTIVE CUSTOMERS',   value: customers.filter(c => c.status === 'Active' || !c.status).length, color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.2)' },
          { icon: '🆕', label: 'JOINED THIS MONTH',  value: thisMonth,         color: '#FACC15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.2)'  },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D1117', border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, flex: 1, minWidth: 220 }}>
          <span style={{ opacity: 0.4 }}>🔍</span>
          <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: '100%' }}
            placeholder="Search by name, number or email..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#555A66', cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>

        {/* Sort */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40, display: 'flex', alignItems: 'center' }}>
          <select style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' }}
            value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest" style={{ background: '#0D1117' }}>🕐 Newest First</option>
            <option value="oldest" style={{ background: '#0D1117' }}>🕐 Oldest First</option>
            <option value="name"   style={{ background: '#0D1117' }}>🔤 Name A-Z</option>
          </select>
        </div>

        <div style={{ fontSize: 12, color: '#555A66', marginLeft: 4 }}>
          {filtered.length} of {customers.length} customers
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{search ? 'No customers match your search' : 'No customers yet'}</div>
        </div>
      ) : (
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Customer', 'Contact', 'Email', 'Status', 'Joined', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={toStr(c._id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelected(c)}>

                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#555A66', fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>

                  {/* Name + Avatar */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#60A5FA', flexShrink: 0 }}>
                        {c.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.fullName}</div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#9CA3AF', fontFamily: "'JetBrains Mono',monospace" }}>{c.contactNumber}</td>

                  {/* Email */}
                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#9CA3AF' }}>{c.email || <span style={{ color: '#333' }}>—</span>}</td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>
                      ● {c.status || 'Active'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '14px 18px', fontSize: 11, color: '#555A66' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(c)}
                      style={{ height: 32, padding: '0 16px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#555A66', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing <strong style={{ color: '#E8EAF0' }}>{filtered.length}</strong> of <strong style={{ color: '#E8EAF0' }}>{customers.length}</strong> customers</span>
            <span>Click any row to view details</span>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
