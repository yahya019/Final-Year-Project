import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform,
  KeyboardAvoidingView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getCategories, getServicesByCategory, getServicemanServices, getSlotsByServiceman, createBooking } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const CAT_ICONS  = ['🔧','⚡','❄️','🏠','🪑','🎨','🔌','🚿','🛁','🪟'];
const CAT_COLORS = ['#FFD6D6','#FFE8A3','#B3D4FF','#B2EED8','#FFD6B3','#D9B3FF','#B3F0CC','#FFB3B3','#FFE8A3','#B3D4FF'];

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (day) => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const d = new Date(viewYear, viewMonth, day);
    if (d < todayStart) return;
    // Format as YYYY-MM-DD without timezone conversion
    const yyyy = viewYear;
    const mm   = String(viewMonth + 1).padStart(2, '0');
    const dd   = String(day).padStart(2, '0');
    onSelectDate(`${yyyy}-${mm}-${dd}`);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const iso = new Date(viewYear, viewMonth, day).toISOString().split('T')[0];
    return iso === selectedDate;
  };

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    return d < todayStart;
  };

  const isToday = (day) => {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={cal.wrap}>
      {/* Month nav */}
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#1A1D23" />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={18} color="#1A1D23" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={cal.dayRow}>
        {DAYS.map(d => <Text key={d} style={cal.dayLabel}>{d}</Text>)}
      </View>

      {/* Date grid */}
      <View style={cal.grid}>
        {cells.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              cal.cell,
              day && isToday(day)    && cal.cellToday,
              day && isSelected(day) && cal.cellSelected,
              day && isPast(day)     && cal.cellPast,
            ]}
            onPress={() => day && handleSelect(day)}
            disabled={!day || isPast(day)}
            activeOpacity={0.7}>
            {day ? (
              <Text style={[
                cal.cellText,
                isToday(day)    && cal.cellTextToday,
                isSelected(day) && cal.cellTextSelected,
                isPast(day)     && cal.cellTextPast,
              ]}>{day}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {selectedDate && (
        <View style={cal.selectedBox}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={cal.selectedText}>
            Selected: {(() => {
              const [y, m, d] = selectedDate.split('-');
              return new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            })()}
          </Text>
        </View>
      )}
    </View>
  );
}

