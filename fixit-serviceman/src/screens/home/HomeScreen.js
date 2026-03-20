import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, getMyEarnings, getMyServices, getMyReviews } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS_CONFIG = {
  Pending:   { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  icon: '🕐' },
  Confirmed: { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  icon: '✅' },
  InProgress:{ color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  icon: '🔧' },
  Completed: { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: '🎉' },
  Cancelled: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
};

export default function HomeScreen({ navigation }) {
  const { serviceman, logout } = useAuth();
  const [bookings,   setBookings]   = useState([]);
  const [earnings,   setEarnings]   = useState([]);
  const [services,   setServices]   = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const id = toStr(serviceman?._id);

  const fetchAll = useCallback(async () => {
    try {
      const [bRes, eRes, sRes, rRes] = await Promise.allSettled([
        getMyBookings(id),
        getMyEarnings(id),
        getMyServices(id),
        getMyReviews(id),
      ]);
      if (bRes.status === 'fulfilled' && bRes.value.data.Status === 'OK') setBookings(bRes.value.data.Result);
      if (eRes.status === 'fulfilled' && eRes.value.data.Status === 'OK') setEarnings(eRes.value.data.Result);
      if (sRes.status === 'fulfilled' && sRes.value.data.Status === 'OK') setServices(sRes.value.data.Result);
      if (rRes.status === 'fulfilled' && rRes.value.data.Status === 'OK') setReviews(rRes.value.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // Stats
  const totalEarnings   = Math.round(earnings.reduce((s, e) => s + Number(e.servicemanEarning || 0), 0));
  const pendingPayout   = Math.round(earnings.filter(e => e.settlementStatus === 'Pending').reduce((s, e) => s + Number(e.servicemanEarning || 0), 0));
  const avgRating       = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const pendingBookings = bookings.filter(b => b.bookingStatus === 'Pending').length;
  const todayBookings   = bookings.filter(b => {
    const d = new Date(b.bookingDate);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statusBadge = (status) => {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return (
      <View style={[s.badge, { backgroundColor: c.bg }]}>
        <Text style={[s.badgeText, { color: c.color }]}>{c.icon} {status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color="#FF4D4D" />
        <Text style={s.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D4D" />}
      showsVerticalScrollIndicator={false}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()} 👋</Text>
          <Text style={s.name}>{serviceman?.fullName}</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: serviceman?.status === 'Approved' ? '#4ADE80' : '#FACC15' }]} />
            <Text style={[s.statusText, { color: serviceman?.status === 'Approved' ? '#4ADE80' : '#FACC15' }]}>
              {serviceman?.status}
            </Text>
          </View>
        </View>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{serviceman?.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
          {pendingBookings > 0 && (
            <View style={s.avatarBadge}>
              <Text style={s.avatarBadgeText}>{pendingBookings}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── PENDING ALERT ── */}
      {pendingBookings > 0 && (
        <TouchableOpacity style={s.alertBox} onPress={() => navigation.navigate('Bookings')} activeOpacity={0.85}>
          <Ionicons name="notifications" size={16} color="#FACC15" />
          <Text style={s.alertText}>You have <Text style={{ fontWeight: '900' }}>{pendingBookings} pending booking{pendingBookings > 1 ? 's' : ''}</Text> waiting for confirmation!</Text>
          <Ionicons name="chevron-forward" size={14} color="#FACC15" />
        </TouchableOpacity>
      )}

      {/* ── STAT CARDS ── */}
      <View style={s.statsGrid}>
        {[
          { icon: '📋', label: 'Total Bookings',  value: bookings.length,                  color: '#60A5FA' },
          { icon: '💰', label: 'Total Earned',     value: `₹${totalEarnings.toLocaleString()}`, color: '#4ADE80' },
          { icon: '⏳', label: 'Pending Payout',   value: `₹${pendingPayout.toLocaleString()}`, color: '#FACC15' },
          { icon: '⭐', label: 'Avg Rating',        value: avgRating,                        color: '#FB923C' },
          { icon: '🛠️', label: 'My Services',       value: services.length,                  color: '#C084FC' },
          { icon: '✅', label: 'Completed',         value: bookings.filter(b => b.bookingStatus === 'Completed').length, color: '#4ADE80' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── TODAY'S BOOKINGS ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📅 Today's Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {todayBookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>No bookings today</Text>
          </View>
        ) : (
          todayBookings.slice(0, 3).map((b, i) => (
            <View key={toStr(b._id)} style={s.bookingCard}>
              <View style={s.bookingLeft}>
                <Text style={s.bookingNumber}>{b.bookingNumber}</Text>
                <Text style={s.bookingCustomer}>{b.contactPerson}</Text>
                <Text style={s.bookingAddress} numberOfLines={1}>{b.address}</Text>
              </View>
              <View style={s.bookingRight}>
                {statusBadge(b.bookingStatus)}
                <Text style={s.bookingAmount}>₹{Number(b.totalAmount).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── RECENT BOOKINGS ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🕐 Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {bookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No bookings yet</Text>
          </View>
        ) : (
          bookings.slice(0, 4).map((b) => (
            <View key={toStr(b._id)} style={s.bookingCard}>
              <View style={s.bookingLeft}>
                <Text style={s.bookingNumber}>{b.bookingNumber}</Text>
                <Text style={s.bookingCustomer}>{b.contactPerson}</Text>
                <Text style={s.bookingDate}>
                  {new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={s.bookingRight}>
                {statusBadge(b.bookingStatus)}
                <Text style={s.bookingAmount}>₹{Number(b.totalAmount).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>⚡ Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { icon: '📋', label: 'My Bookings',  tab: 'Bookings',  color: '#60A5FA' },
            { icon: '🛠️', label: 'My Services',  tab: 'Services',  color: '#C084FC' },
            { icon: '📅', label: 'My Slots',     tab: 'Slots',     color: '#FB923C' },
            { icon: '💰', label: 'Earnings',     tab: 'Earnings',  color: '#4ADE80' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => navigation.navigate(a.tab)} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: `${a.color}20` }]}>
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── RECENT REVIEWS ── */}
      {reviews.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>⭐ Recent Reviews</Text>
          {reviews.slice(0, 2).map(r => (
            <View key={toStr(r._id)} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <Text style={s.reviewCustomer}>{r.customer?.fullName || '—'}</Text>
                <View style={s.starsRow}>
                  {[1,2,3,4,5].map(star => (
                    <Text key={star} style={{ color: star <= r.rating ? '#FACC15' : '#2A2D35', fontSize: 13 }}>★</Text>
                  ))}
                </View>
              </View>
              {r.review && <Text style={s.reviewText} numberOfLines={2}>"{r.review}"</Text>}
            </View>
          ))}
        </View>
      )}

      {/* ── LOGOUT ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#F87171" />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#080B0F' },
  scroll:          { padding: 20, paddingTop: 56 },
  loadingRoot:     { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:     { color: '#555A66', fontSize: 13 },

  // Header
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting:        { fontSize: 13, color: '#555A66', marginBottom: 2 },
  name:            { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot:             { width: 7, height: 7, borderRadius: 4 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  avatarWrap:      { position: 'relative' },
  avatar:          { width: 52, height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  avatarText:      { fontSize: 22, fontWeight: '900', color: '#fff' },
  avatarBadge:     { position: 'absolute', top: -4, right: -4, backgroundColor: '#FACC15', borderRadius: 99, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  avatarBadgeText: { fontSize: 10, fontWeight: '900', color: '#000' },

  // Alert
  alertBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(250,204,21,0.08)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)', borderRadius: 12, padding: 14, marginBottom: 20 },
  alertText:       { flex: 1, color: '#FACC15', fontSize: 12 },

  // Stats
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard:        { width: '30.5%', backgroundColor: '#0D1117', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  statIcon:        { fontSize: 20, marginBottom: 6 },
  statValue:       { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  statLabel:       { fontSize: 9, fontWeight: '700', color: '#555A66', textAlign: 'center', letterSpacing: 0.3 },

  // Section
  section:         { marginBottom: 24 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:    { fontSize: 15, fontWeight: '800', color: '#fff' },
  seeAll:          { fontSize: 12, fontWeight: '700', color: '#FF4D4D' },

  // Booking card
  bookingCard:     { backgroundColor: '#0D1117', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingLeft:     { flex: 1 },
  bookingRight:    { alignItems: 'flex-end', gap: 6 },
  bookingNumber:   { fontSize: 12, fontWeight: '700', color: '#FF6B6B', marginBottom: 2 },
  bookingCustomer: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  bookingAddress:  { fontSize: 11, color: '#555A66' },
  bookingDate:     { fontSize: 11, color: '#555A66' },
  bookingAmount:   { fontSize: 14, fontWeight: '900', color: '#4ADE80' },

  // Badge
  badge:           { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:       { fontSize: 10, fontWeight: '700' },

  // Empty
  emptyBox:        { backgroundColor: '#0D1117', borderRadius: 14, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyIcon:       { fontSize: 32, marginBottom: 8 },
  emptyText:       { color: '#555A66', fontSize: 13, fontWeight: '600' },

  // Quick actions
  actionsGrid:     { flexDirection: 'row', gap: 10 },
  actionCard:      { flex: 1, backgroundColor: '#0D1117', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  actionIcon:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel:     { fontSize: 10, fontWeight: '800', textAlign: 'center' },

  // Reviews
  reviewCard:      { backgroundColor: '#0D1117', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reviewHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewCustomer:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  starsRow:        { flexDirection: 'row' },
  reviewText:      { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },

  // Logout
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 14, padding: 14, marginTop: 8 },
  logoutText:      { color: '#F87171', fontSize: 14, fontWeight: '700' },
});
