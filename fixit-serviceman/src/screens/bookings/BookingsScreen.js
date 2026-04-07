import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Alert, TextInput, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, updateBookingStatus } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS = {
  Pending:    { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.25)',  icon: '🕐' },
  Confirmed:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  icon: '✅' },
  InProgress: { color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',  icon: '🔧' },
  Completed:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)',  icon: '🎉' },
  Cancelled:  { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', icon: '❌' },
};

const NEXT_STATUS = {
  Pending:    ['Cancelled'],
  Confirmed:  ['InProgress', 'Cancelled'],
  InProgress: ['Completed'],
};

function StatusBadge({ status }) {
  const c = STATUS[status] || STATUS.Pending;
  return (
    <View style={[sb.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[sb.badgeText, { color: c.color }]}>{c.icon} {status}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge:     { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});

// ── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({ booking, visible, onClose, onStatusUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const nextActions = NEXT_STATUS[booking?.bookingStatus] || [];

  const handleStatus = async (newStatus) => {
    setError('');

    // ── Validate: cannot mark InProgress or Completed before booking date ──
    if (newStatus === 'InProgress' || newStatus === 'Completed') {
      const bookingDate = new Date(booking.bookingDate);
      const today = new Date();

      // Compare using date strings to avoid timezone issues
      const bookingDateStr = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const todayStr = today.toISOString().split('T')[0];             // YYYY-MM-DD

      if (todayStr < bookingDateStr) {
        setError(`❌ Cannot mark ${newStatus} before booking date (${bookingDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`);
        return;
      }
    }

    if (newStatus === 'Cancelled') {
      Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => doUpdate(newStatus) }
      ]);
      return;
    }
    doUpdate(newStatus);
  };

  const doUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const res = await updateBookingStatus({
        bookingId: toStr(booking._id),
        bookingStatus: newStatus,
      });
      if (res.data.Status === 'OK') {
        onStatusUpdate(toStr(booking._id), newStatus);
        onClose();
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const statusBtnColor = (status) => {
    if (status === 'Confirmed')  return { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.3)',  text: '#60A5FA' };
    if (status === 'InProgress') return { bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.3)',  text: '#FB923C' };
    if (status === 'Completed')  return { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.3)',  text: '#4ADE80' };
    if (status === 'Cancelled')  return { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', text: '#F87171' };
    return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', text: '#9CA3AF' };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={d.sheet}>
          {/* Header */}
          <View style={d.header}>
            <View>
              <Text style={d.bookingNum}>{booking.bookingNumber}</Text>
              <StatusBadge status={booking.bookingStatus} />
            </View>
            <TouchableOpacity onPress={onClose} style={d.closeBtn}>
              <Ionicons name="close" size={20} color="#555A66" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Info grid */}
            <View style={d.infoGrid}>
              {[
                { icon: '👤', label: 'Customer',    value: booking.contactPerson },
                { icon: '📞', label: 'Contact',     value: booking.contactNumber },
                { icon: '🛠️', label: 'Service',     value: booking.service?.serviceName || '—' },
                { icon: '📅', label: 'Booking Date', value: new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { icon: '💳', label: 'Payment',     value: `${booking.paymentMode} • ${booking.paymentStatus}` },
              ].map(r => (
                <View key={r.label} style={d.infoRow}>
                  <Text style={d.infoIcon}>{r.icon}</Text>
                  <View style={d.infoContent}>
                    <Text style={d.infoLabel}>{r.label}</Text>
                    <Text style={d.infoValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Address */}
            <View style={d.addressBox}>
              <View style={d.addressHeader}>
                <Ionicons name="location" size={14} color="#FF6B6B" />
                <Text style={d.addressLabel}>SERVICE ADDRESS</Text>
              </View>
              <Text style={d.addressText}>{booking.address}</Text>
              {booking.latitude && booking.longitude && (
                <TouchableOpacity
                  style={d.mapBtn}
                  onPress={() => Linking.openURL(`https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`)}
                  activeOpacity={0.8}>
                  <Ionicons name="map-outline" size={14} color="#60A5FA" />
                  <Text style={d.mapBtnText}>Open in Google Maps</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Amount */}
            <View style={d.amountBox}>
              <View style={d.amountRow}>
                <Text style={d.amountLabel}>Service Amount</Text>
                <Text style={d.amountValue}>₹{Number(booking.totalAmount).toLocaleString()}</Text>
              </View>
              {booking.surgeCharges > 0 && (
                <View style={d.amountRow}>
                  <Text style={d.amountLabel}>Surge Charges</Text>
                  <Text style={[d.amountValue, { color: '#FB923C' }]}>+₹{Number(booking.surgeCharges).toLocaleString()}</Text>
                </View>
              )}
              <View style={[d.amountRow, d.amountTotal]}>
                <Text style={d.totalLabel}>Total</Text>
                <Text style={d.totalValue}>₹{(Number(booking.totalAmount) + Number(booking.surgeCharges || 0)).toLocaleString()}</Text>
              </View>
            </View>

            {error ? (
              <View style={d.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#F87171" />
                <Text style={d.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            {nextActions.length > 0 && (
              <View style={d.actionsWrap}>
                <Text style={d.actionsLabel}>UPDATE STATUS</Text>
                <View style={d.actionsRow}>
                  {nextActions.map(status => {
                    const c = statusBtnColor(status);
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[d.actionBtn, { backgroundColor: c.bg, borderColor: c.border }]}
                        onPress={() => handleStatus(status)}
                        disabled={loading}>
                        {loading
                          ? <ActivityIndicator size="small" color={c.text} />
                          : <Text style={[d.actionBtnText, { color: c.text }]}>
                              {STATUS[status]?.icon} Mark {status}
                            </Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {(booking.bookingStatus === 'Completed' || booking.bookingStatus === 'Cancelled') && (
              <View style={d.finalBox}>
                <Text style={d.finalText}>
                  {booking.bookingStatus === 'Completed' ? '🎉 This booking is completed!' : '❌ This booking was cancelled.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const d = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bookingNum:   { fontSize: 13, fontWeight: '800', color: '#FF6B6B', marginBottom: 6 },
  closeBtn:     { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoGrid:     { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoIcon:     { fontSize: 16, width: 24 },
  infoContent:  { flex: 1 },
  infoLabel:    { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 0.5, marginBottom: 2 },
  infoValue:    { fontSize: 13, fontWeight: '600', color: '#E8EAF0' },
  addressBox:   { backgroundColor: 'rgba(255,77,77,0.05)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,77,77,0.1)' },
  addressHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  addressLabel: { fontSize: 10, fontWeight: '700', color: '#FF6B6B', letterSpacing: 1 },
  addressText:  { fontSize: 13, color: '#E8EAF0', lineHeight: 18 },
  mapBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)' },
  mapBtnText:   { fontSize: 12, fontWeight: '700', color: '#60A5FA' },
  amountBox:    { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  amountRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amountLabel:  { fontSize: 13, color: '#9CA3AF' },
  amountValue:  { fontSize: 13, fontWeight: '700', color: '#E8EAF0' },
  amountTotal:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4, marginBottom: 0 },
  totalLabel:   { fontSize: 14, fontWeight: '800', color: '#fff' },
  totalValue:   { fontSize: 16, fontWeight: '900', color: '#4ADE80' },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:    { color: '#F87171', fontSize: 12, flex: 1 },
  actionsWrap:  { marginBottom: 16 },
  actionsLabel: { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 10 },
  actionsRow:   { flexDirection: 'row', gap: 10 },
  actionBtn:    { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionBtnText:{ fontSize: 13, fontWeight: '800' },
  finalBox:     { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  finalText:    { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const { serviceman } = useAuth();
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('Pending');
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);

  const id = toStr(serviceman?._id);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await getMyBookings(id);
      if (res.data.Status === 'OK') setBookings(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleStatusUpdate = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b =>
      toStr(b._id) === bookingId ? { ...b, bookingStatus: newStatus } : b
    ));
  };

  // Auto-confirm when serviceman opens a Pending booking
  const handleSelectBooking = async (b) => {
    if (b.bookingStatus === 'Pending') {
      try {
        await updateBookingStatus({ bookingId: toStr(b._id), bookingStatus: 'Confirmed' });
        const updated = { ...b, bookingStatus: 'Confirmed' };
        setBookings(prev => prev.map(x => toStr(x._id) === toStr(b._id) ? updated : x));
        setSelected(updated);
      } catch (_) { setSelected(b); }
    } else {
      setSelected(b);
    }
  };

  const counts = bookings.reduce((acc, b) => {
    acc[b.bookingStatus] = (acc[b.bookingStatus] || 0) + 1;
    return acc;
  }, {});

  // FIFO sort — oldest first, but Completed goes to bottom
  const filtered = bookings
    .filter(b => {
      const matchFilter = !filter || b.bookingStatus === filter;
      const matchSearch = !search ||
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        b.address?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      const aCompleted = a.bookingStatus === 'Completed' || a.bookingStatus === 'Cancelled';
      const bCompleted = b.bookingStatus === 'Completed' || b.bookingStatus === 'Cancelled';
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return new Date(a.createdAt) - new Date(b.createdAt); // FIFO oldest first
    });

  const totalRevenue = Math.round(bookings
    .filter(b => b.bookingStatus === 'Completed')
    .reduce((s, b) => s + Number(b.totalAmount || 0), 0));

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color="#FF4D4D" />
        <Text style={s.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Bookings 📋</Text>
        <View style={s.revenuePill}>
          <Text style={s.revenueText}>₹{totalRevenue.toLocaleString()} earned</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#555A66" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by booking no, customer..."
          placeholderTextColor="#555A66"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#555A66" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabsContent}>
        {[
          { key: '',           label: `All (${bookings.length})` },
          { key: 'Pending',    label: `⏳ Pending (${counts.Pending || 0})` },
          { key: 'Confirmed',  label: `✅ Confirmed (${counts.Confirmed || 0})` },
          { key: 'InProgress', label: `🔧 In Progress (${counts.InProgress || 0})` },
          { key: 'Completed',  label: `🎉 Completed (${counts.Completed || 0})` },
          { key: 'Cancelled',  label: `❌ Cancelled (${counts.Cancelled || 0})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, filter === tab.key && s.tabActive]}
            onPress={() => setFilter(tab.key)}>
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D4D" />}>

        {filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No bookings found</Text>
            <Text style={s.emptySub}>
              {filter === 'Pending' ? 'No pending bookings right now' : 'Try changing the filter'}
            </Text>
          </View>
        ) : (
          filtered.map(b => (
            <TouchableOpacity
              key={toStr(b._id)}
              style={s.card}
              onPress={() => handleSelectBooking(b)}
              activeOpacity={0.85}>
              {/* Top row */}
              <View style={s.cardTop}>
                <Text style={s.cardNum}>{b.bookingNumber}</Text>
                <StatusBadge status={b.bookingStatus} />
              </View>

              {/* Customer + service */}
              <View style={s.cardMid}>
                <View style={s.cardRow}>
                  <Ionicons name="person-outline" size={13} color="#555A66" />
                  <Text style={s.cardCustomer}>{b.contactPerson}</Text>
                </View>
                <View style={s.cardRow}>
                  <Ionicons name="construct-outline" size={13} color="#555A66" />
                  <Text style={s.cardService} numberOfLines={1}>{b.service?.serviceName || '—'}</Text>
                </View>
                <View style={s.cardRow}>
                  <Ionicons name="location-outline" size={13} color="#555A66" />
                  <Text style={s.cardAddress} numberOfLines={1}>{b.address}</Text>
                </View>
              </View>

              {/* Bottom row */}
              <View style={s.cardBottom}>
                <View style={s.cardRow}>
                  <Ionicons name="calendar-outline" size={12} color="#555A66" />
                  <Text style={s.cardDate}>
                    {new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={s.cardAmount}>₹{Number(b.totalAmount).toLocaleString()}</Text>
              </View>

              {/* Next action hint */}
              {NEXT_STATUS[b.bookingStatus] && (
                <View style={s.actionHint}>
                  <Ionicons name="arrow-forward-circle-outline" size={13} color="#FF6B6B" />
                  <Text style={s.actionHintText}>Tap to update status</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {selected && (
        <BookingDetailModal
          booking={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#080B0F' },
  loadingRoot:  { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { color: '#555A66', fontSize: 13 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  revenuePill:  { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  revenueText:  { fontSize: 12, fontWeight: '800', color: '#4ADE80' },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 14, height: 44, marginBottom: 14 },
  searchInput:  { flex: 1, color: '#E8EAF0', fontSize: 13 },

  tabsScroll:   { flexGrow: 0, marginBottom: 16 },
  tabsContent:  { paddingHorizontal: 20, gap: 8 },
  tab:          { backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  tabActive:    { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  tabText:      { fontSize: 12, fontWeight: '700', color: '#555A66' },
  tabTextActive:{ color: '#fff' },

  list:         { flex: 1, paddingHorizontal: 20 },

  emptyBox:     { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptySub:     { fontSize: 13, color: '#555A66', textAlign: 'center' },

  card:         { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardNum:      { fontSize: 12, fontWeight: '800', color: '#FF6B6B' },
  cardMid:      { gap: 6, marginBottom: 12 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCustomer: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardService:  { fontSize: 12, color: '#9CA3AF', flex: 1 },
  cardAddress:  { fontSize: 12, color: '#9CA3AF', flex: 1 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 10 },
  cardDate:     { fontSize: 11, color: '#555A66' },
  cardAmount:   { fontSize: 16, fontWeight: '900', color: '#4ADE80' },
  actionHint:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  actionHintText:{ fontSize: 11, color: '#FF6B6B', fontWeight: '600' },
});
