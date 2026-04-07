import React, { useState, useEffect, useRef } from 'react';
import {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  recoverServiceCategory,
} from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// ServiceCategoryPage
// GET  /ServiceCategory/List     → active categories
// GET  /ServiceCategory/DeletedList → deleted categories (add to backend)
// POST /ServiceCategory/Create   → { name, description, base64Data }
// PUT  /ServiceCategory/Update   → { _id, name, description, base64Data }
// PUT  /ServiceCategory/Delete   → { id }
// PUT  /ServiceCategory/Recover  → { id }  ← new
// ─────────────────────────────────────────────────────────────────────────────

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const emptyForm = { name: '', description: '', base64Data: '' };

const S = {
  label:    { fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 5, display: 'block' },
  inp: (f, focused) => ({
    display: 'flex', alignItems: 'center', gap: 10, background: '#0a0d12',
    borderRadius: 10, padding: '0 14px', height: 46,
    border: `1.5px solid ${focused === f ? '#FF4D4D44' : 'rgba(255,255,255,0.08)'}`,
    boxShadow: focused === f ? '0 0 0 3px rgba(255,77,77,0.1)' : 'none', transition: 'all 0.2s',
  }),
  input:    { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13 },
  textarea: { width: '100%', background: '#0a0d12', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
};

export default function ServiceCategoryPage() {
  const [categories, setCategories]         = useState([]);
  const [deletedCategories, setDeleted]     = useState([]);
  const [showDeleted, setShowDeleted]       = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [showModal, setShowModal]           = useState(false);
  const [editItem, setEditItem]             = useState(null);
  const [form, setForm]                     = useState(emptyForm);
  const [formError, setFormError]           = useState('');
  const [formSuccess, setFormSuccess]       = useState('');
  const [saving, setSaving]                 = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [recoverConfirm, setRecoverConfirm] = useState(null);
  const [focused, setFocused]               = useState('');
  const [search, setSearch]                 = useState('');
  const fileRef = useRef();

  useEffect(() => {
    fetchCategories();
    const interval = setInterval(fetchCategories, 60000);
    return () => clearInterval(interval);
  }, []);

  // imageUrl is a server path like /Content/Images/xxx.png
  const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const imgSrc = (cat) => {
    if (cat.base64Data && cat.base64Data.startsWith('data:image')) return cat.base64Data;
    if (cat.imageUrl) return `${BASE}${cat.imageUrl}`;
    return null;
  };

  const fetchCategories = async () => {
    setLoading(true); setError('');
    try {
      // Fetch active categories
      const res = await getServiceCategories();
      if (res.data.Status === 'OK') setCategories(res.data.Result);

      // Fetch deleted categories from backend
      // Make sure you add GET /ServiceCategory/DeletedList to your backend
      try {
        const api = (await import('../utils/api')).default;
        const dRes = await api.get('/ServiceCategory/DeletedList');
        if (dRes.data.Status === 'OK') setDeleted(dRes.data.Result);
      } catch (_) {
        // DeletedList route not added yet — filter from active list won't work
        // but recover UI will still show if manually toggled
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load categories');
    } finally { setLoading(false); }
  };

  const openAdd  = () => { setEditItem(null); setForm(emptyForm); setFormError(''); setFormSuccess(''); setShowModal(true); };
  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || '', base64Data: cat.base64Data || cat.imageUrl ? '' : '' });
    setFormError(''); setFormSuccess(''); setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFormError('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, base64Data: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.name.trim())           { setFormError('Category name is required'); return; }
    if (form.name.trim().length < 2) { setFormError('Name must be at least 2 characters'); return; }
    setSaving(true);
    try {
      const res = editItem
        ? await updateServiceCategory({ _id: toStr(editItem._id), ...form })
        : await createServiceCategory(form);
      if (res.data.Status === 'OK') {
        setFormSuccess(editItem ? '✅ Category updated!' : '✅ Category created!');
        fetchCategories();
        setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 1500);
      } else { setFormError(res.data.Result); }
    } catch (err) {
      setFormError(err?.response?.data?.Result || 'Something went wrong');
    } finally { setSaving(false); }
  };

  // ── DELETE ─────────────────────────────────────────────
  const handleDelete = async (cat) => {
    try {
      const res = await deleteServiceCategory(toStr(cat._id));
      if (res.data.Status === 'OK') {
        setCategories(prev => prev.filter(c => toStr(c._id) !== toStr(cat._id)));
        setDeleted(prev => [...prev, { ...cat, isDeleted: true }]);
        setDeleteConfirm(null);
      } else { alert(res.data.Result); }
    } catch (err) { alert(err?.response?.data?.Result || 'Delete failed'); }
  };

  // ── RECOVER ────────────────────────────────────────────
  const handleRecover = async (cat) => {
    try {
      const res = await recoverServiceCategory(toStr(cat._id));
      if (res.data.Status === 'OK') {
        setDeleted(prev => prev.filter(c => toStr(c._id) !== toStr(cat._id)));
        setCategories(prev => [...prev, { ...cat, isDeleted: false }]);
        setRecoverConfirm(null);
      } else { alert(res.data.Result); }
    } catch (err) { alert(err?.response?.data?.Result || 'Recover failed'); }
  };

  const displayList = showDeleted ? deletedCategories : categories;
  const filtered    = displayList.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Service Categories 🗂️</div>
          <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>
            {categories.length} active · {deletedCategories.length} deleted
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 14px', height: 40 }}>
            <span style={{ opacity: 0.4 }}>🔍</span>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13, width: 160 }}
              placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Toggle Active / Deleted */}
          <div style={{ display: 'flex', background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => setShowDeleted(false)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: !showDeleted ? '#FF4D4D' : 'transparent', color: !showDeleted ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
              ✅ Active
            </button>
            <button onClick={() => setShowDeleted(true)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: 'pointer', background: showDeleted ? '#EF4444' : 'transparent', color: showDeleted ? '#fff' : '#555A66', transition: 'all 0.2s' }}>
              🗑️ Deleted {deletedCategories.length > 0 && `(${deletedCategories.length})`}
            </button>
          </div>

          {!showDeleted && (
            <button onClick={openAdd}
              style={{ background: '#FF4D4D', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", boxShadow: '0 4px 16px rgba(255,77,77,0.3)' }}>
              + Add Category
            </button>
          )}
        </div>
      </div>

      {/* ── DELETED BANNER ── */}
      {showDeleted && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>Showing Deleted Categories</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Click Recover to restore a category and all its services</div>
          </div>
        </div>
      )}

      {error && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555A66' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{showDeleted ? '🗑️' : '🗂️'}</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {showDeleted ? 'No deleted categories' : search ? 'No categories match your search' : 'No categories yet'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((cat) => (
            <div key={toStr(cat._id)} style={{ background: '#0D1117', border: `1px solid ${showDeleted ? 'rgba(239,68,68,0.2)' : 'rgba(255,77,77,0.1)'}`, borderRadius: 16, overflow: 'hidden', opacity: showDeleted ? 0.85 : 1 }}>

              {/* Image */}
              <div style={{ height: 140, background: 'linear-gradient(135deg,#0f0505,#1a0808)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {imgSrc(cat)
                  ? <img src={imgSrc(cat)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : <div style={{ fontSize: 48 }}>🗂️</div>
                }
                {/* Deleted overlay */}
                {showDeleted && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32 }}>🗑️</span>
                  </div>
                )}
              </div>

              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: showDeleted ? '#9CA3AF' : '#fff', marginBottom: 6, textDecoration: showDeleted ? 'line-through' : 'none' }}>{cat.name}</div>
                {cat.description && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.6 }}>{cat.description}</div>}

                <div style={{ display: 'flex', gap: 8 }}>
                  {!showDeleted ? (
                    <>
                      <button onClick={() => openEdit(cat)}
                        style={{ flex: 1, height: 36, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, color: '#60A5FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(cat)}
                        style={{ flex: 1, height: 36, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#F87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setRecoverConfirm(cat)}
                      style={{ flex: 1, height: 36, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, color: '#4ADE80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                      ♻️ Recover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.25)', borderRadius: 20, padding: 32, width: 460, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{editItem ? '✏️ Edit Category' : '➕ Add Category'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {formError   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {formError}</div>}
            {formSuccess && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{formSuccess}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>CATEGORY NAME *</label>
              <div style={S.inp('name', focused)}>
                <input style={S.input} placeholder="e.g. Plumbing" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>DESCRIPTION</label>
              <textarea style={S.textarea} placeholder="Brief description..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>CATEGORY IMAGE</label>
              {form.base64Data ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120, marginBottom: 8 }}>
                  <img src={form.base64Data} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setForm(f => ({ ...f, base64Data: '' }))}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div onClick={() => fileRef.current.click()}
                  style={{ border: '2px dashed rgba(255,77,77,0.3)', borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,77,77,0.04)' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Click to upload image</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, height: 46, background: saving ? '#333' : '#FF4D4D', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(255,77,77,0.4)' }}>
                {saving ? '⏳ Saving...' : editItem ? '✅ Update' : '➕ Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 32, width: 380 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 8 }}>Delete Category?</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 8, lineHeight: 1.6 }}>
              Deleting <strong style={{ color: '#FF6B6B' }}>{deleteConfirm.name}</strong> will also delete all its services.
            </div>
            <div style={{ fontSize: 12, color: '#FACC15', textAlign: 'center', marginBottom: 24, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              ♻️ You can recover it later from the Deleted tab
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, height: 46, background: '#EF4444', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOVER CONFIRM ── */}
      {recoverConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setRecoverConfirm(null)}>
          <div style={{ background: '#0D1117', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: 32, width: 380 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>♻️</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 8 }}>Recover Category?</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Recovering <strong style={{ color: '#4ADE80' }}>{recoverConfirm.name}</strong> will also restore all its services.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRecoverConfirm(null)}
                style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleRecover(recoverConfirm)}
                style={{ flex: 1, height: 46, background: '#22C55E', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ♻️ Yes, Recover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
