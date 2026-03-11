import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminList, adminSignUp, adminChangeStatus } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// AdminListPage
// - GET  /Admin/AdminList          → shows all admins
// - POST /Admin/SignUp             → Super Admin only — creates new admin
//                                    backend auto-generates password + sends email
// - PUT  /Admin/ChangeStatus       → activate / deactivate admin
// ─────────────────────────────────────────────────────────────────────────────

const ROLES   = ['Super Admin', 'Sub Admin', 'Manager'];
const STATUSES = ['Active', 'Inactive'];

const emptyForm = { Name:'', Email:'', ContactNo:'', Role:'Sub Admin', Status:'Active' };

export default function AdminListPage() {
  const { admin: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.Role === 'Super Admin';

  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving]       = useState(false);
  const [focused, setFocused]     = useState('');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await getAdminList();
      if (res.data.Status === 'OK') setAdmins(res.data.Result);
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  // ── ADD NEW ADMIN ──────────────────────────────────────
  const handleAddAdmin = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.Name)      { setFormError('Name is required');                  return; }
    if (!form.Email)     { setFormError('Email is required');                 return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) { setFormError('Invalid email format'); return; }
    if (!form.ContactNo) { setFormError('Contact number is required');        return; }
    if (!/^[0-9]{10}$/.test(form.ContactNo)) { setFormError('Contact must be 10 digits'); return; }

    setSaving(true);
    try {
      // POST /Admin/SignUp — backend auto-generates password and sends to email
      const res = await adminSignUp(form);
      if (res.data.Status === 'OK') {
        setFormSuccess(`✅ Admin created! Password sent to ${form.Email}`);
        setForm(emptyForm);
        fetchAdmins(); // refresh list
        setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 2500);
      } else {
        setFormError(res.data.Result);
      }
    } catch (err) {
      setFormError(err?.response?.data?.Result || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // ── TOGGLE STATUS ──────────────────────────────────────
  const handleToggleStatus = async (admin) => {
    if (!isSuperAdmin) return;
    const newStatus = admin.Status === 'Active' ? 'Inactive' : 'Active';
    try {
      await adminChangeStatus(admin._id, newStatus);
      setAdmins(prev => prev.map(a => a._id === admin._id ? { ...a, Status: newStatus } : a));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const roleColor = (role) => {
    if (role === 'Super Admin') return { bg:'rgba(255,77,77,0.15)',   border:'rgba(255,77,77,0.3)',   color:'#FF6B6B' };
    if (role === 'Sub Admin')   return { bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.3)',  color:'#60A5FA' };
    return                             { bg:'rgba(250,204,21,0.15)',  border:'rgba(250,204,21,0.3)',  color:'#FACC15' };
  };

  const inp = (f) => ({
    display:'flex', alignItems:'center', gap:10, background:'#0a0d12', borderRadius:10,
    padding:'0 14px', height:46,
    border:`1.5px solid ${focused===f?'#FF4D4D44':'rgba(255,255,255,0.08)'}`,
    boxShadow: focused===f?'0 0 0 3px rgba(255,77,77,0.1)':'none', transition:'all 0.2s',
  });
  const inputStyle = { flex:1, background:'transparent', border:'none', outline:'none', color:'#E8EAF0', fontFamily:"'Syne',sans-serif", fontSize:13 };
  const selectStyle = { ...inputStyle, cursor:'pointer' };
  const labelStyle = { fontSize:10, fontWeight:700, color:'#555A66', letterSpacing:1, marginBottom:5, display:'block' };

  return (
    <div style={{ fontFamily:"'Syne',sans-serif", color:'#E8EAF0' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:-0.5 }}>Admin List 👥</div>
          <div style={{ fontSize:12, color:'#555A66', marginTop:4 }}>
            {admins.length} admin{admins.length !== 1 ? 's' : ''} registered
          </div>
        </div>

        {/* Only Super Admin sees Add Admin button */}
        {isSuperAdmin ? (
          <button onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); setForm(emptyForm); }}
            style={{ background:'#FF4D4D', border:'none', borderRadius:10, padding:'10px 20px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(255,77,77,0.3)', fontFamily:"'Syne',sans-serif" }}>
            + Add New Admin
          </button>
        ) : (
          <div style={{ fontSize:12, color:'#555A66', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 14px' }}>
            🔒 Only Super Admin can add new admins
          </div>
        )}
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{ background:'#2A1222', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', color:'#F87171', fontSize:13, marginBottom:16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#555A66', fontSize:14 }}>Loading admins...</div>
      ) : (

        /* ── ADMIN CARDS GRID ── */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {admins.map((admin) => {
            const rc = roleColor(admin.Role);
            const initials = admin.Name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
            return (
              <div key={admin._id} style={{ background:'#0D1117', border:'1px solid rgba(255,77,77,0.1)', borderRadius:16, padding:22, position:'relative' }}>

                {/* Status dot */}
                <div style={{ position:'absolute', top:18, right:18, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: admin.Status==='Active'?'#4ADE80':'#555A66' }}/>
                  <span style={{ fontSize:11, color: admin.Status==='Active'?'#4ADE80':'#555A66', fontWeight:600 }}>{admin.Status}</span>
                </div>

                {/* Avatar + Name */}
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,77,77,0.15)', border:'2px solid rgba(255,77,77,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#FF6B6B', flexShrink:0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>{admin.Name}</div>
                    <div style={{ fontSize:11, color:'#555A66', marginTop:2 }}>{admin.Email}</div>
                  </div>
                </div>

                {/* Role badge */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:rc.bg, border:`1px solid ${rc.border}`, borderRadius:999, padding:'4px 12px', fontSize:11, fontWeight:700, color:rc.color, marginBottom:14 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:rc.color, display:'inline-block' }}/>
                  {admin.Role}
                </div>

                {/* Details */}
                <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:16 }}>
                  📞 {admin.ContactNo}
                </div>

                {/* Toggle status — Super Admin only, can't deactivate themselves */}
                {isSuperAdmin && admin._id !== currentAdmin?._id && (
                  <button onClick={() => handleToggleStatus(admin)}
                    style={{ width:'100%', height:36, background: admin.Status==='Active'?'rgba(239,68,68,0.1)':'rgba(74,222,128,0.1)', border:`1px solid ${admin.Status==='Active'?'rgba(239,68,68,0.2)':'rgba(74,222,128,0.2)'}`, borderRadius:8, color: admin.Status==='Active'?'#F87171':'#4ADE80', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
                    {admin.Status==='Active' ? '🔴 Deactivate' : '🟢 Activate'}
                  </button>
                )}
                {admin._id === currentAdmin?._id && (
                  <div style={{ fontSize:11, color:'#555A66', textAlign:'center', paddingTop:4 }}>— Your account —</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD ADMIN MODAL ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background:'#0D1117', border:'1px solid rgba(255,77,77,0.25)', borderRadius:20, padding:32, width:440, fontFamily:"'Syne',sans-serif", maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>Add New Admin ➕</div>
              <button onClick={() => setShowModal(false)}
                style={{ background:'none', border:'none', color:'#555A66', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'#555A66', marginBottom:24, lineHeight:1.6 }}>
              A password will be <strong style={{color:'#FF6B6B'}}>auto-generated and sent</strong> to the admin's email. They can change it after first login.
            </div>

            {/* Alerts */}
            {formError && (
              <div style={{ background:'#2A1222', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', color:'#F87171', fontSize:12, fontWeight:600, marginBottom:14, display:'flex', gap:8 }}>
                ⚠️ {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background:'#1A2A1A', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8, padding:'10px 14px', color:'#4ADE80', fontSize:12, fontWeight:600, marginBottom:14 }}>
                {formSuccess}
              </div>
            )}

            {/* Form fields */}
            {[
              { key:'Name',      label:'FULL NAME',        type:'text',  placeholder:'e.g. Rahul Sharma'      },
              { key:'Email',     label:'EMAIL ADDRESS',    type:'email', placeholder:'admin@fixit.com'        },
              { key:'ContactNo', label:'CONTACT NUMBER',   type:'text',  placeholder:'10-digit mobile number' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={labelStyle}>{label}</label>
                <div style={inp(key)}>
                  <input style={inputStyle} type={type} placeholder={placeholder}
                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    onFocus={() => setFocused(key)} onBlur={() => setFocused('')}
                  />
                </div>
              </div>
            ))}

            {/* Role dropdown */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>ROLE</label>
              <div style={inp('Role')}>
                <select style={selectStyle} value={form.Role}
                  onChange={e => setForm(f => ({ ...f, Role: e.target.value }))}
                  onFocus={() => setFocused('Role')} onBlur={() => setFocused('')}>
                  {ROLES.map(r => <option key={r} value={r} style={{background:'#0a0d12'}}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Status dropdown */}
            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>STATUS</label>
              <div style={inp('Status')}>
                <select style={selectStyle} value={form.Status}
                  onChange={e => setForm(f => ({ ...f, Status: e.target.value }))}
                  onFocus={() => setFocused('Status')} onBlur={() => setFocused('')}>
                  {STATUSES.map(s => <option key={s} value={s} style={{background:'#0a0d12'}}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex:1, height:46, background:'#0a0d12', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#9CA3AF', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAddAdmin} disabled={saving}
                style={{ flex:2, height:46, background: saving?'#333':'#FF4D4D', border:'none', borderRadius:10, color:'#fff', fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, cursor: saving?'not-allowed':'pointer', boxShadow: saving?'none':'0 4px 16px rgba(255,77,77,0.4)', transition:'all 0.2s' }}>
                {saving ? '⏳ Creating...' : '➕ Create Admin & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
