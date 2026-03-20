import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
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
  Pending:    { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  icon: '🕐' },
  Confirmed:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  icon: '✅' },
  InProgress: { color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  icon: '🔧' },
  Completed:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: '🎉' },
  Cancelled:  { color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
};

const CAT_ICONS = ['🔧','⚡','❄️','🏠','🪑','🎨','🔌','🚿','🛁','🪟'];

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
      const [catRes, bookRes] = await Promise.allSettled([
        getCategories(),
        getMyBookings(id),
      ]);
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
    <View style={s.loadingRoot}><ActivityIndicator size="large" color="#FF4D4D" /></View>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#FF4D4D" />}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()} 👋</Text>
          <Text style={s.name}>{customer?.fullName}</Text>
          <Text style={s.sub}>{customer?.contactNumber}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{customer?.fullName?.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {/* Active booking alert */}
      {activeBookings.length > 0 && (
        <TouchableOpacity style={s.alertBox} onPress={() => navigation.navigate('Bookings')} activeOpacity={0.85}>
          <Ionicons name="calendar" size={16} color="#60A5FA" />
          <Text style={s.alertText}>
            You have <Text style={{ fontWeight: '900' }}>{activeBookings.length} active booking{activeBookings.length > 1 ? 's' : ''}</Text>
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#60A5FA" />
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#555A66" style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} placeholder="Search services..." placeholderTextColor="#555A66" value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#555A66" /></TouchableOpacity> : null}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon: '📋', label: 'Total',     value: bookings.length,                                              color: '#60A5FA' },
          { icon: '🔧', label: 'Active',    value: activeBookings.length,                                        color: '#FB923C' },
          { icon: '🎉', label: 'Completed', value: bookings.filter(b => b.bookingStatus === 'Completed').length, color: '#4ADE80' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Categories */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🗂️ Our Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {filteredCats.length === 0
          ? <Text style={s.noResults}>No services found</Text>
          : (
            <View style={s.catGrid}>
              {filteredCats.slice(0, 8).map((cat, i) => (
                <TouchableOpacity
                  key={toStr(cat._id)}
                  style={s.catCard}
                  onPress={() => navigation.navigate('Services', { categoryId: toStr(cat._id), categoryName: cat.name })}
                  activeOpacity={0.8}>
                  <View style={s.catIconWrap}>
                    <Text style={s.catIcon}>{CAT_ICONS[i % CAT_ICONS.length]}</Text>
                  </View>
                  <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
      </View>

      {/* Recent bookings */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📋 Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {bookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptySub}>Book a service to get started</Text>
            <TouchableOpacity style={s.bookBtn} onPress={() => navigation.navigate('Services')}>
              <Text style={s.bookBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.slice(0, 3).map(b => {
            const c = STATUS[b.bookingStatus] || STATUS.Pending;
            return (
              <View key={toStr(b._id)} style={s.bookingCard}>
                <View style={s.bookingLeft}>
                  <Text style={s.bookingNum}>{b.bookingNumber}</Text>
                  <Text style={s.bookingService}>{b.service?.serviceName || b.contactPerson}</Text>
                  <Text style={s.bookingDate}>
                    {new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={s.bookingRight}>
                  <View style={[s.badge, { backgroundColor: c.bg }]}>
                    <Text style={[s.badgeText, { color: c.color }]}>{c.icon} {b.bookingStatus}</Text>
                  </View>
                  <Text style={s.bookingAmount}>₹{Number(b.totalAmount).toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  scroll:        { padding: 20, paddingTop: 56 },
  loadingRoot:   { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting:      { fontSize: 13, color: '#555A66', marginBottom: 2 },
  name:          { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub:           { fontSize: 11, color: '#555A66', marginTop: 2 },
  avatar:        { width: 52, height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  avatarText:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  alertBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 },
  alertText:     { flex: 1, color: '#60A5FA', fontSize: 12 },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 44, marginBottom: 20 },
  searchInput:   { flex: 1, color: '#E8EAF0', fontSize: 13 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:      { flex: 1, backgroundColor: '#0D1117', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statIcon:      { fontSize: 20, marginBottom: 4 },
  statValue:     { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel:     { fontSize: 10, fontWeight: '700', color: '#555A66' },
  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  seeAll:        { fontSize: 12, fontWeight: '700', color: '#FF4D4D' },
  noResults:     { color: '#555A66', fontSize: 13, textAlign: 'center', padding: 20 },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard:       { width: '22%', alignItems: 'center', gap: 8 },
  catIconWrap:   { width: 56, height: 56, backgroundColor: '#0D1117', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  catIcon:       { fontSize: 26 },
  catName:       { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  emptyBox:      { alignItems: 'center', paddingVertical: 40, backgroundColor: '#0D1117', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyIcon:     { fontSize: 40, marginBottom: 10 },
  emptyTitle:    { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  emptySub:      { fontSize: 12, color: '#555A66', marginBottom: 16 },
  bookBtn:       { backgroundColor: '#FF4D4D', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bookBtnText:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  bookingCard:   { backgroundColor: '#0D1117', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  bookingLeft:   { flex: 1 },
  bookingRight:  { alignItems: 'flex-end', gap: 6 },
  bookingNum:    { fontSize: 11, fontWeight: '800', color: '#FF6B6B', marginBottom: 2 },
  bookingService:{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  bookingDate:   { fontSize: 11, color: '#555A66' },
  bookingAmount: { fontSize: 14, fontWeight: '900', color: '#4ADE80' },
  badge:         { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:     { fontSize: 10, fontWeight: '800' },
});
