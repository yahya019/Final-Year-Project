import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import {
  getServiceCategories, getServices, getServicemen,
  getAllBookings, getCustomers, getCommissions, getAllReviews
} from '../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS_COLOR = {
  Pending:    '#FACC15',
  Confirmed:  '#60A5FA',
  InProgress: '#FB923C',
  Completed:  '#4ADE80',
  Cancelled:  '#F87171',
};

function StatCard({ icon, label, value, sub, color, border }) {
  return (
    <div style={{ background: '#0D1117', border: `1px solid ${border || 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || '#fff', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color || '#9CA3AF', marginTop: 4, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState({
    categories: [], services: [], workers: [], bookings: [],
    customers: [], commissions: [], reviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, svcRes, workerRes, bookRes, custRes, commRes, revRes] = await Promise.allSettled([
        getServiceCategories(),
        getServices(),
        getServicemen(),
        getAllBookings(),
        getCustomers(),
        getCommissions(),
        getAllReviews(),
      ]);
      setData({
        categories:  catRes.status  === 'fulfilled' && catRes.value.data.Status  === 'OK' ? catRes.value.data.Result  : [],
        services:    svcRes.status  === 'fulfilled' && svcRes.value.data.Status  === 'OK' ? svcRes.value.data.Result  : [],
        workers:     workerRes.status === 'fulfilled' && workerRes.value.data.Status === 'OK' ? workerRes.value.data.Result : [],
        bookings:    bookRes.status === 'fulfilled' && bookRes.value.data.Status === 'OK' ? bookRes.value.data.Result : [],
        customers:   custRes.status === 'fulfilled' && custRes.value.data.Status === 'OK' ? custRes.value.data.Result : [],
        commissions: commRes.status === 'fulfilled' && commRes.value.data.Status === 'OK' ? commRes.value.data.Result : [],
        reviews:     revRes.status  === 'fulfilled' && revRes.value.data.Status  === 'OK' ? revRes.value.data.Result  : [],
      });
    } catch (_) {}
    finally { setLoading(false); }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const { categories, services, workers, bookings, customers, commissions, reviews } = data;

  const approvedWorkers  = workers.filter(w => w.status === 'Approved').length;
  const pendingWorkers   = workers.filter(w => w.status === 'Pending').length;
  const completedBookings = bookings.filter(b => b.bookingStatus === 'Completed').length;
  const pendingBookings  = bookings.filter(b => b.bookingStatus === 'Pending').length;
  const totalRevenue     = bookings.filter(b => b.bookingStatus === 'Completed').reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const totalCommission  = commissions.filter(c => c.settlementStatus === 'Settled').reduce((s, c) => s + Number(c.commissionAmount || 0), 0);
  const pendingSettlements = commissions.filter(c => c.settlementStatus === 'Pending').length;
  const avgRating        = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  // ── Booking status chart ─────────────────────────────────────────────────
  const bookingStatusData = ['Pending','Confirmed','InProgress','Completed','Cancelled'].map(s => ({
    name: s, count: bookings.filter(b => b.bookingStatus === s).length
  }));

  // ── Monthly bookings chart (last 6 months) ───────────────────────────────
  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      const count = bookings.filter(b => {
        if (!b.createdAt) return false;
        const bd = new Date(b.createdAt);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      }).length;
      const revenue = bookings.filter(b => {
        if (!b.createdAt || b.bookingStatus !== 'Completed') return false;
        const bd = new Date(b.createdAt);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      }).reduce((s, b) => s + Number(b.totalAmount || 0), 0);
      months.push({ name: label, bookings: count, revenue });
    }
    return months;
  })();

  // ── Recent bookings ──────────────────────────────────────────────────────
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  // ── Recent reviews ───────────────────────────────────────────────────────
  const recentReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  // ── Workers by status ────────────────────────────────────────────────────
  const workerStatusData = ['Pending','Approved','Rejected','Suspended'].map(s => ({
    name: s, count: workers.filter(w => w.status === s).length
  })).filter(d => d.count > 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'Syne',sans-serif", color: '#555A66', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: '#E8EAF0' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Dashboard ⚡</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── ALERT BANNERS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {pendingWorkers > 0 && (
          <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#FACC15', display: 'flex', gap: 10, alignItems: 'center' }}>
            ⚠️ <strong>{pendingWorkers}</strong> worker{pendingWorkers > 1 ? 's' : ''} waiting for approval
          </div>
        )}
        {pendingSettlements > 0 && (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#4ADE80', display: 'flex', gap: 10, alignItems: 'center' }}>
            💸 <strong>{pendingSettlements}</strong> settlement{pendingSettlements > 1 ? 's' : ''} pending payment
          </div>
        )}
      </div>

      {/* ── TOP STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📋" label="TOTAL BOOKINGS"    value={bookings.length}    sub={`${completedBookings} completed`} color="#60A5FA" border="rgba(96,165,250,0.2)" />
        <StatCard icon="💰" label="TOTAL REVENUE"     value={`₹${totalRevenue.toLocaleString()}`} sub={`₹${totalCommission.toLocaleString()} commission`} color="#4ADE80" border="rgba(74,222,128,0.2)" />
        <StatCard icon="👥" label="CUSTOMERS"         value={customers.length}   sub="registered" color="#A78BFA" border="rgba(167,139,250,0.2)" />
        <StatCard icon="🔧" label="WORKERS"           value={approvedWorkers}    sub={`${pendingWorkers} pending approval`} color="#FB923C" border="rgba(251,146,60,0.2)" />
      </div>

      {/* ── SECOND ROW STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🗂️" label="CATEGORIES"       value={categories.length}  color="#60A5FA"  border="rgba(96,165,250,0.15)" />
        <StatCard icon="🛠️" label="SERVICES"         value={services.length}    color="#A78BFA"  border="rgba(167,139,250,0.15)" />
        <StatCard icon="⭐" label="AVG RATING"        value={avgRating}          sub={`${reviews.length} reviews`} color="#FACC15" border="rgba(250,204,21,0.15)" />
        <StatCard icon="⏳" label="PENDING BOOKINGS"  value={pendingBookings}    sub="need action" color="#FACC15" border="rgba(250,204,21,0.15)" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Monthly Bookings Bar Chart */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Monthly Bookings</div>
          <div style={{ fontSize: 11, color: '#555A66', marginBottom: 16 }}>Last 6 months</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#555A66', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555A66', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E8EAF0', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="bookings" fill="#FF4D4D" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Line Chart */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Monthly Revenue</div>
          <div style={{ fontSize: 11, color: '#555A66', marginBottom: 16 }}>Completed bookings only</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#555A66', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555A66', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E8EAF0', fontSize: 12 }}
                formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#4ADE80" strokeWidth={2.5} dot={{ fill: '#4ADE80', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── BOOKING STATUS + WORKER STATUS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Booking Status Breakdown */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Booking Status Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookingStatusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: STATUS_COLOR[s.name] || '#fff', flexShrink: 0 }}>{s.name}</div>
                <div style={{ flex: 1, height: 8, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${bookings.length ? (s.count/bookings.length*100) : 0}%`, background: STATUS_COLOR[s.name] || '#fff', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0', width: 24, textAlign: 'right' }}>{s.count}</div>
              </div>
            ))}
            {bookings.length === 0 && <div style={{ color: '#555A66', fontSize: 13 }}>No bookings yet</div>}
          </div>
        </div>

        {/* Worker Status */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Worker Status</div>
          {workerStatusData.length === 0 ? (
            <div style={{ color: '#555A66', fontSize: 13 }}>No workers yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {workerStatusData.map(w => {
                const colors = { Approved: '#4ADE80', Pending: '#FACC15', Rejected: '#F87171', Suspended: '#FB923C' };
                return (
                  <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: colors[w.name], flexShrink: 0 }}>{w.name}</div>
                    <div style={{ flex: 1, height: 8, background: '#1a1d24', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${workers.length ? (w.count/workers.length*100) : 0}%`, background: colors[w.name], borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF0', width: 24, textAlign: 'right' }}>{w.count}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top rated workers */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555A66', letterSpacing: 1, marginBottom: 10 }}>TOP WORKERS BY BOOKINGS</div>
            {workers.filter(w => w.status === 'Approved').slice(0, 3).map(w => {
              const wBookings = bookings.filter(b => toStr(b.servicemanId) === toStr(w._id) || toStr(b.serviceman?._id) === toStr(w._id)).length;
              return (
                <div key={toStr(w._id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 12, color: '#E8EAF0', fontWeight: 600 }}>{w.fullName}</div>
                  <div style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>{wBookings} bookings</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RECENT BOOKINGS + RECENT REVIEWS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Bookings */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Recent Bookings</div>
            <span style={{ fontSize: 11, color: '#555A66' }}>Latest 6</span>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#555A66', fontSize: 13 }}>No bookings yet</div>
          ) : recentBookings.map((b, i) => (
            <div key={toStr(b._id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < recentBookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FF6B6B', fontFamily: "'JetBrains Mono',monospace" }}>{b.bookingNumber}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{b.customer?.fullName || '—'} → {b.serviceman?.fullName || '—'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#4ADE80' }}>₹{Number(b.totalAmount).toLocaleString()}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[b.bookingStatus] || '#fff', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 6px', marginTop: 3, display: 'inline-block' }}>
                  {b.bookingStatus}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Reviews */}
        <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Recent Reviews</div>
            <span style={{ fontSize: 11, color: '#555A66' }}>Latest 4</span>
          </div>
          {recentReviews.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#555A66', fontSize: 13 }}>No reviews yet</div>
          ) : recentReviews.map((r, i) => (
            <div key={toStr(r._id)} style={{ padding: '12px 20px', borderBottom: i < recentReviews.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.customer?.fullName || '—'}</div>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#FACC15' : '#2A2D35' }}>★</span>)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.service?.serviceName || '—'}</div>
              {r.review && <div style={{ fontSize: 11, color: '#555A66', fontStyle: 'italic', marginTop: 4 }}>"{r.review.slice(0, 50)}{r.review.length > 50 ? '...' : ''}"</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
