import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
// API functions ready to use once backend routes are confirmed
// import { getAllBookings } from '../utils/api';

// ── MOCK DATA (used until backend is connected) ──────────
const MOCK_STATS = {
  totalRevenue: '₹4,28,500', totalBookings: 1284,
  activeWorkers: 98, pendingApprovals: 5,
};
const MOCK_REVENUE = [
  { month: 'Oct', revenue: 28000 }, { month: 'Nov', revenue: 35000 },
  { month: 'Dec', revenue: 42000 }, { month: 'Jan', revenue: 38000 },
  { month: 'Feb', revenue: 51000 }, { month: 'Mar', revenue: 64000 },
];
const MOCK_SERVICES = [
  { name: 'Plumbing',    bookings: 320, percent: 85 },
  { name: 'Electrician', bookings: 240, percent: 65 },
  { name: 'Cleaning',    bookings: 210, percent: 55 },
  { name: 'AC Repair',   bookings: 180, percent: 48 },
  { name: 'Carpentry',   bookings: 120, percent: 32 },
];
const MOCK_BOOKINGS = [
  { _id:'B1025', customer:'Riya Mehta',  service:'Pipe Leak Fix',      worker:'Arjun Kumar', amount:'₹850',  status:'Ongoing'  },
  { _id:'B1024', customer:'Mehul Shah',  service:'Bathroom Fitting',   worker:'Deepak M.',   amount:'₹1,400',status:'Confirmed'},
  { _id:'B1023', customer:'Priya Nair',  service:'Water Heater Install',worker:'Vikram S.',   amount:'₹1,200',status:'Completed'},
  { _id:'B1022', customer:'Anjali Rao',  service:'Drain Cleaning',     worker:'Sunita D.',   amount:'₹500',  status:'Cancelled'},
  { _id:'B1021', customer:'Sameer Joshi',service:'Tap Replacement',    worker:'Arjun Kumar', amount:'₹650',  status:'Pending' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#FF6B6B' }}>₹{payload[0].value.toLocaleString()}</div>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats]       = useState(MOCK_STATS);
  const [revenue, setRevenue]   = useState(MOCK_REVENUE);
  const [services, setServices] = useState(MOCK_SERVICES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // Uncomment when backend is ready:
    // fetchAll();
  }, []);

  const fetchAll = async () => {
    // TODO: connect to backend once routes are confirmed
    // setLoading(true);
    // try {
    //   const [s, r, sv, b] = await Promise.all([...]);
    // } catch (e) { console.error(e); }
    // finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", color: '#E8EAF0' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Dashboard ⚡</div>
        <div style={{ fontSize: 12, color: '#555A66', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="💰" label="Total Revenue"    value={stats.totalRevenue}     color="#FF4D4D" trend={12} />
        <StatCard icon="📋" label="Total Bookings"   value={stats.totalBookings}    color="#60A5FA" trend={8}  />
        <StatCard icon="🔧" label="Active Workers"   value={stats.activeWorkers}    color="#4ADE80" trend={3}  />
        <StatCard icon="✅" label="Pending Approvals"value={stats.pendingApprovals} color="#FACC15" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>

        {/* Revenue bar chart */}
        <div style={{ flex: 2, minWidth: 300, background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#555A66', fontSize: 11, fontFamily: 'Syne' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555A66', fontSize: 10, fontFamily: 'Syne' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,77,77,0.06)' }} />
              <Bar dataKey="revenue" fill="#FF4D4D" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Services */}
        <div style={{ flex: 1, minWidth: 240, background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Top Services</div>
          {services.map((svc, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E8EAF0' }}>{svc.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>{svc.bookings}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${svc.percent}%`, background: '#FF4D4D', borderRadius: 3, transition: 'width 0.8s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT BOOKINGS TABLE ── */}
      <div style={{ background: '#0D1117', border: '1px solid rgba(255,77,77,0.1)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Recent Bookings</div>
          <div style={{ fontSize: 12, color: '#FF4D4D', fontWeight: 600, cursor: 'pointer' }}>View All →</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Booking ID','Customer','Service','Worker','Amount','Status'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#555A66', letterSpacing: 1 }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={b._id} style={{ borderBottom: i < bookings.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#FF6B6B', fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>#{b._id}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#E8EAF0' }}>{b.customer}</td>
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#9CA3AF' }}>{b.service}</td>
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#9CA3AF' }}>{b.worker}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#4ADE80' }}>{b.amount}</td>
                <td style={{ padding: '14px 20px' }}><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
