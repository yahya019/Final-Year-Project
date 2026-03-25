import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getCategories, getMyBookings } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS = {
  Pending:    { color: '#F59E0B', bg: '#FFFBEB', icon: '🕐' },
  Confirmed:  { color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  InProgress: { color: '#F97316', bg: '#FFF7ED', icon: '🔧' },
  Completed:  { color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  Cancelled:  { color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

const CAT_ICONS  = ['🔧','⚡','❄️','🏠','🪑','🎨','🔌','🚿','🛁','🪟'];
const CAT_COLORS = ['#FFD6D6','#FFE8A3','#B3D4FF','#B2EED8','#FFD6B3','#D9B3FF','#B3F0CC','#FFB3B3','#FFE8A3','#B3D4FF'];

export default function HomeScreen({ navigation }) {
  const { customer } = useAuth();
  const [categories, setCategories] = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const id = toStr(customer?._id);

  const fetchAll = useCallback(async () => {
    try {
      const [catRes, bookRes] = await Promise.allSettled([getCategories(), getMyBookings(id)]);
      if (catRes.status  === 'fulfilled' && catRes.value.data.Status  === 'OK') setCategories(catRes.value.data.Result);
      if (bookRes.status === 'fulfilled' && bookRes.value.data.Status === 'OK') setBookings(bookRes.value.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const activeBookings = bookings.filter(b => !['Completed','Cancelled'].includes(b.bookingStatus));
  const filteredCats   = search ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : categories;

  if (loading) return (
    <View style={s.loadingRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <ActivityIndicator size="large" color="#FF4D4D" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#FF4D4D" />}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()} 👋</Text>
            <Text style={s.name}>{customer?.fullName}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{customer?.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
          <TextInput style={s.searchInput} placeholder="Search for services..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9CA3AF" /></TouchableOpacity> : null}
        </View>

        {/* Active booking banner */}
        {activeBookings.length > 0 && (
          <TouchableOpacity style={s.bannerBox} onPress={() => navigation.navigate('Bookings')} activeOpacity={0.85}>
            <View style={s.bannerLeft}>
              <Text style={s.bannerIcon}>📋</Text>
              <View>
                <Text style={s.bannerTitle}>{activeBookings.length} Active Booking{activeBookings.length > 1 ? 's' : ''}</Text>
                <Text style={s.bannerSub}>Tap to track your services</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF4D4D" />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { icon: '📋', label: 'Total',     value: bookings.length,                                              color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
            { icon: '🔧', label: 'Active',    value: activeBookings.length,                                        color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
            { icon: '🎉', label: 'Completed', value: bookings.filter(b => b.bookingStatus === 'Completed').length, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
          ].map(stat => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: stat.bg, borderColor: stat.border }]}>
              <View style={s.statIconWrap}>
                <Text style={s.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: stat.color }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Our Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={s.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {filteredCats.length === 0
            ? <Text style={s.noResults}>No services found</Text>
            : (
              <View style={s.catGrid}>
                {filteredCats.slice(0, 8).map((cat, i) => (
                  <TouchableOpacity
                    key={toStr(cat._id)}
                    style={[s.catCard, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]}
                    onPress={() => navigation.navigate('Services', { categoryId: toStr(cat._id), categoryName: cat.name })}
                    activeOpacity={0.8}>
                    <Text style={s.catIcon}>{CAT_ICONS[i % CAT_ICONS.length]}</Text>
                    <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </View>

        {/* Recent bookings */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={s.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {bookings.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🏠</Text>
              <Text style={s.emptyTitle}>No bookings yet</Text>
              <Text style={s.emptySub}>Book a home service to get started</Text>
              <TouchableOpacity style={s.bookBtn} onPress={() => navigation.navigate('Services')}>
                <Text style={s.bookBtnText}>Browse Services</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.slice(0, 3).map(b => {
              const c = STATUS[b.bookingStatus] || STATUS.Pending;
              return (
                <View key={toStr(b._id)} style={s.bookingCard}>
                  <View style={[s.bookingIconWrap, { backgroundColor: c.bg }]}>
                    <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                  </View>
                  <View style={s.bookingInfo}>
                    <Text style={s.bookingNum}>{b.bookingNumber}</Text>
                    <Text style={s.bookingService} numberOfLines={1}>{b.service?.serviceName || b.contactPerson}</Text>
                    <Text style={s.bookingDate}>{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={s.bookingRight}>
                    <View style={[s.badge, { backgroundColor: c.bg }]}>
                      <Text style={[s.badgeText, { color: c.color }]}>{b.bookingStatus}</Text>
                    </View>
                    <Text style={s.bookingAmount}>₹{Math.round(Number(b.totalAmount))}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F5F6FA' },
  loadingRoot:   { flex: 1, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center' },
  scroll:        { padding: 20, paddingTop: 56 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting:      { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  name:          { fontSize: 22, fontWeight: '900', color: '#1A1D23', letterSpacing: -0.5 },
  avatar:        { width: 48, height: 48, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  avatarText:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  searchInput:   { flex: 1, color: '#1A1D23', fontSize: 14 },
  bannerBox:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 14, marginBottom: 16 },
  bannerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon:    { fontSize: 24 },
  bannerTitle:   { fontSize: 14, fontWeight: '800', color: '#1A1D23' },
  bannerSub:     { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:      { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIconWrap:  { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statIcon:      { fontSize: 20 },
  statValue:     { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel:     { fontSize: 10, fontWeight: '700', opacity: 0.8 },
  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '800', color: '#1A1D23' },
  seeAll:        { fontSize: 13, fontWeight: '700', color: '#FF4D4D' },
  noResults:     { color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard:       { width: '22%', alignItems: 'center', borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  catIcon:       { fontSize: 28 },
  catName:       { fontSize: 10, fontWeight: '700', color: '#1A1D23', textAlign: 'center' },
  emptyBox:      { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E8EBF0' },
  emptyIcon:     { fontSize: 48, marginBottom: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: '#1A1D23', marginBottom: 4 },
  emptySub:      { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  bookBtn:       { backgroundColor: '#FF4D4D', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  bookBtnText:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  bookingCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  bookingIconWrap:{ width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bookingInfo:   { flex: 1 },
  bookingNum:    { fontSize: 11, fontWeight: '700', color: '#FF4D4D', marginBottom: 2 },
  bookingService:{ fontSize: 13, fontWeight: '700', color: '#1A1D23', marginBottom: 2 },
  bookingDate:   { fontSize: 11, color: '#9CA3AF' },
  bookingRight:  { alignItems: 'flex-end', gap: 4 },
  badge:         { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:     { fontSize: 10, fontWeight: '700' },
  bookingAmount: { fontSize: 14, fontWeight: '900', color: '#1A1D23' },
});
