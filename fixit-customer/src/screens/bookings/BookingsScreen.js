import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, createReview, createComplaint } from '../../utils/api';

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

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ booking, visible, onClose }) {
  const { customer } = useAuth();
  const [rating,  setRating]  = useState(5);
  const [review,  setReview]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await createReview({
        customerId:   toStr(customer._id),
        bookingId:    toStr(booking._id),
        servicemanId: toStr(booking.servicemanId),
        serviceId:    toStr(booking.serviceId),
        rating,
        review: review.trim() || null,
      });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Review submitted!');
        setTimeout(() => { onClose(); setRating(5); setReview(''); setSuccess(''); }, 1500);
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>Rate Your Experience ⭐</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#555A66" /></TouchableOpacity>
          </View>
          {error   ? <View style={m.errorBox}><Text style={m.errorText}>{error}</Text></View> : null}
          {success ? <View style={m.successBox}><Text style={m.successText}>{success}</Text></View> : null}
          <Text style={m.label}>YOUR RATING</Text>
          <View style={m.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[m.star, { color: n <= rating ? '#FACC15' : '#2A2D35' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={m.label}>REVIEW (optional)</Text>
          <View style={[m.inputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
            <TextInput style={[m.input, { textAlignVertical: 'top' }]} placeholder="Share your experience..." placeholderTextColor="#555A66" value={review} onChangeText={setReview} multiline numberOfLines={3} />
          </View>
          <TouchableOpacity style={m.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={m.btnText}>Submit Review</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Complaint Modal ───────────────────────────────────────────────────────────
function ComplaintModal({ booking, visible, onClose }) {
  const { customer } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!message.trim() || message.trim().length < 5) return setError('Message must be at least 5 characters');
    setLoading(true);
    try {
      const res = await createComplaint({
        customerId:   toStr(customer._id),
        bookingId:    toStr(booking._id),
        servicemanId: toStr(booking.servicemanId),
        message:      message.trim(),
      });
      if (res.data.Status === 'OK') {
        setSuccess('✅ Complaint submitted!');
        setTimeout(() => { onClose(); setMessage(''); setSuccess(''); }, 1500);
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>File a Complaint 📝</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#555A66" /></TouchableOpacity>
          </View>
          {error   ? <View style={m.errorBox}><Text style={m.errorText}>{error}</Text></View> : null}
          {success ? <View style={m.successBox}><Text style={m.successText}>{success}</Text></View> : null}
          <Text style={m.label}>COMPLAINT MESSAGE</Text>
          <View style={[m.inputWrap, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
            <TextInput style={[m.input, { textAlignVertical: 'top' }]} placeholder="Describe your issue..." placeholderTextColor="#555A66" value={message} onChangeText={setMessage} multiline numberOfLines={4} />
          </View>
          <TouchableOpacity style={[m.btn, { backgroundColor: '#F87171' }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={m.btnText}>Submit Complaint</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  errorBox:   { backgroundColor: '#2A1222', borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:  { color: '#F87171', fontSize: 12 },
  successBox: { backgroundColor: '#1A2A1A', borderRadius: 8, padding: 12, marginBottom: 14 },
  successText:{ color: '#4ADE80', fontSize: 12 },
  label:      { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  starsRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  star:       { fontSize: 40 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 20 },
  input:      { flex: 1, color: '#E8EAF0', fontSize: 14 },
  btn:        { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({ booking, visible, onClose }) {
  const [showReview,    setShowReview]    = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  if (!booking) return null;
  const c = STATUS[booking.bookingStatus] || STATUS.Pending;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={d.sheet}>
          <View style={d.header}>
            <View>
              <Text style={d.bookingNum}>{booking.bookingNumber}</Text>
              <View style={[d.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
                <Text style={[d.badgeText, { color: c.color }]}>{c.icon} {booking.bookingStatus}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={d.closeBtn}>
              <Ionicons name="close" size={20} color="#555A66" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={d.infoGrid}>
              {[
                { icon: '🛠️', label: 'Service',     value: booking.service?.serviceName || '—' },
                { icon: '📅', label: 'Booking Date', value: new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { icon: '💳', label: 'Payment',      value: `${booking.paymentMode} • ${booking.paymentStatus}` },
              ].map(r => (
                <View key={r.label} style={d.infoRow}>
                  <Text style={d.infoIcon}>{r.icon}</Text>
                  <View>
                    <Text style={d.infoLabel}>{r.label}</Text>
                    <Text style={d.infoValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={d.addressBox}>
              <Ionicons name="location" size={13} color="#FF6B6B" />
              <Text style={d.addressText}>{booking.address}</Text>
            </View>
            <View style={d.amountBox}>
              <Text style={d.amountLabel}>Total Amount</Text>
              <Text style={d.amountValue}>₹{Number(booking.totalAmount).toLocaleString()}</Text>
            </View>
            {booking.bookingStatus === 'Completed' && (
              <View style={d.actionsRow}>
                <TouchableOpacity style={d.reviewBtn} onPress={() => setShowReview(true)}>
                  <Ionicons name="star-outline" size={16} color="#FACC15" />
                  <Text style={d.reviewBtnText}>Rate Service</Text>
                </TouchableOpacity>
                <TouchableOpacity style={d.complaintBtn} onPress={() => setShowComplaint(true)}>
                  <Ionicons name="flag-outline" size={16} color="#F87171" />
                  <Text style={d.complaintBtnText}>Complaint</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      <ReviewModal    booking={booking} visible={showReview}    onClose={() => setShowReview(false)} />
      <ComplaintModal booking={booking} visible={showComplaint} onClose={() => setShowComplaint(false)} />
    </Modal>
  );
}

const d = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bookingNum:   { fontSize: 13, fontWeight: '800', color: '#FF6B6B', marginBottom: 6 },
  badge:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText:    { fontSize: 11, fontWeight: '800' },
  closeBtn:     { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoGrid:     { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoIcon:     { fontSize: 16, width: 24 },
  infoLabel:    { fontSize: 10, fontWeight: '700', color: '#555A66', marginBottom: 2 },
  infoValue:    { fontSize: 13, fontWeight: '600', color: '#E8EAF0' },
  addressBox:   { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,77,77,0.05)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,77,77,0.1)' },
  addressText:  { flex: 1, fontSize: 13, color: '#E8EAF0', lineHeight: 18 },
  amountBox:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  amountLabel:  { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  amountValue:  { fontSize: 18, fontWeight: '900', color: '#4ADE80' },
  actionsRow:   { flexDirection: 'row', gap: 10, marginBottom: 8 },
  reviewBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, backgroundColor: 'rgba(250,204,21,0.1)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.25)', borderRadius: 12 },
  reviewBtnText:{ fontSize: 13, fontWeight: '800', color: '#FACC15' },
  complaintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)', borderRadius: 12 },
  complaintBtnText: { fontSize: 13, fontWeight: '800', color: '#F87171' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const { customer } = useAuth();
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const id = toStr(customer?._id);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await getMyBookings(id);
      if (res.data.Status === 'OK') setBookings(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const counts = bookings.reduce((acc, b) => { acc[b.bookingStatus] = (acc[b.bookingStatus] || 0) + 1; return acc; }, {});
  const filtered = filter ? bookings.filter(b => b.bookingStatus === filter) : bookings;

  if (loading) return <View style={s.loadingRoot}><ActivityIndicator size="large" color="#FF4D4D" /></View>;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Bookings 📋</Text>
        <Text style={s.headerSub}>{bookings.length} total bookings</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {[
          { key: '',           label: `All (${bookings.length})` },
          { key: 'Pending',    label: `🕐 Pending (${counts.Pending || 0})` },
          { key: 'Confirmed',  label: `✅ Confirmed (${counts.Confirmed || 0})` },
          { key: 'InProgress', label: `🔧 In Progress (${counts.InProgress || 0})` },
          { key: 'Completed',  label: `🎉 Completed (${counts.Completed || 0})` },
          { key: 'Cancelled',  label: `❌ Cancelled (${counts.Cancelled || 0})` },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[s.tab, filter === tab.key && s.tabActive]} onPress={() => setFilter(tab.key)}>
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor="#FF4D4D" />}>
        {filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No bookings found</Text>
          </View>
        ) : filtered.map(b => {
          const c = STATUS[b.bookingStatus] || STATUS.Pending;
          return (
            <TouchableOpacity key={toStr(b._id)} style={s.card} onPress={() => setSelected(b)} activeOpacity={0.85}>
              <View style={s.cardTop}>
                <Text style={s.cardNum}>{b.bookingNumber}</Text>
                <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Text style={[s.badgeText, { color: c.color }]}>{c.icon} {b.bookingStatus}</Text>
                </View>
              </View>
              <View style={s.cardMid}>
                <View style={s.cardRow}>
                  <Ionicons name="construct-outline" size={13} color="#555A66" />
                  <Text style={s.cardService} numberOfLines={1}>{b.service?.serviceName || '—'}</Text>
                </View>
                <View style={s.cardRow}>
                  <Ionicons name="location-outline" size={13} color="#555A66" />
                  <Text style={s.cardAddress} numberOfLines={1}>{b.address}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.cardDate}>{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                <Text style={s.cardAmount}>₹{Number(b.totalAmount).toLocaleString()}</Text>
              </View>
              {b.bookingStatus === 'Completed' && (
                <View style={s.rateHint}>
                  <Ionicons name="star-outline" size={12} color="#FACC15" />
                  <Text style={s.rateHintText}>Tap to rate or file complaint</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
      {selected && <BookingDetailModal booking={selected} visible={!!selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  loadingRoot:   { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center' },
  header:        { padding: 20, paddingTop: 56 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:     { fontSize: 12, color: '#555A66', marginTop: 2 },
  tabsScroll:    { flexGrow: 0, marginBottom: 12 },
  tabsContent:   { paddingHorizontal: 20, gap: 8 },
  tab:           { backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  tabActive:     { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  tabText:       { fontSize: 11, fontWeight: '700', color: '#555A66' },
  tabTextActive: { color: '#fff' },
  list:          { flex: 1, paddingHorizontal: 20 },
  emptyBox:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  card:          { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNum:       { fontSize: 12, fontWeight: '800', color: '#FF6B6B' },
  badge:         { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText:     { fontSize: 11, fontWeight: '800' },
  cardMid:       { gap: 6, marginBottom: 10 },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardService:   { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  cardAddress:   { fontSize: 12, color: '#9CA3AF', flex: 1 },
  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 10 },
  cardDate:      { fontSize: 11, color: '#555A66' },
  cardAmount:    { fontSize: 15, fontWeight: '900', color: '#4ADE80' },
  rateHint:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rateHintText:  { fontSize: 11, color: '#FACC15', fontWeight: '600' },
});
