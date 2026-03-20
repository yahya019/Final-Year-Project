import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminChangePassword, getServicemen, getServicemanServices, getAllBookings, getComplaints, getCommissions } from '../utils/api';

const NAV_ITEMS = [
  { path: 'dashboard',  icon: '⚡', label: 'Dashboard'  },
  { path: 'bookings',   icon: '📋', label: 'Bookings',   badgeKey: 'pendingBookings'   },
  { path: 'approvals',  icon: '✅', label: 'Approvals',  badgeKey: 'pendingApprovals'  },
  { path: 'workers',    icon: '🔧', label: 'Workers',    badgeKey: 'pendingWorkers'    },
  { path: 'customers',  icon: '👥', label: 'Customers'  },
  { path: 'reviews',    icon: '⭐', label: 'Reviews',    badgeKey: 'openComplaints'    },
  { path: 'settlement', icon: '💸', label: 'Settlement', badgeKey: 'pendingSettlements'},
  { path: 'categories', icon: '🗂️', label: 'Categories' },
  { path: 'services',   icon: '🛠️', label: 'Services'   },
  { path: 'admins',     icon: '🛡️', label: 'Admins'     },
];

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ admin, onClose }) {
  const [form, setForm]       = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]       = useState({ old: false, new: false, confirm: false });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving]   = useState(false);
  const [focused, setFocused] = useState('');

  const inp = (f) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#0a0d12', borderRadius: 10, padding: '0 14px', height: 46,
    border: `1.5px solid ${focused === f ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.08)'}`,
    boxShadow: focused === f ? '0 0 0 3px rgba(255,77,77,0.1)' : 'none',
    transition: 'all 0.2s', marginBottom: 14,
  });
  const input = { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontFamily: "'Syne',sans-serif", fontSize: 13 };
  const lbl   = { fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 6, display: 'block' };

  const handleSubmit = async () => {
    setError(''); setSuccess('');

    // ── Validations ──
    if (!form.oldPassword)                          { setError('Old password is required'); return; }
    if (!form.newPassword)                          { setError('New password is required'); return; }
    if (form.newPassword.length < 6)                { setError('New password must be at least 6 characters'); return; }
    if (form.newPassword === form.oldPassword)      { setError('New password must be different from old password'); return; }
    if (form.newPassword !== form.confirmPassword)  { setError('Passwords do not match'); return; }

    setSaving(true);
    try {
      // PUT /Admin/ChangePassword — { _id, OldPassword, NewPassword }
      const res = await adminChangePassword({
        _id:         admin?._id,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      if (res.data.Status === 'OK') {
        setSuccess('✅ Password changed successfully!');
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => onClose(), 1800);
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Password strength indicator
  const strength = () => {
    const p = form.newPassword;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Weak',   color: '#EF4444' },
      { label: 'Fair',   color: '#F97316' },
      { label: 'Good',   color: '#FACC15' },
      { label: 'Strong', color: '#22C55E' },
    ];
    return levels[score - 1] || levels[0];
  };
  const str = strength();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, fontFamily: "'Syne',sans-serif" }}
      onClick={onClose}>
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.25)', borderRadius: 20, padding: 32, width: 420 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>🔑 Change Password</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555A66', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#555A66', marginBottom: 24 }}>
          Changing password for <span style={{ color: '#FF6B6B', fontWeight: 700 }}>{admin?.Name}</span>
        </div>

        {/* Error / Success */}
        {error   && <div style={{ background: '#2A1222', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#1A2A1A', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', color: '#4ADE80', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{success}</div>}

        {/* Old Password */}
        <label style={lbl}>OLD PASSWORD</label>
        <div style={inp('old')}>
          <span style={{ opacity: 0.4, fontSize: 14 }}>🔒</span>
          <input style={input} type={show.old ? 'text' : 'password'} placeholder="Enter current password"
            value={form.oldPassword} onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
            onFocus={() => setFocused('old')} onBlur={() => setFocused('')} />
          <button type="button" onClick={() => setShow(s => ({ ...s, old: !s.old }))}
            style={{ background: 'none', border: 'none', color: '#FF4D4D', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
            {show.old ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 16px' }} />

        {/* New Password */}
        <label style={lbl}>NEW PASSWORD</label>
        <div style={inp('new')}>
          <span style={{ opacity: 0.4, fontSize: 14 }}>🔐</span>
          <input style={input} type={show.new ? 'text' : 'password'} placeholder="Enter new password"
            value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            onFocus={() => setFocused('new')} onBlur={() => setFocused('')} />
          <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
            style={{ background: 'none', border: 'none', color: '#FF4D4D', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
            {show.new ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Password strength */}
        {str && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ width: 28, height: 4, borderRadius: 99, background: i <= ([{},{},{},{}].indexOf(str) + 1 + (['Weak','Fair','Good','Strong'].indexOf(str.label))) ? str.color : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: str.color }}>{str.label}</span>
          </div>
        )}

        {/* Confirm Password */}
        <label style={lbl}>CONFIRM NEW PASSWORD</label>
        <div style={{ ...inp('confirm'), marginBottom: 24 }}>
          <span style={{ opacity: 0.4, fontSize: 14 }}>✅</span>
          <input style={input} type={show.confirm ? 'text' : 'password'} placeholder="Re-enter new password"
            value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} />
          <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
            style={{ background: 'none', border: 'none', color: '#FF4D4D', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
            {show.confirm ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Match indicator */}
        {form.confirmPassword && (
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: -18, marginBottom: 16, color: form.newPassword === form.confirmPassword ? '#4ADE80' : '#F87171' }}>
            {form.newPassword === form.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 46, background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 2, height: 46, background: saving ? '#333' : '#FF4D4D', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(255,77,77,0.4)' }}>
            {saving ? '⏳ Updating...' : '🔑 Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed]         = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [badges, setBadges]               = useState({});
  const [time, setTime]                   = useState(new Date());

  const currentPage = NAV_ITEMS.find(n => location.pathname.includes(n.path));

  // Clear reviews badge when visiting reviews page
  useEffect(() => {
    if (location.pathname.includes('reviews')) {
      setBadges(prev => ({ ...prev, openComplaints: 0 }));
    }
  }, [location.pathname]);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Fetch badge counts — on mount + every 30s
  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBadges = async () => {
    try {
      const isOnReviews = window.location.pathname.includes('reviews');
      const [workerRes, approvalRes, bookingRes, complaintRes, commissionRes] = await Promise.allSettled([
        getServicemen(),
        getServicemanServices(),
        getAllBookings(),
        isOnReviews ? Promise.resolve({ data: { Status: 'OK', Result: [] } }) : getComplaints(),
        getCommissions(),
      ]);
      setBadges(prev => ({
        pendingWorkers:     workerRes.status     === 'fulfilled' && workerRes.value.data.Status     === 'OK' ? workerRes.value.data.Result.filter(w => w.status === 'Pending').length : 0,
        pendingApprovals:   approvalRes.status   === 'fulfilled' && approvalRes.value.data.Status   === 'OK' ? approvalRes.value.data.Result.filter(a => a.status === 'Pending').length : 0,
        pendingBookings:    bookingRes.status     === 'fulfilled' && bookingRes.value.data.Status    === 'OK' ? bookingRes.value.data.Result.filter(b => b.bookingStatus === 'Pending').length : 0,
        openComplaints:     isOnReviews ? 0 : (complaintRes.status === 'fulfilled' && complaintRes.value.data.Status === 'OK' ? complaintRes.value.data.Result.filter(c => c.status === 'Open').length : prev.openComplaints),
        pendingSettlements: commissionRes.status === 'fulfilled' && commissionRes.value.data.Status === 'OK' ? commissionRes.value.data.Result.filter(c => c.settlementStatus === 'Pending').length : 0,
      }));
    } catch (_) {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080B0F', fontFamily: "'Syne', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: collapsed ? 68 : 220, background: '#0D1117',
        borderRight: '1px solid rgba(255,77,77,0.1)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowX: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#FF4D4D', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '0 0 16px rgba(255,77,77,0.4)' }}>⚡</div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>FixIt</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#FF4D4D', letterSpacing: 2 }}>ADMIN PANEL</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={`/${item.path}`} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px 14px' : '10px 12px',
                  borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                  background: isActive ? 'rgba(255,77,77,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,77,77,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  width: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}>
                  {/* Icon */}
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>

                  {/* Label */}
                  {!collapsed && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#FF6B6B' : '#9CA3AF', whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}

                  {/* Badge — expanded sidebar */}
                  {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                    <span style={{
                      background: '#FF4D4D', color: '#fff', borderRadius: 999,
                      fontSize: 10, fontWeight: 900, padding: '2px 7px',
                      minWidth: 18, textAlign: 'center', lineHeight: '16px',
                      flexShrink: 0,
                    }}>
                      {badges[item.badgeKey] > 99 ? '99+' : badges[item.badgeKey]}
                    </span>
                  )}

                  {/* Badge — collapsed sidebar (top-right corner) */}
                  {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                    <span style={{
                      position: 'absolute', top: 3, right: 3,
                      background: '#FF4D4D', color: '#fff', borderRadius: 999,
                      fontSize: 9, fontWeight: 900, padding: '1px 4px',
                      minWidth: 14, textAlign: 'center', lineHeight: '14px',
                    }}>
                      {badges[item.badgeKey] > 9 ? '9+' : badges[item.badgeKey]}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div onClick={() => setCollapsed(c => !c)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#555A66', fontSize: 12, fontWeight: 600, border: '1px solid transparent', transition: 'all 0.15s', position: 'relative' }}>
            <span style={{ fontSize: 14 }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && 'Collapse'}
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── TOP BAR ── */}
        <div style={{
          height: 64, background: '#0D1117',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0, zIndex: 50,
          gap: 16,
        }}>

          {/* LEFT — Current page breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {currentPage && (
              <>
                <div style={{ width: 36, height: 36, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {currentPage.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>{currentPage.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#555A66' }}>
                    <span>FixIt</span>
                    <span style={{ opacity: 0.4 }}>›</span>
                    <span style={{ color: '#FF6B6B' }}>{currentPage.label}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CENTER — Live clock + date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#E8EAF0', letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div style={{ fontSize: 10, color: '#555A66', whiteSpace: 'nowrap' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* RIGHT — Alerts + Actions + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* Change Password icon button */}
            <button
              onClick={() => setShowChangePwd(true)}
              title="Change Password"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              🔑
            </button>

            {/* Admin Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 12px 5px 6px', flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#FF4D4D,#cc2200)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(255,77,77,0.3)' }}>
                {(admin?.Name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap' }}>{admin?.Name || 'Admin'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: admin?.Role === 'Super Admin' ? '#FACC15' : '#4ADE80', boxShadow: `0 0 4px ${admin?.Role === 'Super Admin' ? '#FACC15' : '#4ADE80'}` }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: admin?.Role === 'Super Admin' ? '#FACC15' : '#4ADE80', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{admin?.Role || 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </div>
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showChangePwd && (
        <ChangePasswordModal
          admin={admin}
          onClose={() => setShowChangePwd(false)}
        />
      )}
    </div>
  );
}
