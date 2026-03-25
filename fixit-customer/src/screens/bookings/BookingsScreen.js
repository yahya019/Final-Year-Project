import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, StatusBar,
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
  Pending:    { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: '🕐' },
  Confirmed:  { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: '✅' },
  InProgress: { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: '🔧' },
  Completed:  { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: '🎉' },
  Cancelled:  { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: '❌' },
};

function ReviewModal({ booking, visible, onClose }) {
  const { customer } = useAuth();
  const [rating, setRating]   = useState(5);
  const [review, setReview]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await createReview({
        customerId: toStr(customer._id), bookingId: toStr(booking._id),
        servicemanId: toStr(booking.servicemanId), serviceId: toStr(booking.serviceId),
        rating, review: review.trim() || null,
      });
      if (res.data.Status === 'OK') {
        setSuccess('Review submitted! Thank you 🎉');
        setTimeout(() => { onClose(); setRating(5); setReview(''); setSuccess(''); }, 1500);
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>Rate Your Experience ⭐</Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
          </View>
          {error   ? <View style={m.errorBox}><Text style={m.errorText}>{error}</Text></View> : null}
          {success ? <View style={m.successBox}><Text style={m.successText}>{success}</Text></View> : null}
          <Text style={m.label}>YOUR RATING</Text>
          <View style={m.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[m.star, { color: n <= rating ? '#F59E0B' : '#E5E7EB' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={m.label}>WRITE A REVIEW (optional)</Text>
          <TextInput style={m.textarea} placeholder="Share your experience..." placeholderTextColor="#9CA3AF" value={review} onChangeText={setReview} multiline numberOfLines={3} textAlignVertical="top" />
          <TouchableOpacity style={m.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={m.btnText}>Submit Review</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
        customerId: toStr(customer._id), bookingId: toStr(booking._id),
        servicemanId: toStr(booking.servicemanId), message: message.trim(),
      });
      if (res.data.Status === 'OK') {
        setSuccess('Complaint submitted! We will look into it.');
        setTimeout(() => { onClose(); setMessage(''); setSuccess(''); }, 1500);
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>File a Complaint 🚩</Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
          </View>
          {error   ? <View style={m.errorBox}><Text style={m.errorText}>{error}</Text></View> : null}
          {success ? <View style={m.successBox}><Text style={m.successText}>{success}</Text></View> : null}
          <Text style={m.label}>DESCRIBE YOUR ISSUE</Text>
          <TextInput style={[m.textarea, { height: 100 }]} placeholder="What went wrong?" placeholderTextColor="#9CA3AF" value={message} onChangeText={setMessage} multiline numberOfLines={4} textAlignVertical="top" />
          <TouchableOpacity style={[m.btn, { backgroundColor: '#EF4444' }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={m.btnText}>Submit Complaint</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontSize: 18, fontWeight: '900', color: '#1A1D23' },
  closeBtn:   { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  errorBox:   { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText:  { color: '#EF4444', fontSize: 13 },
  successBox: { backgroundColor: '#ECFDF5', borderRadius: 10, padding: 12, marginBottom: 14 },
  successText:{ color: '#10B981', fontSize: 13 },
  label:      { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10 },
  starsRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  star:       { fontSize: 44 },
  textarea:   { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, padding: 14, fontSize: 14, color: '#1A1D23', height: 80, marginBottom: 20 },
  btn:        { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});

function BookingDetailModal({ booking, visible, onClose }) {
  const [showReview,    setShowReview]    = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  if (!booking) return null;
  const c = STATUS[booking.bookingStatus] || STATUS.Pending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={d.sheet}>
          <View style={d.handle} />
          <View style={d.header}>
            <View>
              <Text style={d.bookingNum}>{booking.bookingNumber}</Text>
              <View style={[d.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
                <Text style={[d.badgeText, { color: c.color }]}>{c.icon} {booking.bookingStatus}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={d.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { icon: '🛠️', label: 'Service',     value: booking.service?.serviceName || '—' },
              { icon: '📅', label: 'Booking Date', value: new Date(booking.bookingDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) },
              { icon: '📍', label: 'Address',      value: booking.address },
              { icon: '💳', label: 'Payment',      value: `${booking.paymentMode} • ${booking.paymentStatus}` },
            ].map(r => (
              <View key={r.label} style={d.infoRow}>
                <Text style={d.infoIcon}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={d.infoLabel}>{r.label}</Text>
                  <Text style={d.infoValue}>{r.value}</Text>
                </View>
              </View>
            ))}

            <View style={d.amountBox}>
              <Text style={d.amountLabel}>Total Amount</Text>
              <Text style={d.amountValue}>₹{Math.round(Number(booking.totalAmount))}</Text>
            </View>

            {booking.bookingStatus === 'Completed' && (
              <View style={d.actionsRow}>
                <TouchableOpacity style={d.rateBtn} onPress={() => setShowReview(true)}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={d.rateBtnText}>Rate Service</Text>
                </TouchableOpacity>
                <TouchableOpacity style={d.complainBtn} onPress={() => setShowComplaint(true)}>
                  <Ionicons name="flag" size={16} color="#EF4444" />
                  <Text style={d.complainBtnText}>Complaint</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
      <ReviewModal    booking={booking} visible={showReview}    onClose={() => setShowReview(false)} />
      <ComplaintModal booking={booking} visible={showComplaint} onClose={() => setShowComplaint(false)} />
    </Modal>
  );
}

const d = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%' },
  handle:       { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bookingNum:   { fontSize: 13, fontWeight: '800', color: '#FF4D4D', marginBottom: 6 },
  badge:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  closeBtn:     { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:     { fontSize: 18, marginTop: 1 },
  infoLabel:    { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 },
  infoValue:    { fontSize: 14, fontWeight: '600', color: '#1A1D23' },
  amountBox:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 14, padding: 16, marginTop: 16, marginBottom: 16 },
  amountLabel:  { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  amountValue:  { fontSize: 22, fontWeight: '900', color: '#10B981' },
  actionsRow:   { flexDirection: 'row', gap: 10 },
  rateBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#FDE68A', borderRadius: 14 },
  rateBtnText:  { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  complainBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 14 },
  complainBtnText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
});

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

  const counts   = bookings.reduce((acc, b) => { acc[b.bookingStatus] = (acc[b.bookingStatus] || 0) + 1; return acc; }, {});
  const filtered = filter ? bookings.filter(b => b.bookingStatus === filter) : bookings;

  if (loading) return <View style={s.loadingRoot}><StatusBar barStyle="dark-content" /><ActivityIndicator size="large" color="#FF4D4D" /></View>;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <View style={s.header}>
        <Text style={s.headerTitle}>My Bookings</Text>
        <Text style={s.headerSub}>{bookings.length} total</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {[
          { key: '', label: `All (${bookings.length})` },
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
              <View style={s.cardLeft}>
                <View style={[s.cardIconWrap, { backgroundColor: c.bg }]}>
                  <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                </View>
              </View>
              <View style={s.cardMid}>
                <Text style={s.cardNum}>{b.bookingNumber}</Text>
                <Text style={s.cardService} numberOfLines={1}>{b.service?.serviceName || '—'}</Text>
                <Text style={s.cardAddress} numberOfLines={1}>{b.address}</Text>
                <Text style={s.cardDate}>{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={s.cardRight}>
                <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Text style={[s.badgeText, { color: c.color }]}>{b.bookingStatus}</Text>
                </View>
                <Text style={s.cardAmount}>₹{Math.round(Number(b.totalAmount))}</Text>
                {b.bookingStatus === 'Completed' && (
                  <Text style={s.rateHint}>⭐ Rate</Text>
                )}
              </View>
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
  root:          { flex: 1, backgroundColor: '#F5F6FA' },
  loadingRoot:   { flex: 1, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center' },
  header:        { padding: 20, paddingTop: 56 },
  headerTitle:   { fontSize: 24, fontWeight: '900', color: '#1A1D23' },
  headerSub:     { fontSize: 13, color: '#6B7280', marginTop: 2 },
  tabsScroll:    { flexGrow: 0, marginBottom: 12 },
  tabsContent:   { paddingHorizontal: 20, gap: 8 },
  tab:           { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  tabActive:     { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  tabText:       { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  list:          { flex: 1, paddingHorizontal: 20 },
  emptyBox:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: '#1A1D23' },
  card:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardLeft:      { },
  cardIconWrap:  { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardMid:       { flex: 1 },
  cardNum:       { fontSize: 11, fontWeight: '700', color: '#FF4D4D', marginBottom: 2 },
  cardService:   { fontSize: 14, fontWeight: '700', color: '#1A1D23', marginBottom: 2 },
  cardAddress:   { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  cardDate:      { fontSize: 11, color: '#9CA3AF' },
  cardRight:     { alignItems: 'flex-end', gap: 4 },
  badge:         { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontWeight: '700' },
  cardAmount:    { fontSize: 15, fontWeight: '900', color: '#1A1D23' },
  rateHint:      { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
});
