import React, { useState, useEffect } from 'react';
import {
  getServices,
  getServiceCategories,
  createService,
  updateService,
  deleteService,
  recoverService
} from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// ServicesPage
// GET  /Service/List             → show all services
// GET  /ServiceCategory/List     → populate category dropdown
// POST /Service/Create           → { serviceName, serviceCategoryId, maximumPrice, description }
// PUT  /Service/Update           → { _id, serviceName, serviceCategoryId, maximumPrice, description }
// PUT  /Service/Delete           → { id }
// ─────────────────────────────────────────────────────────────────────────────

const emptyForm = { serviceName: '', serviceCategoryId: '', maximumPrice: '', description: '' };

// ── toStr outside component so it can be used anywhere ──
// MongoDB returns ids as { $oid: "..." } objects — this extracts plain string
const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  if (typeof id === 'object' && id.toString) return id.toString();
  return String(id);
};

const S = {
  label:  { fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 5, display: 'block' },
  inp: (f, focused) => ({
    display: 'flex', alignItems: 'center', gap: 10, background: '#0a0d12',
    borderRadius: 10, padding: '0 14px', height: 46,
    border: `1.5px solid ${focused === f ? '#FF4D4D44' : 'rgba(255,255,255,0.08)'}`,
    boxShadow: focused === f ? '0 0 0 3px rgba(255,77,77,0.1)' : 'none', transition: 'all 0.2s',
  }),
  input:    { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13 },
  select:   { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' },
  textarea: { width: '100%', background: '#0a0d12', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
};

export default function ServicesPage() {
  const [services, setServices]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [focused, setFocused]       = useState('');
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [allCategories, setAllCats]   = useState([]); // ALL active cats for add/edit dropdown
  const [showDeleted, setShowDeleted]   = useState(false);
  const [deletedServices, setDeletedSvcs] = useState([]);
  const [recoverError, setRecoverError]   = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [sRes, cRes] = await Promise.all([getServices(), getServiceCategories()]);
      // Store all categories (active + deleted) for name lookup
      const allCats = cRes.data.Status === 'OK' ? cRes.data.Result : [];

      // Store ALL active categories for add/edit modal dropdown
      setAllCats(allCats);

      if (sRes.data.Status === 'OK') {
        setServices(sRes.data.Result);
        // Filter dropdown only shows categories that already have services
        const activeCatIds = new Set(sRes.data.Result.map(s => toStr(s?.category?._id)).filter(Boolean));
        setCategories(allCats.filter(c => activeCatIds.has(toStr(c._id))));
      }

      // Fetch deleted services and attach category name from allCats
      try {
        const apiMod = (await import('../utils/api')).default;
        const dRes = await apiMod.get('/Service/DeletedList');
        if (dRes.data.Status === 'OK') {
          // Deleted services have raw serviceCategoryId — attach category info manually
          const withCat = dRes.data.Result.map(svc => {
            const catId = toStr(svc.serviceCategoryId);
            const cat   = allCats.find(c => toStr(c._id) === catId);
            return {
              ...svc,
              category: cat
                ? { _id: cat._id, name: cat.name, isDeleted: cat.isDeleted }
                : null
            };
          });
          setDeletedSvcs(withCat);
        }
      } catch (_) {}
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load data');
    } finally { setLoading(false); }
  };

  // Helper — get category name by id
  // MongoDB returns serviceCategoryId as { $oid: "..." } object
  // This helper extracts the plain string id from either format
  // Your serviceList uses $lookup aggregation so each service returns:
  // { serviceName, maximumPrice, description, category: { _id, name } }
  // serviceCategoryId is NOT in the response — use service.category instead
  const toStr = (id) => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.$oid) return id.$oid;
    if (typeof id === 'object' && id.toString) return id.toString();
    return String(id);
  };
  // Get category name directly from joined category object
  const getCatName = (svc) => svc?.category?.name || '—';
  // Get category id from joined category object
  const getCatId = (svc) => toStr(svc?.category?._id);

  // ── OPEN MODAL ─────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, serviceCategoryId: toStr(allCategories[0]?._id) || '' });
    setFormError(''); setFormSuccess(''); setShowModal(true);
  };
  const openEdit = (svc) => {
    setEditItem(svc);
    setForm({ serviceName: svc.serviceName, serviceCategoryId: getCatId(svc), maximumPrice: String(svc.maximumPrice), description: svc.description || '' });
    setFormError(''); setFormSuccess(''); setShowModal(true);
  };

  // ── SAVE ───────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.serviceName.trim())     { setFormError('Service name is required'); return; }
    if (form.serviceName.trim().length < 2) { setFormError('Name must be at least 2 characters'); return; }
    if (!form.serviceCategoryId)      { setFormError('Please select a category'); return; }
    if (!form.maximumPrice)           { setFormError('Maximum price is required'); return; }
    if (isNaN(form.maximumPrice) || Number(form.maximumPrice) <= 0) { setFormError('Price must be a positive number'); return; }

    setSaving(true);
    try {
      let res;
      if (editItem) {
        // PUT /Service/Update — { _id, serviceName, serviceCategoryId, maximumPrice, description }
        res = await updateService({ _id: editItem._id, ...form, maximumPrice: Number(form.maximumPrice) });
      } else {
        // POST /Service/Create — { serviceName, serviceCategoryId, maximumPrice, description }
        res = await createService({ ...form, maximumPrice: Number(form.maximumPrice) });
      }

      if (res.data.Status === 'OK') {
        setFormSuccess(editItem ? '✅ Service updated!' : '✅ Service created!');
        fetchAll();
        setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 1500);
      } else {
        setFormError(res.data.Result);
      }
    } catch (err) {
      setFormError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  // ── DELETE ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await deleteService(toStr(id));
      if (res.data.Status === 'OK') {
        setDeleteConfirm(null);
        await fetchAll(); // ← refetch everything so deleted section updates instantly
      } else {
        alert(res.data.Result);
      }
    } catch (err) {
      alert(err?.response?.data?.Result || 'Delete failed');
    }
  };

  // ── RECOVER ────────────────────────────────────────────
  const handleRecover = async (id) => {
    try {
      const res = await recoverService(toStr(id));
      if (res.data.Status === 'OK') {
        fetchAll();
      } else {
        setRecoverError(res.data.Result); // show error modal not alert
      }
    } catch (err) {
      setRecoverError(err?.response?.data?.Result || 'Recover failed');
    }
  };

  // Filter by search + category
  // filterCat is plain string from dropdown value (already toStr'd)
  // s.serviceCategoryId is { $oid: "..." } from MongoDB — toStr extracts plain string
  const displayList = showDeleted ? deletedServices : services;
  const filtered = displayList.filter(s => {
    const matchSearch = !search || s.serviceName?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !filterCat || getCatId(s) === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Services 🔧</div>
          <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>{services.length} services total</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40 }}>
            <span style={{ opacity: 0.4 }}>🔍</span>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: 150 }}
              placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Filter by category */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40 }}>
            <select style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, cursor: 'pointer' }}
              value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="" style={{ background: '#0D1117' }}>All Categories</option>
              {categories.map(c => <option key={toStr(c._id)} value={toStr(c._id)} style={{ background: '#0D1117' }}>{c.name}</option>)}
            </select>
          </div>
          {/* Active / Deleted toggle */}
          <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => setShowDeleted(false)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !showDeleted ? '#FF4D4D' : 'transparent', color: !showDeleted ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
              ✅ Active
            </button>
            <button onClick={() => setShowDeleted(true)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: showDeleted ? '#EF4444' : 'transparent', color: showDeleted ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
              🗑️ Deleted {deletedServices.length > 0 && `(${deletedServices.length})`}
            </button>
          </div>
          {!showDeleted && (
            <button onClick={openAdd} style={{ background: '#FF4D4D', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
              + Add Service
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {showDeleted && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>Showing Deleted Services</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Click Recover to restore a service</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading services...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{search || filterCat ? 'No services match your filters' : 'No services yet'}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Click "+ Add Service" to create your first one</div>
        </div>
      ) : (

        /* ── SERVICES TABLE ── */
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Service Name', 'Category', 'Max Price', 'Description', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((svc, i) => (
                <tr key={svc._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: '#555A66', fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{svc.serviceName}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {getCatName(svc) !== '—' ? (
                      <span style={{
                        background: svc.category?.isDeleted ? 'rgba(239,68,68,0.12)' : 'rgba(255,77,77,0.12)',
                        border: `1px solid ${svc.category?.isDeleted ? 'rgba(239,68,68,0.4)' : 'rgba(255,77,77,0.25)'}`,
                        borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                        color: svc.category?.isDeleted ? '#F87171' : '#FF6B6B'
                      }}>
                        {svc.category?.isDeleted ? '🗑️ ' : ''}{getCatName(svc)}
                        {svc.category?.isDeleted && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>(deleted)</span>}
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                        ⚠️ No Category
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 800, color: '#4ADE80' }}>
                    ₹{Number(svc.maximumPrice).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: '#9CA3AF', maxWidth: 200 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {svc.description || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!showDeleted ? (
                        <>
                          <button onClick={() => openEdit(svc)}
                            style={{ height: 32, padding: '0 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(svc)}
                            style={{ height: 32, padding: '0 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#F87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                            🗑️
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleRecover(svc._id)}
                          style={{ height: 32, padding: '0 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, color: '#4ADE80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                          ♻️ Recover
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.25)', borderRadius: 20, padding: 32, width: 460, fontFamily: "'Syne',sans-serif", maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{editItem ? '✏️ Edit Service' : '➕ Add Service'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {formError   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {formError}</div>}
            {formSuccess && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{formSuccess}</div>}

            {/* Service Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>SERVICE NAME *</label>
              <div style={S.inp('serviceName', focused)}>
                <input style={S.input} placeholder="e.g. Pipe Leak Fix"
                  value={form.serviceName} onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                  onFocus={() => setFocused('serviceName')} onBlur={() => setFocused('')} />
              </div>
            </div>

            {/* Category dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>CATEGORY *</label>
              <div style={S.inp('serviceCategoryId', focused)}>
                <select style={S.select} value={form.serviceCategoryId}
                  onChange={e => setForm(f => ({ ...f, serviceCategoryId: e.target.value }))}
                  onFocus={() => setFocused('serviceCategoryId')} onBlur={() => setFocused('')}>
                  <option value="" style={{ background: '#0a0d12' }}>-- Select Category --</option>
                  {allCategories.map(c => (
                    <option key={toStr(c._id)} value={toStr(c._id)} style={{ background: '#0a0d12' }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Maximum Price */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>MAXIMUM PRICE (₹) *</label>
              <div style={S.inp('maximumPrice', focused)}>
                <span style={{ fontSize: 13, color: '#555A66', fontWeight: 700 }}>₹</span>
                <input style={S.input} type="number" placeholder="e.g. 1500" min="1"
                  value={form.maximumPrice} onChange={e => setForm(f => ({ ...f, maximumPrice: e.target.value }))}
                  onFocus={() => setFocused('maximumPrice')} onBlur={() => setFocused('')} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>DESCRIPTION</label>
              <textarea style={S.textarea} placeholder="Brief description of this service..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, height: 46, background: saving ? '#333' : '#FF4D4D', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(255,77,77,0.4)' }}>
                {saving ? '⏳ Saving...' : editItem ? '✅ Update Service' : '➕ Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 32, width: 380, fontFamily: "'Syne',sans-serif" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 8 }}>Delete Service?</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: '#FF6B6B' }}>{deleteConfirm.serviceName}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm._id)}
                style={{ flex: 1, height: 46, background: '#EF4444', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOVER ERROR MODAL ── */}
      {recoverError && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setRecoverError('')}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: 32, width: 400, fontFamily: "'Syne',sans-serif" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#F87171', textAlign: 'center', marginBottom: 12 }}>
              Cannot Recover Service
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.7, marginBottom: 8 }}>
              {recoverError}
            </div>
            <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 24, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 600 }}>
                💡 Go to <strong>Service Categories → Deleted tab</strong> and recover the category first
              </span>
            </div>
            <button onClick={() => setRecoverError('')}
              style={{ width: '100%', height: 46, background: '#EF4444', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