const cal = StyleSheet.create({
  wrap:              { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#E8EBF0' },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn:            { width: 34, height: 34, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8EBF0' },
  monthLabel:        { fontSize: 15, fontWeight: '800', color: '#1A1D23' },
  dayRow:            { flexDirection: 'row', marginBottom: 6 },
  dayLabel:          { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  grid:              { flexDirection: 'row', flexWrap: 'wrap' },
  cell:              { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  cellToday:         { backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FECACA' },
  cellSelected:      { backgroundColor: '#F97316' },
  cellPast:          { opacity: 0.3 },
  cellText:          { fontSize: 13, fontWeight: '600', color: '#1A1D23' },
  cellTextToday:     { color: '#FF4D4D', fontWeight: '800' },
  cellTextSelected:  { color: '#fff', fontWeight: '900' },
  cellTextPast:      { color: '#9CA3AF' },
  selectedBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10 },
  selectedText:      { fontSize: 12, fontWeight: '700', color: '#10B981', flex: 1 },
});

function BookModal({ service, serviceman, visible, onClose, onSuccess }) {
  const { customer } = useAuth();
  const [slots,      setSlots]      = useState([]);
  const [selSlot,    setSelSlot]    = useState(null);
  const [address,    setAddress]    = useState('');
  const [contact,    setContact]    = useState(customer?.contactNumber || '');
  const [person,     setPerson]     = useState(customer?.fullName || '');
  const [payment,    setPayment]    = useState('Online');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyDate, setEmergencyDate] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [error,      setError]      = useState('');

  const SURGE_PERCENT  = 20; // 20% surge for emergency
  const baseCharge     = serviceman?.charge || service?.maximumPrice || 0;
  const surgeAmount    = isEmergency ? Math.round(baseCharge * SURGE_PERCENT / 100) : 0;
  const totalAmount    = baseCharge + surgeAmount;

  useEffect(() => { if (visible && serviceman) fetchSlots(); }, [visible, serviceman]);

  const fetchSlots = async () => {
    setFetching(true);
    try {
      const res = await getSlotsByServiceman(toStr(serviceman._id));
      if (res.data.Status === 'OK') {
        const available = res.data.Result.filter(s => {
          const d = new Date(s.availableDate);
          const today = new Date(); today.setHours(0,0,0,0);
          return d >= today && (s.totalSlots - s.bookedSlots) > 0;
        });
        setSlots(available);
      }
    } catch (_) {}
    finally { setFetching(false); }
  };

  const handleBook = async () => {
    setError('');
    if (!isEmergency && !selSlot) return setError('Please select a date');
    if (isEmergency && !emergencyDate) return setError('Please select a date from the calendar');
    if (!address.trim()) return setError('Address is required');
    if (!contact.trim()) return setError('Contact number is required');
    if (!person.trim())  return setError('Contact person name is required');

    setLoading(true);
    try {
      const res = await createBooking({
        customerId:      toStr(customer._id),
        servicemanId:    toStr(serviceman._id),
        serviceId:       toStr(service._id),
        availableSlotId: isEmergency ? null : toStr(selSlot._id),
        address:         address.trim(),
        contactNumber:   contact.trim(),
        contactPerson:   person.trim(),
        paymentMode:     payment,
        paymentStatus:   payment === 'Online' ? 'Paid' : 'Pending',
        totalAmount:     baseCharge,
        surgeCharges:    surgeAmount,
        bookingDate: isEmergency
          ? (() => { const [y,m,d] = emergencyDate.split('-'); return new Date(Number(y), Number(m)-1, Number(d)).toISOString(); })()
          : selSlot.availableDate,
      });
      if (res.data.Status === 'OK') {
        Alert.alert(
          isEmergency ? '🚨 Emergency Booking Confirmed!' : '✅ Booking Confirmed!',
          isEmergency
            ? `Emergency booking placed!\nService: ₹${baseCharge} + Surge: ₹${surgeAmount} = Total: ₹${totalAmount}`
            : 'Your booking has been placed. The serviceman will confirm it shortly.',
          [{ text: 'Great!', onPress: () => { onSuccess(); onClose(); } }]
        );
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Booking failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={b.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={b.sheet}>
          <View style={b.handle} />
          <View style={b.header}>
            <Text style={b.title}>Book Service</Text>
            <TouchableOpacity onPress={onClose} style={b.closeBtn}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={b.serviceBox}>
              <Text style={b.serviceName}>{service?.serviceName}</Text>
              <Text style={b.workerName}>by {serviceman?.fullName}</Text>
              <Text style={b.price}>₹{baseCharge}</Text>
            </View>

            {/* Emergency toggle */}
            <TouchableOpacity
              style={[b.emergencyBox, isEmergency && b.emergencyBoxActive]}
              onPress={() => setIsEmergency(e => !e)}
              activeOpacity={0.85}>
              <View style={b.emergencyLeft}>
                <Text style={b.emergencyIcon}>🚨</Text>
                <View>
                  <Text style={[b.emergencyTitle, isEmergency && b.emergencyTitleActive]}>Emergency Booking</Text>
                  <Text style={b.emergencySub}>+{SURGE_PERCENT}% surge — higher priority</Text>
                </View>
              </View>
              <View style={[b.toggle, isEmergency && b.toggleActive]}>
                <View style={[b.toggleThumb, isEmergency && b.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Price breakdown */}
            <View style={b.priceBox}>
              <View style={b.priceRow}>
                <Text style={b.priceLabel}>Service Charge</Text>
                <Text style={b.priceValue}>₹{baseCharge}</Text>
              </View>
              {isEmergency && (
                <View style={b.priceRow}>
                  <Text style={[b.priceLabel, { color: '#F97316' }]}>🚨 Surge ({SURGE_PERCENT}%)</Text>
                  <Text style={[b.priceValue, { color: '#F97316' }]}>+₹{surgeAmount}</Text>
                </View>
              )}
              <View style={[b.priceRow, b.priceTotalRow]}>
                <Text style={b.priceTotalLabel}>Total</Text>
                <Text style={b.priceTotalValue}>₹{totalAmount}</Text>
              </View>
            </View>

            {error ? <View style={b.errorBox}><Text style={b.errorText}>{error}</Text></View> : null}

            {/* Date selection — slot for normal, manual for emergency */}
            {!isEmergency && (
              <>
                <Text style={b.label}>SELECT DATE *</Text>
                {fetching ? <ActivityIndicator color="#FF4D4D" style={{ marginBottom: 16 }} /> :
                  slots.length === 0
                    ? <View style={b.noSlots}><Text style={b.noSlotsText}>No available slots for this worker</Text></View>
                    : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                        {slots.map(slot => {
                          const isActive = selSlot && toStr(selSlot._id) === toStr(slot._id);
                          return (
                            <TouchableOpacity key={toStr(slot._id)} onPress={() => setSelSlot(slot)} style={[b.slotBtn, isActive && b.slotBtnActive]}>
                              <Text style={[b.slotDay, isActive && b.slotTextActive]}>{new Date(slot.availableDate).toLocaleDateString('en-IN', { weekday: 'short' })}</Text>
                              <Text style={[b.slotDate, isActive && b.slotTextActive]}>{new Date(slot.availableDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                              <Text style={[b.slotAvail, isActive && { color: '#fff' }]}>{slot.totalSlots - slot.bookedSlots} left</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
              </>
            )}

            {isEmergency && (
              <>
                <Text style={b.label}>SELECT DATE *</Text>
                <CalendarPicker
                  selectedDate={emergencyDate}
                  onSelectDate={setEmergencyDate}
                />
                <View style={b.emergencyNoteBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#F97316" />
                  <Text style={b.emergencyNoteText}>Emergency bookings are not bound by slots. The serviceman will be notified immediately.</Text>
                </View>
              </>
            )}

            {[
              { label: 'ADDRESS *',        icon: 'location-outline', value: address,  onChange: setAddress,  placeholder: 'Full service address',  keyboard: 'default' },
              { label: 'CONTACT PERSON *', icon: 'person-outline',   value: person,   onChange: setPerson,   placeholder: 'Your name',             keyboard: 'default' },
              { label: 'CONTACT NUMBER *', icon: 'call-outline',     value: contact,  onChange: setContact,  placeholder: '10-digit number',       keyboard: 'phone-pad' },
            ].map(f => (
              <View key={f.label}>
                <Text style={b.label}>{f.label}</Text>
                <View style={b.inputWrap}>
                  <Ionicons name={f.icon} size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
                  <TextInput style={b.input} placeholder={f.placeholder} placeholderTextColor="#9CA3AF" value={f.value} onChangeText={f.onChange} keyboardType={f.keyboard} />
                </View>
              </View>
            ))}

            <Text style={b.label}>PAYMENT MODE</Text>
            <View style={b.payRow}>
              {['Online', 'Cash'].map(p => (
                <TouchableOpacity key={p} style={[b.payBtn, payment === p && b.payBtnActive]} onPress={() => setPayment(p)}>
                  <Text style={[b.payBtnText, payment === p && b.payBtnTextActive]}>{p === 'Online' ? '💳 Online' : '💵 Cash'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[b.bookBtn, isEmergency && b.bookBtnEmergency]} onPress={handleBook} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={b.bookBtnText}>
                  {isEmergency ? '🚨 Emergency Book' : 'Confirm Booking'} • ₹{totalAmount}
                </Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const b = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  handle:        { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:         { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  closeBtn:      { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceBox:    { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 16, marginBottom: 16 },
  serviceName:   { fontSize: 17, fontWeight: '900', color: '#1A1D23', marginBottom: 2 },
  workerName:    { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  price:         { fontSize: 26, fontWeight: '900', color: '#10B981' },
  errorBox:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText:     { color: '#EF4444', fontSize: 13 },
  label:         { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10 },
  noSlots:       { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 18, alignItems: 'center' },
  noSlotsText:   { color: '#9CA3AF', fontSize: 13 },
  slotBtn:       { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 16, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 76 },
  slotBtnActive: { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  slotDay:       { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  slotDate:      { fontSize: 15, fontWeight: '900', color: '#1A1D23', marginBottom: 2 },
  slotAvail:     { fontSize: 10, color: '#10B981', fontWeight: '600' },
  slotTextActive:{ color: '#fff' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 18 },
  input:         { flex: 1, color: '#1A1D23', fontSize: 14 },
  payRow:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  payBtn:        { flex: 1, height: 48, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  payBtnActive:  { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  payBtnText:    { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  payBtnTextActive: { color: '#10B981' },
  bookBtn:       { height: 54, backgroundColor: '#FF4D4D', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bookBtnEmergency: { backgroundColor: '#F97316', shadowColor: '#F97316' },
  bookBtnText:   { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Emergency
  emergencyBox:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 16, padding: 16, marginBottom: 14 },
  emergencyBoxActive: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  emergencyLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyIcon:      { fontSize: 26 },
  emergencyTitle:     { fontSize: 14, fontWeight: '800', color: '#1A1D23', marginBottom: 2 },
  emergencyTitleActive: { color: '#F97316' },
  emergencySub:       { fontSize: 11, color: '#9CA3AF' },
  emergencyNoteBox:   { flexDirection: 'row', gap: 8, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12, padding: 12, marginBottom: 18 },
  emergencyNoteText:  { flex: 1, fontSize: 11, color: '#F97316', lineHeight: 16 },
  toggle:             { width: 46, height: 26, backgroundColor: '#E5E7EB', borderRadius: 13, padding: 2, justifyContent: 'center' },
  toggleActive:       { backgroundColor: '#F97316' },
  toggleThumb:        { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 11, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  toggleThumbActive:  { alignSelf: 'flex-end' },

  // Price breakdown
  priceBox:       { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 18 },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel:     { fontSize: 13, color: '#6B7280' },
  priceValue:     { fontSize: 13, fontWeight: '700', color: '#1A1D23' },
  priceTotalRow:  { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  priceTotalLabel:{ fontSize: 15, fontWeight: '800', color: '#1A1D23' },
  priceTotalValue:{ fontSize: 18, fontWeight: '900', color: '#10B981' },
});

export default function ServicesScreen({ route }) {
  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [workers,     setWorkers]     = useState([]);
  const [selCategory, setSelCategory] = useState(null);
  const [selService,  setSelService]  = useState(null);
  const [selWorker,   setSelWorker]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [fetching,    setFetching]    = useState(false);
  const [showBook,    setShowBook]    = useState(false);
  const [step,        setStep]        = useState(1);

  // Load categories once
  useEffect(() => { fetchCategories(); }, []);

  // When screen is focused with category params — jump to step 2
  useFocusEffect(
    useCallback(() => {
      const catId   = route?.params?.categoryId;
      const catName = route?.params?.categoryName;
      if (catId) {
        setSelCategory({ _id: catId, name: catName });
        setSelService(null);
        setWorkers([]);
        setStep(2);
        fetchServices(catId);
      }
    }, [route?.params?.categoryId])
  );

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data.Status === 'OK') setCategories(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const fetchServices = async (catId) => {
    setFetching(true);
    try {
      const res = await getServicesByCategory(catId);
      if (res.data.Status === 'OK') setServices(res.data.Result);
    } catch (_) {}
    finally { setFetching(false); }
  };

  const fetchWorkers = async (svcId) => {
    setFetching(true);
    try {
      const res = await getServicemanServices(svcId);
      if (res.data.Status === 'OK') {
        const approved = res.data.Result.filter(w => w.status === 'Approved');

        // Check which workers have available slots
        const workersWithSlots = await Promise.all(
          approved.map(async (w) => {
            try {
              const servicemanId = toStr(w.serviceman?._id || w.servicemanId);
              const slotRes = await getSlotsByServiceman(servicemanId);
              if (slotRes.data.Status === 'OK') {
                const today = new Date(); today.setHours(0,0,0,0);
                const hasAvailableSlot = slotRes.data.Result.some(s => {
                  const d = new Date(s.availableDate);
                  return d >= today && (s.totalSlots - s.bookedSlots) > 0;
                });
                return { ...w, hasAvailableSlot };
              }
              return { ...w, hasAvailableSlot: false };
            } catch (_) {
              return { ...w, hasAvailableSlot: false };
            }
          })
        );

        // Sort: available workers first
        workersWithSlots.sort((a, b) => (b.hasAvailableSlot ? 1 : 0) - (a.hasAvailableSlot ? 1 : 0));
        setWorkers(workersWithSlots);
      }
    } catch (_) {}
    finally { setFetching(false); }
  };

  const handleSelectCategory = (cat) => {
    setSelCategory(cat); setServices([]); setSelService(null); setWorkers([]);
    fetchServices(toStr(cat._id)); setStep(2);
  };

  const handleSelectService = (svc) => {
    setSelService(svc); setWorkers([]);
    fetchWorkers(toStr(svc._id)); setStep(3);
  };

  const stepBack = () => {
    if (step === 3) { setStep(2); setWorkers([]); setSelService(null); }
    else if (step === 2) { setStep(1); setServices([]); setSelCategory(null); }
  };

  if (loading) return (
    <View style={s.loadingRoot}>
      <StatusBar barStyle="dark-content" />
      <ActivityIndicator size="large" color="#FF4D4D" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <View style={s.header}>
        <View style={s.headerTop}>
          {step > 1 && (
            <TouchableOpacity onPress={stepBack} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#1A1D23" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={s.headerTitle}>
              {step === 1 ? 'Our Services' : step === 2 ? selCategory?.name : selService?.serviceName}
            </Text>
            <Text style={s.headerSub}>
              {step === 1 ? 'Choose a category' : step === 2 ? 'Select a service' : 'Choose a worker'}
            </Text>
          </View>
        </View>

        {/* Step pills */}
        <View style={s.stepPills}>
          {['Category','Service','Worker'].map((label, i) => (
            <View key={label} style={[s.stepPill, step >= i+1 && s.stepPillActive]}>
              <Text style={[s.stepPillText, step >= i+1 && s.stepPillTextActive]}>
                {step > i+1 ? '✓ ' : ''}{label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {fetching ? <ActivityIndicator color="#FF4D4D" style={{ marginTop: 40 }} /> : (
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>

          {/* Step 1 — Categories */}
          {step === 1 && (
            <View style={s.catGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity key={toStr(cat._id)} style={[s.catCard, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} onPress={() => handleSelectCategory(cat)} activeOpacity={0.8}>
                  <Text style={s.catIcon}>{CAT_ICONS[i % CAT_ICONS.length]}</Text>
                  <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2 — Services */}
          {step === 2 && (
            <View style={s.listWrap}>
              {services.length === 0
                ? <View style={s.emptyBox}><Text style={s.emptyText}>No services available</Text></View>
                : services.map(svc => (
                  <TouchableOpacity key={toStr(svc._id)} style={s.svcCard} onPress={() => handleSelectService(svc)} activeOpacity={0.85}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.svcName}>{svc.serviceName}</Text>
                      {svc.description && <Text style={s.svcDesc} numberOfLines={2}>{svc.description}</Text>}
                      <Text style={s.svcPrice}>Starting from ₹{svc.maximumPrice}</Text>
                    </View>
                    <View style={s.svcArrow}>
                      <Ionicons name="chevron-forward" size={18} color="#FF4D4D" />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Step 3 — Workers */}
          {step === 3 && (
            <View style={s.listWrap}>
              {workers.length === 0
                ? <View style={s.emptyBox}><Text style={s.emptyText}>No workers available for this service</Text></View>
                : workers.map(w => (
                  <TouchableOpacity key={toStr(w._id)} style={s.workerCard} onPress={() => { setSelWorker(w); setShowBook(true); }} activeOpacity={0.85}>
                    <View style={s.workerAvatar}>
                      <Text style={s.workerAvatarText}>{w.serviceman?.fullName?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.workerName}>{w.serviceman?.fullName || '—'}</Text>
                      <Text style={s.workerCity}>📍 {w.serviceman?.city || '—'}</Text>
                      {w.role && <Text style={s.workerRole}>{w.role}</Text>}
                    </View>
                    <View style={s.workerRight}>
                      <Text style={s.workerCharge}>₹{w.charge}</Text>
                      <Text style={s.workerChargeLabel}>per visit</Text>
                      <View style={s.bookNowBtn}>
                        <Text style={s.bookNowText}>Book</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {selService && selWorker && (
        <BookModal
          service={selService}
          serviceman={{
            _id:      selWorker.serviceman?._id || selWorker.servicemanId,
            fullName: selWorker.serviceman?.fullName,
            city:     selWorker.serviceman?.city,
            upiId:    selWorker.serviceman?.upiId,
            charge:   selWorker.charge,
          }}
          visible={showBook}
          onClose={() => { setShowBook(false); setSelWorker(null); }}
          onSuccess={() => {}}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F5F6FA' },
  loadingRoot:   { flex: 1, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center' },
  header:        { backgroundColor: '#fff', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn:       { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  headerSub:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stepPills:     { flexDirection: 'row', gap: 8 },
  stepPill:      { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F5F6FA', borderRadius: 99, borderWidth: 1, borderColor: '#E8EBF0' },
  stepPillActive:{ backgroundColor: '#FFF0F0', borderColor: '#FECACA' },
  stepPillText:  { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  stepPillTextActive: { color: '#FF4D4D' },
  list:          { flex: 1, padding: 20 },
  listWrap:      { gap: 12 },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard:       { width: '22%', alignItems: 'center', borderRadius: 18, padding: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  catIcon:       { fontSize: 28 },
  catName:       { fontSize: 10, fontWeight: '700', color: '#1A1D23', textAlign: 'center' },
  emptyBox:      { alignItems: 'center', paddingVertical: 60 },
  emptyText:     { color: '#9CA3AF', fontSize: 13 },
  svcCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  svcName:       { fontSize: 16, fontWeight: '800', color: '#1A1D23', marginBottom: 4 },
  svcDesc:       { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  svcPrice:      { fontSize: 13, fontWeight: '700', color: '#10B981' },
  svcArrow:      { width: 36, height: 36, backgroundColor: '#FFF0F0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  workerCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  workerAvatar:  { width: 52, height: 52, backgroundColor: '#FF4D4D', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  workerName:    { fontSize: 15, fontWeight: '800', color: '#1A1D23', marginBottom: 2 },
  workerCity:    { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  workerRole:    { fontSize: 11, color: '#FF4D4D', fontWeight: '600' },
  workerRight:   { alignItems: 'flex-end', gap: 2 },
  workerCharge:  { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  workerChargeLabel: { fontSize: 10, color: '#9CA3AF' },
  bookNowBtn:    { backgroundColor: '#FF4D4D', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  bookNowText:   { color: '#fff', fontSize: 12, fontWeight: '800' },
});
