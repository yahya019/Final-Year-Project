import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminForgotPassword } from '../utils/api';

const S = {
  page: { minHeight:'100vh', background:'#080B0F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", position:'relative', overflow:'hidden' },
  glow1: { position:'fixed', top:-200, left:-200, width:600, height:600, background:'radial-gradient(circle,rgba(255,77,77,0.12) 0%,transparent 70%)', pointerEvents:'none' },
  glow2: { position:'fixed', bottom:-200, right:-200, width:500, height:500, background:'radial-gradient(circle,rgba(255,77,77,0.08) 0%,transparent 70%)', pointerEvents:'none' },
  grid:  { position:'fixed', inset:0, opacity:0.4, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px' },
  card:  { display:'flex', width:900, minHeight:540, borderRadius:24, border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.8)', position:'relative', zIndex:10 },
  left:  { flex:1, background:'linear-gradient(135deg,#0f0505 0%,#1a0808 50%,#0a0d12 100%)', padding:'50px 40px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' },
  leftGlow: { position:'absolute', top:-80, right:-80, width:300, height:300, background:'radial-gradient(circle,rgba(255,77,77,0.15),transparent 70%)' },
  brandRow: { display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:1 },
  brandBox: { width:52, height:52, background:'#FF4D4D', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, boxShadow:'0 0 24px rgba(255,77,77,0.5)' },
  brandName:{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:-1 },
  brandTag: { fontSize:11, fontWeight:700, color:'#FF4D4D', letterSpacing:2, marginTop:2 },
  leftTitle:{ fontSize:32, fontWeight:900, color:'#fff', lineHeight:1.25, letterSpacing:-1, marginBottom:12, position:'relative', zIndex:1 },
  leftSub:  { fontSize:13, color:'#9CA3AF', lineHeight:1.8, position:'relative', zIndex:1 },
  statsRow: { display:'flex', gap:14, position:'relative', zIndex:1 },
  statPill: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 16px' },
  statVal:  { fontSize:18, fontWeight:900, color:'#fff' },
  statLbl:  { fontSize:10, color:'#555A66', marginTop:2, fontWeight:600, letterSpacing:0.5 },
  right:    { width:380, background:'#0D1117', padding:'44px 38px', display:'flex', flexDirection:'column', justifyContent:'center', borderLeft:'1px solid rgba(255,255,255,0.06)' },
  eyebrow:  { fontSize:10, fontWeight:800, color:'#FF4D4D', letterSpacing:2, marginBottom:10 },
  title:    { fontSize:26, fontWeight:900, color:'#fff', letterSpacing:-0.8, marginBottom:4 },
  sub:      { fontSize:12, color:'#555A66', marginBottom:28 },
  fieldWrap:{ marginBottom:14 },
  fieldLabel:{ fontSize:10, fontWeight:700, color:'#555A66', letterSpacing:1, marginBottom:6 },
  fieldInp: (f) => ({ display:'flex', alignItems:'center', gap:10, background:'#0a0d12', borderRadius:10, padding:'0 14px', height:48, border:`1.5px solid ${f?'#FF4D4D44':'rgba(255,255,255,0.08)'}`, boxShadow:f?'0 0 0 3px rgba(255,77,77,0.1)':'none', transition:'all 0.2s' }),
  input:    { flex:1, background:'transparent', border:'none', outline:'none', color:'#E8EAF0', fontFamily:"'Syne',sans-serif", fontSize:13 },
  showBtn:  { fontSize:11, color:'#FF4D4D', fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:"'Syne',sans-serif" },
  rememberRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  checkbox: (c) => ({ width:16, height:16, borderRadius:4, cursor:'pointer', background:c?'#FF4D4D':'#0a0d12', border:`1.5px solid ${c?'#FF4D4D':'rgba(255,77,77,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' }),
  loginBtn: (l) => ({ background:l?'#333':'#FF4D4D', borderRadius:10, height:50, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', cursor:l?'not-allowed':'pointer', boxShadow:l?'none':'0 4px 20px rgba(255,77,77,0.4)', border:'none', width:'100%', fontFamily:"'Syne',sans-serif", transition:'all 0.2s' }),
  alertBox: (t) => ({ background:t==='error'?'#2A1222':'#1A2A1A', border:`1px solid ${t==='error'?'rgba(239,68,68,0.2)':'rgba(74,222,128,0.2)'}`, borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:14 }),
  alertTxt: (t) => ({ fontSize:12, fontWeight:600, color:t==='error'?'#F87171':'#4ADE80' }),
  version:  { fontSize:10, color:'#2a2a2a', textAlign:'center', marginTop:18, fontFamily:"'JetBrains Mono',monospace" },
  modalOverlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 },
  modalBox:    { background:'#0D1117', border:'1px solid rgba(255,77,77,0.3)', borderRadius:16, padding:32, width:360, fontFamily:"'Syne',sans-serif" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [Email, setEmail]       = useState('');
  const [Password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [focused, setFocused]   = useState('');

  const [forgotOpen, setForgotOpen]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotMsg, setForgotMsg]         = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!Email)    { setError('Email is required');    return; }
    if (!Password) { setError('Password is required'); return; }
    setLoading(true); setError(''); setSuccess(false);
    try {
      await login(Email, Password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotMsg('Please enter your email'); return; }
    setForgotLoading(true); setForgotMsg('');
    try {
      const res = await adminForgotPassword(forgotEmail);
      if (res.data.Status === 'OK') setForgotMsg('✅ ' + res.data.Result);
      else setForgotMsg('❌ ' + res.data.Result);
    } catch {
      setForgotMsg('❌ Something went wrong. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.glow1}/><div style={S.glow2}/><div style={S.grid}/>
      <div style={S.card}>

        {/* ── LEFT PANEL ── */}
        <div style={S.left}>
          <div style={S.leftGlow}/>
          <div style={S.brandRow}>
            <div style={S.brandBox}>⚡</div>
            <div>
              <div style={S.brandName}>FixIt</div>
              <div style={S.brandTag}>ADMIN PANEL</div>
            </div>
          </div>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={S.leftTitle}>Control your<br/><span style={{color:'#FF4D4D'}}>entire platform</span><br/>from here.</div>
            <div style={S.leftSub}>Manage bookings, servicemen, settlements,<br/>reviews and complaints — all in one place.</div>
          </div>
          <div style={S.statsRow}>
            <div style={S.statPill}><div style={S.statVal}>1,284</div><div style={S.statLbl}>BOOKINGS</div></div>
            <div style={S.statPill}><div style={S.statVal}>₹4.2L</div><div style={S.statLbl}>THIS MONTH</div></div>
            <div style={S.statPill}><div style={S.statVal}>98</div><div style={S.statLbl}>SERVICEMEN</div></div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={S.right}>
          <div style={S.eyebrow}>ADMIN ACCESS</div>
          <div style={S.title}>Welcome back 👋</div>
          <div style={S.sub}>Sign in to your admin dashboard</div>

          {error && (
            <div style={S.alertBox('error')}>
              <span>⚠️</span><span style={S.alertTxt('error')}>{error}</span>
            </div>
          )}
          {success && (
            <div style={S.alertBox('success')}>
              <span>✅</span><span style={S.alertTxt('success')}>Login successful! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={S.fieldWrap}>
              <div style={S.fieldLabel}>EMAIL ADDRESS</div>
              <div style={S.fieldInp(focused==='email')}>
                <span style={{fontSize:15,opacity:0.5}}>✉️</span>
                <input style={S.input} type="email" placeholder="admin@fixit.com"
                  value={Email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                />
              </div>
            </div>
            <div style={S.fieldWrap}>
              <div style={S.fieldLabel}>PASSWORD</div>
              <div style={S.fieldInp(focused==='pass')}>
                <span style={{fontSize:15,opacity:0.5}}>🔒</span>
                <input style={S.input} type={showPass?'text':'password'} placeholder="••••••••••"
                  value={Password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
                />
                <button type="button" style={S.showBtn} onClick={() => setShowPass(p=>!p)}>
                  {showPass?'Hide':'Show'}
                </button>
              </div>
            </div>
            <div style={S.rememberRow}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={S.checkbox(remember)} onClick={() => setRemember(r=>!r)}>{remember && '✓'}</div>
                <span style={{fontSize:12,color:'#555A66'}}>Remember me</span>
              </div>
              <span style={{fontSize:12,color:'#FF4D4D',fontWeight:600,cursor:'pointer'}}
                onClick={() => { setForgotOpen(true); setForgotMsg(''); setForgotEmail(''); }}>
                Forgot password?
              </span>
            </div>
            <button type="submit" style={S.loginBtn(loading)} disabled={loading}>
              {loading ? '⏳ Signing in...' : 'Sign In to Dashboard →'}
            </button>
          </form>

          {/* ── INFO BOX — replaces OTP button ── */}
          <div style={{ marginTop:20, background:'rgba(255,77,77,0.06)', border:'1px solid rgba(255,77,77,0.15)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.7 }}>
              🔑 <strong style={{color:'#FF6B6B'}}>New admin?</strong> Ask your Super Admin to create your account. Your password will be sent to your email automatically.
            </div>
          </div>

          <div style={S.version}>FixIt Admin v1.0.0 · Secured Access</div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {forgotOpen && (
        <div style={S.modalOverlay} onClick={() => setForgotOpen(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:20,fontWeight:900,color:'#fff',marginBottom:6}}>Forgot Password 🔑</div>
            <div style={{fontSize:12,color:'#555A66',marginBottom:20}}>
              Enter your admin email. A new password will be sent to your inbox instantly.
            </div>
            <div style={{...S.fieldInp(focused==='forgot'), marginBottom:14}}>
              <span style={{fontSize:15,opacity:0.5}}>✉️</span>
              <input style={S.input} type="email" placeholder="admin@fixit.com"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                onFocus={() => setFocused('forgot')} onBlur={() => setFocused('')}
              />
            </div>
            {forgotMsg && (
              <div style={{fontSize:12,color:forgotMsg.startsWith('✅')?'#4ADE80':'#F87171',marginBottom:12,fontWeight:600}}>
                {forgotMsg}
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setForgotOpen(false)}
                style={{flex:1,height:44,background:'#0a0d12',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'#9CA3AF',fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleForgotPassword} disabled={forgotLoading}
                style={{flex:2,height:44,background:'#FF4D4D',border:'none',borderRadius:10,color:'#fff',fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(255,77,77,0.4)'}}>
                {forgotLoading ? '⏳ Sending...' : 'Send New Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
