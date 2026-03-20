import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMySlots, addSlot, deleteSlot } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

const isToday = (date) => new Date(date).toDateString() === new Date().toDateString();
const isPast  = (date) => new Date(date) < new Date(new Date().setHours(0,0,0,0));

// ── Add Slot Modal ──────────────────────────────────────────────────────────
function AddSlotModal({ visible, onClose, onSuccess, servicemanId }) {
  const [date,       setDate]       = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const reset = () => { setDate(''); setTotalSlots(''); setError(''); };

  const handleAdd = async () => {
    setError('');
    if (!date.trim())       return setError('Date is required (YYYY-MM-DD)');
    if (!totalSlots.trim()) return setError('Total slots is required');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return setError('Date format must be YYYY-MM-DD');

    const selectedDate = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (selectedDate < today) return setError('Cannot create slot for past date');

    if (isNaN(Number(totalSlots)) || Number(totalSlots) <= 0)
      return setError('Total slots must be a positive number');

    setLoading(true);
    try {
      const res = await addSlot({
        servicemanId,
        availableDate: date,
        totalSlots:    Number(totalSlots),
      });
      if (res.data.Status === 'OK') {
        reset();
        onSuccess();
        onClose();
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to add slot');
    } finally {
      setLoading(false);
    }
  };

  // Quick date buttons
  const quickDates = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    quickDates.push({
      label: i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }),
      value: d.toISOString().split('T')[0],
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={m.sheet}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>Add New Slot 📅</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={22} color="#555A66" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={m.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#F87171" />
              <Text style={m.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Quick date select */}
          <Text style={m.label}>QUICK SELECT DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {quickDates.map(d => (
              <TouchableOpacity
                key={d.value}
                onPress={() => setDate(d.value)}
                style={[m.quickBtn, date === d.value && m.quickBtnActive]}>
                <Text style={[m.quickBtnText, date === d.value && m.quickBtnTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={m.label}>DATE (YYYY-MM-DD)</Text>
          <View style={m.inputWrap}>
            <Ionicons name="calendar-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput
              style={m.input}
              placeholder="e.g. 2026-03-25"
              placeholderTextColor="#555A66"
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
            />
          </View>

          <Text style={m.label}>TOTAL SLOTS</Text>
          <View style={m.inputWrap}>
            <Ionicons name="people-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput
              style={m.input}
              placeholder="How many bookings can you take?"
              placeholderTextColor="#555A66"
              value={totalSlots}
              onChangeText={setTotalSlots}
              keyboardType="number-pad"
            />
          </View>

          {/* Slot count quick select */}
          <View style={m.slotRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setTotalSlots(String(n))}
                style={[m.slotBtn, totalSlots === String(n) && m.slotBtnActive]}>
                <Text style={[m.slotBtnText, totalSlots === String(n) && m.slotBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={m.noteBox}>
            <Ionicons name="information-circle-outline" size={14} color="#60A5FA" />
            <Text style={m.noteText}>Total slots = max bookings you can accept on this date.</Text>
          </View>

          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={m.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.addBtn} onPress={handleAdd} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={m.addBtnText}>Add Slot</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function SlotsScreen() {
  const { serviceman } = useAuth();
  const [slots,      setSlots]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [filter,     setFilter]     = useState('upcoming'); // upcoming | past | all

  const id = toStr(serviceman?._id);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await getMySlots(id);
      if (res.data.Status === 'OK') setSlots(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const onRefresh = () => { setRefreshing(true); fetchSlots(); };

  const handleDelete = (slotId) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlot(slotId);
              setSlots(prev => prev.filter(s => toStr(s._id) !== slotId));
            } catch (_) {
              Alert.alert('Error', 'Failed to delete slot');
            }
          }
        }
      ]
    );
  };

  const upcoming = slots.filter(s => !isPast(s.availableDate));
  const past     = slots.filter(s => isPast(s.availableDate));

  const filtered = filter === 'upcoming' ? upcoming
                 : filter === 'past'     ? past
                 : slots;

  const totalAvailable = upcoming.reduce((s, sl) => s + (sl.totalSlots - sl.bookedSlots), 0);
  const totalBooked    = slots.reduce((s, sl) => s + sl.bookedSlots, 0);

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color="#FF4D4D" />
        <Text style={s.loadingText}>Loading slots...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Slots 📅</Text>
          <Text style={s.headerSub}>Manage your availability</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add Slot</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon: '📅', label: 'Total Slots',    value: slots.length,        color: '#60A5FA' },
          { icon: '🟢', label: 'Available',       value: totalAvailable,      color: '#4ADE80' },
          { icon: '📋', label: 'Total Booked',    value: totalBooked,         color: '#FB923C' },
          { icon: '⏳', label: 'Upcoming',        value: upcoming.length,     color: '#C084FC' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={s.tabs}>
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past',     label: `Past (${past.length})` },
          { key: 'all',      label: `All (${slots.length})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, filter === tab.key && s.tabActive]}
            onPress={() => setFilter(tab.key)}>
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D4D" />}>

        {filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>{filter === 'upcoming' ? '📭' : '🕐'}</Text>
            <Text style={s.emptyTitle}>
              {filter === 'upcoming' ? 'No upcoming slots' : filter === 'past' ? 'No past slots' : 'No slots yet'}
            </Text>
            {filter === 'upcoming' && (
              <Text style={s.emptySub}>Add slots so customers can book your services</Text>
            )}
            {filter === 'upcoming' && (
              <TouchableOpacity style={s.emptyAddBtn} onPress={() => setShowModal(true)}>
                <Text style={s.emptyAddBtnText}>+ Add First Slot</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(slot => {
            const available  = slot.totalSlots - slot.bookedSlots;
            const isFull     = available <= 0;
            const isSlotToday = isToday(slot.availableDate);
            const isSlotPast  = isPast(slot.availableDate);
            const pct         = slot.totalSlots > 0 ? (slot.bookedSlots / slot.totalSlots) * 100 : 0;

            return (
              <View key={toStr(slot._id)} style={[s.slotCard, isSlotPast && s.slotCardPast]}>
                {/* Date + badges */}
                <View style={s.slotTop}>
                  <View style={s.slotDateWrap}>
                    <View style={[s.slotDateBox, isSlotToday && s.slotDateBoxToday, isSlotPast && s.slotDateBoxPast]}>
                      <Text style={s.slotDateDay}>
                        {new Date(slot.availableDate).toLocaleDateString('en-IN', { day: '2-digit' })}
                      </Text>
                      <Text style={s.slotDateMonth}>
                        {new Date(slot.availableDate).toLocaleDateString('en-IN', { month: 'short' })}
                      </Text>
                    </View>
                    <View>
                      <Text style={s.slotDateFull}>{formatDate(slot.availableDate)}</Text>
                      <View style={s.badgeRow}>
                        {isSlotToday && <View style={s.todayBadge}><Text style={s.todayBadgeText}>TODAY</Text></View>}
                        {isSlotPast  && <View style={s.pastBadge}><Text style={s.pastBadgeText}>PAST</Text></View>}
                        {isFull && !isSlotPast && <View style={s.fullBadge}><Text style={s.fullBadgeText}>FULL</Text></View>}
                      </View>
                    </View>
                  </View>

                  {/* Delete button — only for future slots with no bookings */}
                  {!isSlotPast && slot.bookedSlots === 0 && (
                    <TouchableOpacity
                      onPress={() => handleDelete(toStr(slot._id))}
                      style={s.deleteBtn}>
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Slot capacity */}
                <View style={s.slotBottom}>
                  <View style={s.slotInfo}>
                    <View style={s.slotInfoItem}>
                      <Text style={s.slotInfoLabel}>TOTAL</Text>
                      <Text style={s.slotInfoValue}>{slot.totalSlots}</Text>
                    </View>
                    <View style={s.slotInfoDivider} />
                    <View style={s.slotInfoItem}>
                      <Text style={s.slotInfoLabel}>BOOKED</Text>
                      <Text style={[s.slotInfoValue, { color: '#FB923C' }]}>{slot.bookedSlots}</Text>
                    </View>
                    <View style={s.slotInfoDivider} />
                    <View style={s.slotInfoItem}>
                      <Text style={s.slotInfoLabel}>AVAILABLE</Text>
                      <Text style={[s.slotInfoValue, { color: isFull ? '#F87171' : '#4ADE80' }]}>{available}</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={s.progressWrap}>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, {
                        width: `${pct}%`,
                        backgroundColor: pct >= 100 ? '#F87171' : pct >= 60 ? '#FB923C' : '#4ADE80'
                      }]} />
                    </View>
                    <Text style={s.progressText}>{Math.round(pct)}% booked</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <AddSlotModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchSlots}
        servicemanId={id}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#080B0F' },
  loadingRoot:     { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:     { color: '#555A66', fontSize: 13 },

  // Header
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:       { fontSize: 12, color: '#555A66', marginTop: 2 },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF4D4D', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  addBtnText:      { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Stats
  statsRow:        { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  statCard:        { flex: 1, backgroundColor: '#0D1117', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statIcon:        { fontSize: 16, marginBottom: 4 },
  statValue:       { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  statLabel:       { fontSize: 8, fontWeight: '700', color: '#555A66', textAlign: 'center' },

  // Tabs
  tabs:            { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#0D1117', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab:             { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive:       { backgroundColor: '#FF4D4D' },
  tabText:         { fontSize: 11, fontWeight: '700', color: '#555A66' },
  tabTextActive:   { color: '#fff' },

  list:            { flex: 1, paddingHorizontal: 20 },

  // Empty
  emptyBox:        { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyTitle:      { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptySub:        { fontSize: 13, color: '#555A66', textAlign: 'center', marginBottom: 20 },
  emptyAddBtn:     { backgroundColor: '#FF4D4D', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Slot card
  slotCard:        { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  slotCardPast:    { opacity: 0.6 },
  slotTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  slotDateWrap:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotDateBox:     { width: 48, height: 52, backgroundColor: 'rgba(255,77,77,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,77,77,0.3)' },
  slotDateBoxToday:{ backgroundColor: 'rgba(250,204,21,0.15)', borderColor: 'rgba(250,204,21,0.4)' },
  slotDateBoxPast: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  slotDateDay:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  slotDateMonth:   { fontSize: 10, fontWeight: '700', color: '#FF6B6B' },
  slotDateFull:    { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 },
  badgeRow:        { flexDirection: 'row', gap: 6 },
  todayBadge:      { backgroundColor: 'rgba(250,204,21,0.15)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  todayBadgeText:  { fontSize: 9, fontWeight: '800', color: '#FACC15' },
  pastBadge:       { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  pastBadgeText:   { fontSize: 9, fontWeight: '800', color: '#555A66' },
  fullBadge:       { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  fullBadgeText:   { fontSize: 9, fontWeight: '800', color: '#F87171' },
  deleteBtn:       { width: 34, height: 34, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },

  // Slot bottom
  slotBottom:      { gap: 10 },
  slotInfo:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12 },
  slotInfoItem:    { flex: 1, alignItems: 'center' },
  slotInfoDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  slotInfoLabel:   { fontSize: 9, fontWeight: '700', color: '#555A66', letterSpacing: 0.5, marginBottom: 4 },
  slotInfoValue:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  progressWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg:      { flex: 1, height: 6, backgroundColor: '#1a1d24', borderRadius: 3, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 3 },
  progressText:    { fontSize: 11, color: '#555A66', fontWeight: '600', width: 70, textAlign: 'right' },
});

const m = StyleSheet.create({
  overlay:         { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet:           { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  sheetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  errorBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:       { color: '#F87171', fontSize: 12, fontWeight: '600', flex: 1 },
  label:           { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:           { flex: 1, color: '#E8EAF0', fontSize: 14 },
  quickBtn:        { backgroundColor: '#0a0d12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  quickBtnActive:  { backgroundColor: 'rgba(255,77,77,0.15)', borderColor: 'rgba(255,77,77,0.4)' },
  quickBtnText:    { fontSize: 11, fontWeight: '700', color: '#555A66' },
  quickBtnTextActive: { color: '#FF6B6B' },
  slotRow:         { flexDirection: 'row', gap: 8, marginBottom: 16 },
  slotBtn:         { flex: 1, height: 42, backgroundColor: '#080B0F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  slotBtnActive:   { backgroundColor: 'rgba(255,77,77,0.15)', borderColor: 'rgba(255,77,77,0.4)' },
  slotBtnText:     { fontSize: 16, fontWeight: '800', color: '#555A66' },
  slotBtnTextActive: { color: '#FF6B6B' },
  noteBox:         { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(96,165,250,0.06)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.15)', borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText:        { color: '#60A5FA', fontSize: 11, flex: 1, lineHeight: 16 },
  btnRow:          { flexDirection: 'row', gap: 12 },
  cancelBtn:       { flex: 1, height: 50, backgroundColor: '#080B0F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText:   { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  addBtn:          { flex: 2, height: 50, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  addBtnText:      { color: '#fff', fontSize: 15, fontWeight: '800' },
});
