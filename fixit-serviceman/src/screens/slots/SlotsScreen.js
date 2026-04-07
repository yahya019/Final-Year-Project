import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMySlots, addSlot, deleteSlot, getMyBookings } from '../../utils/api';
import axios from 'axios';

const BASE_URL = 'http://10.241.161.126:3000';

const reduceSlotCapacity = (slotId, newTotal) =>
  axios.put(`${BASE_URL}/ServicemanSlot/Reduce`, { slotId, totalSlots: newTotal });

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const isPast = (date) => new Date(date) < new Date(new Date().setHours(0,0,0,0));

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Inline Calendar ─────────────────────────────────────────────────────────
function CalendarPicker({ selectedDate, onSelectDate, slotDates }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toISO = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  const isPastDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const isToday  = (day) => viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  const isSelected = (day) => toISO(day) === selectedDate;
  const hasSlot  = (day) => slotDates?.includes(toISO(day));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={cal.wrap}>
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#E8EAF0" />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={18} color="#E8EAF0" />
        </TouchableOpacity>
      </View>
      <View style={cal.dayRow}>
        {DAYS.map(d => <Text key={d} style={cal.dayLabel}>{d}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((day, i) => (
          <TouchableOpacity key={i}
            style={[
              cal.cell,
              day && isToday(day)    && cal.cellToday,
              day && isSelected(day) && cal.cellSelected,
              day && hasSlot(day)    && !isSelected(day) && cal.cellHasSlot,
              day && isPastDay(day)  && cal.cellPast,
            ]}
            onPress={() => day && !isPastDay(day) && onSelectDate(toISO(day))}
            disabled={!day || isPastDay(day)}
            activeOpacity={0.7}>
            {day ? (
              <>
                <Text style={[
                  cal.cellText,
                  isToday(day)    && cal.cellTextToday,
                  isSelected(day) && cal.cellTextSelected,
                  isPastDay(day)  && cal.cellTextPast,
                ]}>{day}</Text>
                {hasSlot(day) && !isSelected(day) && <View style={cal.dot} />}
              </>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  wrap:              { backgroundColor: '#0D1117', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn:            { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  monthLabel:        { fontSize: 15, fontWeight: '800', color: '#fff' },
  dayRow:            { flexDirection: 'row', marginBottom: 6 },
  dayLabel:          { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#555A66' },
  grid:              { flexDirection: 'row', flexWrap: 'wrap' },
  cell:              { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  cellToday:         { backgroundColor: 'rgba(255,77,77,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,77,77,0.4)' },
  cellSelected:      { backgroundColor: '#FF4D4D' },
  cellHasSlot:       { backgroundColor: 'rgba(74,222,128,0.1)' },
  cellPast:          { opacity: 0.25 },
  cellText:          { fontSize: 13, fontWeight: '600', color: '#E8EAF0' },
  cellTextToday:     { color: '#FF6B6B', fontWeight: '800' },
  cellTextSelected:  { color: '#fff', fontWeight: '900' },
  cellTextPast:      { color: '#555A66' },
  dot:               { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4ADE80', position: 'absolute', bottom: 4 },
});

// ── Slot Bookings Modal ──────────────────────────────────────────────────────
function SlotBookingsModal({ slot, bookings, visible, onClose, onReduceSlots, onDelete }) {
  if (!slot) return null;

  const slotDateStr  = new Date(slot.availableDate).toISOString().split('T')[0];
  const slotBookings = bookings.filter(b => {
    const bDate = new Date(b.bookingDate).toISOString().split('T')[0];
    return bDate === slotDateStr && toStr(b.availableSlotId) === toStr(slot._id);
  });

  const totalSlots  = slot.totalSlots  || 0;
  const bookedSlots = slot.bookedSlots || 0;
  const available   = totalSlots - bookedSlots;

  // Build array of all slots — first N are booked, rest are empty
  const allSlots = Array.from({ length: totalSlots }, (_, i) => ({
    index:   i + 1,
    booked:  i < slotBookings.length,
    booking: slotBookings[i] || null,
  }));

  const handleDeleteOneEmpty = () => {
    if (available <= 0) return;
    const newTotal = totalSlots - 1;
    Alert.alert(
      'Remove 1 Empty Slot',
      `Reduce total slots from ${totalSlots} to ${newTotal}?\n\nOnly empty slots can be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (newTotal === 0) {
              onClose();
              onDelete(toStr(slot._id), new Date(slot.availableDate).toLocaleDateString('en-IN'));
            } else {
              onClose();
              onReduceSlots(toStr(slot._id), newTotal);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sb.overlay}>
        <View style={sb.sheet}>

          {/* Header */}
          <View style={sb.header}>
            <View>
              <Text style={sb.title}>📅 Slot Details</Text>
              <Text style={sb.sub}>
                {new Date(slot.availableDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sb.closeBtn}>
              <Ionicons name="close" size={20} color="#555A66" />
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={sb.stats}>
            <View style={sb.statItem}>
              <Text style={sb.statValue}>{totalSlots}</Text>
              <Text style={sb.statLabel}>Total</Text>
            </View>
            <View style={sb.statItem}>
              <Text style={[sb.statValue, { color: '#FF4D4D' }]}>{bookedSlots}</Text>
              <Text style={sb.statLabel}>Booked</Text>
            </View>
            <View style={sb.statItem}>
              <Text style={[sb.statValue, { color: '#4ADE80' }]}>{available}</Text>
              <Text style={sb.statLabel}>Available</Text>
            </View>
          </View>

          {/* Individual slot boxes */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={sb.slotsLabel}>SLOT BREAKDOWN</Text>
            {allSlots.map(item => (
              item.booked ? (
                // ── Booked slot ──────────────────────────────
                <View key={item.index} style={sb.bookedCard}>
                  <View style={sb.bookedLeft}>
                    <View style={sb.slotNumBadge}>
                      <Text style={sb.slotNumText}>#{item.index}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sb.bookedCustomer}>
                        {item.booking?.customer?.fullName || item.booking?.contactPerson || '—'}
                      </Text>
                      <Text style={sb.bookedService}>
                        {item.booking?.service?.serviceName || '—'}
                      </Text>
                      <Text style={sb.bookedAmount}>
                        ₹{Math.round(Number(item.booking?.totalAmount || 0))}
                      </Text>
                    </View>
                  </View>
                  <View style={[sb.statusPill, {
                    backgroundColor: item.booking?.bookingStatus === 'Completed'
                      ? 'rgba(74,222,128,0.12)' : 'rgba(250,204,21,0.12)'
                  }]}>
                    <Text style={[sb.statusText, {
                      color: item.booking?.bookingStatus === 'Completed' ? '#4ADE80' : '#FACC15'
                    }]}>
                      {item.booking?.bookingStatus || 'Booked'}
                    </Text>
                  </View>
                </View>
              ) : (
                // ── Empty slot ───────────────────────────────
                <View key={item.index} style={sb.emptyCard}>
                  <View style={sb.bookedLeft}>
                    <View style={[sb.slotNumBadge, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                      <Text style={[sb.slotNumText, { color: '#555A66' }]}>#{item.index}</Text>
                    </View>
                    <View>
                      <Text style={sb.emptyTitle}>Empty Slot</Text>
                      <Text style={sb.emptyHint}>Available for booking</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={sb.deleteOneBtn} onPress={handleDeleteOneEmpty} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={14} color="#F87171" />
                    <Text style={sb.deleteOneBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sb = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:           { fontSize: 18, fontWeight: '900', color: '#fff' },
  sub:             { fontSize: 12, color: '#555A66', marginTop: 2 },
  closeBtn:        { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  stats:           { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, marginBottom: 16, justifyContent: 'space-around' },
  statItem:        { alignItems: 'center' },
  statValue:       { fontSize: 24, fontWeight: '900', color: '#fff' },
  statLabel:       { fontSize: 11, color: '#555A66', marginTop: 2 },
  slotsLabel:      { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 10 },

  // Booked slot card
  bookedCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,77,77,0.06)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  bookedLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  slotNumBadge:    { width: 32, height: 32, backgroundColor: 'rgba(255,77,77,0.15)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  slotNumText:     { fontSize: 11, fontWeight: '800', color: '#FF6B6B' },
  bookedCustomer:  { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  bookedService:   { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  bookedAmount:    { fontSize: 13, fontWeight: '800', color: '#4ADE80' },
  statusPill:      { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:      { fontSize: 10, fontWeight: '700' },

  // Empty slot card
  emptyCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' },
  emptyTitle:      { fontSize: 13, fontWeight: '600', color: '#555A66' },
  emptyHint:       { fontSize: 11, color: '#3A3D45', marginTop: 2 },
  deleteOneBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  deleteOneBtnText:{ fontSize: 11, fontWeight: '700', color: '#F87171' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function SlotsScreen() {
  const { serviceman } = useAuth();
  const [slots,        setSlots]        = useState([]);
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [totalSlots,   setTotalSlots]   = useState('');
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState(false);
  const [selSlot,      setSelSlot]      = useState(null);
  const id = toStr(serviceman?._id);

  const fetchAll = useCallback(async () => {
    try {
      const [slotRes, bookRes] = await Promise.allSettled([
        getMySlots(id),
        getMyBookings(id),
      ]);
      if (slotRes.status === 'fulfilled' && slotRes.value.data.Status === 'OK') setSlots(slotRes.value.data.Result);
      if (bookRes.status === 'fulfilled' && bookRes.value.data.Status === 'OK') setBookings(bookRes.value.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const slotDates = slots.map(s => new Date(s.availableDate).toISOString().split('T')[0]);

  const handleAddSlot = async () => {
    setError('');
    if (!selectedDate) return setError('Please select a date from the calendar');
    if (!totalSlots || Number(totalSlots) <= 0) return setError('Enter valid total slots');
    const exists = slots.find(s => new Date(s.availableDate).toISOString().split('T')[0] === selectedDate);
    if (exists) return setError('Slot already exists for this date');
    setSaving(true);
    try {
      const res = await addSlot({ servicemanId: id, availableDate: selectedDate, totalSlots: Number(totalSlots) });
      if (res.data.Status === 'OK') {
        setTotalSlots('');
        setSelectedDate('');
        fetchAll();
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed to add slot'); }
    finally { setSaving(false); }
  };

  const handleDelete = (slotId, date) => {
    Alert.alert('Delete Slot', `Delete slot for ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteSlot(slotId); fetchAll(); } catch (_) {}
      }},
    ]);
  };

  const handleReduceSlots = async (slotId, newTotal) => {
    try {
      const res = await reduceSlotCapacity(slotId, newTotal);
      if (res.data.Status === 'OK') {
        fetchAll();
        Alert.alert('✅ Done', 'Empty slots have been removed successfully.');
      } else {
        Alert.alert('Error', res.data.Result || 'Failed to reduce slots');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not reduce slots. Try again.');
    }
  };

  const upcoming = slots.filter(s => !isPast(s.availableDate)).sort((a, b) => new Date(a.availableDate) - new Date(b.availableDate));
  const past     = slots.filter(s => isPast(s.availableDate)).sort((a, b) => new Date(b.availableDate) - new Date(a.availableDate));

  if (loading) return <View style={s.loadingRoot}><ActivityIndicator size="large" color="#FF4D4D" /></View>;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#FF4D4D" />}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Slots 📅</Text>
        <Text style={s.headerSub}>{upcoming.length} upcoming • {past.length} past</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon: '📅', label: 'Total Slots',  value: slots.length,                                              color: '#60A5FA' },
          { icon: '✅', label: 'Booked',       value: slots.reduce((s, x) => s + (x.bookedSlots || 0), 0),      color: '#FF4D4D' },
          { icon: '🟢', label: 'Available',    value: slots.reduce((s, x) => s + Math.max(0, (x.totalSlots || 0) - (x.bookedSlots || 0)), 0), color: '#4ADE80' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar */}
      <Text style={s.sectionTitle}>Select Date to Add Slot</Text>
      <CalendarPicker
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        slotDates={slotDates}
      />

      {/* Add Slot Form */}
      {selectedDate ? (
        <View style={s.addForm}>
          <View style={s.addFormHeader}>
            <Ionicons name="calendar" size={16} color="#FF4D4D" />
            <Text style={s.addFormDate}>
              {(() => {
                const [y,m,d] = selectedDate.split('-');
                return new Date(Number(y), Number(m)-1, Number(d))
                  .toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
              })()}
            </Text>
          </View>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
          {slotDates.includes(selectedDate) ? (
            <View style={s.existsBox}>
              <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
              <Text style={s.existsText}>Slot already exists for this date</Text>
            </View>
          ) : (
            <>
              <Text style={s.label}>TOTAL SLOTS</Text>
              <View style={s.slotCountRow}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setTotalSlots(String(n))}
                    style={[s.slotBtn, totalSlots === String(n) && s.slotBtnActive]}>
                    <Text style={[s.slotBtnText, totalSlots === String(n) && s.slotBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.addBtn} onPress={handleAddSlot} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.addBtnText}>➕ Add Slot</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <View style={s.hintBox}>
          <Ionicons name="finger-print-outline" size={20} color="#555A66" />
          <Text style={s.hintText}>Tap a date on the calendar above to add a slot</Text>
        </View>
      )}

      {/* Upcoming slots */}
      {upcoming.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Upcoming Slots</Text>
          {upcoming.map(slot => {
            const available = slot.totalSlots - (slot.bookedSlots || 0);
            const pct = slot.totalSlots > 0 ? (slot.bookedSlots || 0) / slot.totalSlots : 0;
            return (
              <TouchableOpacity key={toStr(slot._id)} style={s.slotCard} onPress={() => setSelSlot(slot)} activeOpacity={0.85}>
                <View style={s.slotCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.slotDate}>
                      {new Date(slot.availableDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={s.slotSub}>{slot.bookedSlots || 0} booked • {available} available</Text>
                  </View>
                </View>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: pct >= 1 ? '#F87171' : pct >= 0.7 ? '#FACC15' : '#4ADE80' }]} />
                </View>
                <Text style={s.tapHint}>👆 Tap to manage bookings</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Past slots */}
      {past.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { color: '#555A66' }]}>Past Slots</Text>
          {past.slice(0, 5).map(slot => (
            <TouchableOpacity key={toStr(slot._id)} style={[s.slotCard, { opacity: 0.6 }]} onPress={() => setSelSlot(slot)} activeOpacity={0.85}>
              <Text style={s.slotDate}>
                {new Date(slot.availableDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={s.slotSub}>{slot.bookedSlots || 0} / {slot.totalSlots} booked</Text>
              <Text style={s.tapHint}>👆 Tap to see bookings</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <View style={{ height: 24 }} />

      <SlotBookingsModal
        slot={selSlot}
        bookings={bookings}
        visible={!!selSlot}
        onClose={() => setSelSlot(null)}
        onReduceSlots={handleReduceSlots}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  scroll:        { padding: 20, paddingTop: 56 },
  loadingRoot:   { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center' },
  header:        { marginBottom: 20 },
  headerTitle:   { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:     { fontSize: 12, color: '#555A66', marginTop: 4 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:      { flex: 1, backgroundColor: '#0D1117', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statIcon:      { fontSize: 20, marginBottom: 4 },
  statValue:     { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel:     { fontSize: 10, fontWeight: '700', color: '#555A66' },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: '#9CA3AF', marginBottom: 12, letterSpacing: 0.5 },
  addForm:       { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.2)' },
  addFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  addFormDate:   { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  errorBox:      { backgroundColor: '#2A1222', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText:     { color: '#F87171', fontSize: 12 },
  existsBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: 10, padding: 12 },
  existsText:    { color: '#4ADE80', fontSize: 13 },
  label:         { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 10 },
  slotCountRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  slotBtn:       { flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  slotBtnActive: { backgroundColor: 'rgba(255,77,77,0.15)', borderColor: 'rgba(255,77,77,0.4)' },
  slotBtnText:   { fontSize: 16, fontWeight: '700', color: '#555A66' },
  slotBtnTextActive: { color: '#FF4D4D' },
  addBtn:        { height: 48, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  addBtnText:    { color: '#fff', fontSize: 14, fontWeight: '800' },
  hintBox:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 24 },
  hintText:      { color: '#555A66', fontSize: 13 },
  slotCard:      { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  slotCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  slotDate:      { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  slotSub:       { fontSize: 12, color: '#9CA3AF' },
  slotRight:     { flexDirection: 'row', gap: 8 },
  deleteBtn:     { width: 36, height: 36, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  progressBg:    { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', borderRadius: 3 },
  tapHint:       { fontSize: 11, color: '#555A66', fontWeight: '600' },
});
