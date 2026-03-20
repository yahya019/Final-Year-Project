import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getCategories, getServicesByCategory, getServicemanServices, getSlotsByServiceman, createBooking } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const CAT_ICONS = ['🔧','⚡','❄️','🏠','🪑','🎨','🔌','🚿','🛁','🪟'];

// ── Book Service Modal ────────────────────────────────────────────────────────
function BookModal({ service, serviceman, visible, onClose, onSuccess }) {
  const { customer } = useAuth();
  const [slots,    setSlots]    = useState([]);
  const [selSlot,  setSelSlot]  = useState(null);
  const [address,  setAddress]  = useState('');
  const [contact,  setContact]  = useState(customer?.contactNumber || '');
  const [person,   setPerson]   = useState(customer?.fullName || '');
  const [payment,  setPayment]  = useState('Online');
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (visible && serviceman) fetchSlots();
  }, [visible, serviceman]);

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
    if (!selSlot)         return setError('Please select a date');
    if (!address.trim())  return setError('Address is required');
    if (!contact.trim())  return setError('Contact number is required');
    if (!person.trim())   return setError('Contact person name is required');

    setLoading(true);
    try {
      const res = await createBooking({
        customerId:      toStr(customer._id),
        servicemanId:    toStr(serviceman._id),
        serviceId:       toStr(service._id),
        availableSlotId: toStr(selSlot._id),
        address:         address.trim(),
        contactNumber:   contact.trim(),
        contactPerson:   person.trim(),
        paymentMode:     payment,
        paymentStatus:   payment === 'Online' ? 'Paid' : 'Pending',
        totalAmount:     serviceman.charge || service.maximumPrice,
        surgeCharges:    0,
        bookingDate:     selSlot.availableDate,
      });
      if (res.data.Status === 'OK') {
        Alert.alert('✅ Booking Confirmed!', `Your booking has been placed successfully.`, [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]);
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Booking failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={b.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={b.sheet}>
          <View style={b.header}>
            <Text style={b.title}>Book Service 📅</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#555A66" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Service info */}
            <View style={b.serviceBox}>
              <Text style={b.serviceName}>{service?.serviceName}</Text>
              <Text style={b.workerName}>👤 {serviceman?.fullName}</Text>
              <Text style={b.price}>₹{serviceman?.charge || service?.maximumPrice}</Text>
            </View>

            {error ? <View style={b.errorBox}><Text style={b.errorText}>{error}</Text></View> : null}

            {/* Select date */}
            <Text style={b.label}>SELECT DATE *</Text>
            {fetching ? <ActivityIndicator color="#FF4D4D" style={{ marginBottom: 16 }} /> :
              slots.length === 0 ? (
                <View style={b.noSlots}>
                  <Text style={b.noSlotsText}>No available slots for this worker</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {slots.map(slot => (
                    <TouchableOpacity key={toStr(slot._id)} onPress={() => setSelSlot(slot)}
                      style={[b.slotBtn, selSlot && toStr(selSlot._id) === toStr(slot._id) && b.slotBtnActive]}>
                      <Text style={[b.slotDay, selSlot && toStr(selSlot._id) === toStr(slot._id) && b.slotTextActive]}>
                        {new Date(slot.availableDate).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </Text>
                      <Text style={[b.slotDate, selSlot && toStr(selSlot._id) === toStr(slot._id) && b.slotTextActive]}>
                        {new Date(slot.availableDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                      <Text style={[b.slotAvail, selSlot && toStr(selSlot._id) === toStr(slot._id) && { color: '#fff' }]}>
                        {slot.totalSlots - slot.bookedSlots} left
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

            <Text style={b.label}>ADDRESS *</Text>
            <View style={b.inputWrap}>
              <Ionicons name="location-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
              <TextInput style={b.input} placeholder="Full service address" placeholderTextColor="#555A66" value={address} onChangeText={setAddress} />
            </View>

            <Text style={b.label}>CONTACT PERSON *</Text>
            <View style={b.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
              <TextInput style={b.input} placeholder="Your name" placeholderTextColor="#555A66" value={person} onChangeText={setPerson} />
            </View>

            <Text style={b.label}>CONTACT NUMBER *</Text>
            <View style={b.inputWrap}>
              <Ionicons name="call-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
              <TextInput style={b.input} placeholder="10-digit number" placeholderTextColor="#555A66" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            </View>

            <Text style={b.label}>PAYMENT MODE</Text>
            <View style={b.paymentRow}>
              {['Online', 'Cash'].map(p => (
                <TouchableOpacity key={p} style={[b.payBtn, payment === p && b.payBtnActive]} onPress={() => setPayment(p)}>
                  <Text style={[b.payBtnText, payment === p && b.payBtnTextActive]}>{p === 'Online' ? '💳 Online' : '💵 Cash'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={b.noteBox}>
              <Ionicons name="information-circle-outline" size={14} color="#60A5FA" />
              <Text style={b.noteText}>Your booking will be confirmed once the serviceman accepts it.</Text>
            </View>

            <TouchableOpacity style={b.bookBtn} onPress={handleBook} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={b.bookBtnText}>Confirm Booking • ₹{serviceman?.charge || service?.maximumPrice}</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const b = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:         { fontSize: 18, fontWeight: '900', color: '#fff' },
  serviceBox:    { backgroundColor: 'rgba(255,77,77,0.06)', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)', borderRadius: 14, padding: 16, marginBottom: 16 },
  serviceName:   { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 4 },
  workerName:    { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  price:         { fontSize: 22, fontWeight: '900', color: '#4ADE80' },
  errorBox:      { backgroundColor: '#2A1222', borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:     { color: '#F87171', fontSize: 12 },
  label:         { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  noSlots:       { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 14, marginBottom: 16, alignItems: 'center' },
  noSlotsText:   { color: '#555A66', fontSize: 12 },
  slotBtn:       { backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 72 },
  slotBtnActive: { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  slotDay:       { fontSize: 11, fontWeight: '700', color: '#555A66', marginBottom: 2 },
  slotDate:      { fontSize: 14, fontWeight: '900', color: '#fff', marginBottom: 2 },
  slotAvail:     { fontSize: 10, color: '#4ADE80' },
  slotTextActive:{ color: '#fff' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:         { flex: 1, color: '#E8EAF0', fontSize: 14 },
  paymentRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  payBtn:        { flex: 1, height: 46, backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payBtnActive:  { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)' },
  payBtnText:    { fontSize: 14, fontWeight: '700', color: '#555A66' },
  payBtnTextActive: { color: '#4ADE80' },
  noteBox:       { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(96,165,250,0.06)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.15)', borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText:      { flex: 1, fontSize: 11, color: '#60A5FA', lineHeight: 16 },
  bookBtn:       { height: 54, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  bookBtnText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ServicesScreen({ route }) {
  const initCatId   = route?.params?.categoryId   || null;
  const initCatName = route?.params?.categoryName || null;

  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [workers,     setWorkers]     = useState([]);
  const [selCategory, setSelCategory] = useState(initCatId ? { _id: initCatId, name: initCatName } : null);
  const [selService,  setSelService]  = useState(null);
  const [selWorker,   setSelWorker]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [fetching,    setFetching]    = useState(false);
  const [showBook,    setShowBook]    = useState(false);
  const [step,        setStep]        = useState(initCatId ? 2 : 1);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (initCatId) fetchServices(initCatId); }, [initCatId]);

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
        setWorkers(approved);
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

  const handleSelectWorker = (worker) => { setSelWorker(worker); setShowBook(true); };

  const stepBack = () => {
    if (step === 3) { setStep(2); setWorkers([]); }
    else if (step === 2) { setStep(1); setServices([]); setSelCategory(null); }
  };

  if (loading) return <View style={s.loadingRoot}><ActivityIndicator size="large" color="#FF4D4D" /></View>;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        {step > 1 && (
          <TouchableOpacity onPress={stepBack} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FF4D4D" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={s.headerTitle}>
            {step === 1 ? '🗂️ Services' : step === 2 ? selCategory?.name : selService?.serviceName}
          </Text>
          <Text style={s.headerSub}>
            {step === 1 ? 'Choose a service category' : step === 2 ? 'Select a service' : 'Choose a worker'}
          </Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        {['Category','Service','Worker'].map((label, i) => (
          <View key={label} style={s.stepItem}>
            <View style={[s.stepDot, step >= i+1 && s.stepDotActive]}>
              {step > i+1
                ? <Ionicons name="checkmark" size={10} color="#fff" />
                : <Text style={[s.stepNum, step >= i+1 && s.stepNumActive]}>{i+1}</Text>}
            </View>
            <Text style={[s.stepLabel, step >= i+1 && s.stepLabelActive]}>{label}</Text>
          </View>
        ))}
        <View style={s.stepLine} />
      </View>

      {fetching ? <ActivityIndicator color="#FF4D4D" style={{ marginTop: 40 }} /> : (
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {/* Step 1 — Categories */}
          {step === 1 && (
            <View style={s.catGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity key={toStr(cat._id)} style={s.catCard} onPress={() => handleSelectCategory(cat)} activeOpacity={0.8}>
                  <View style={s.catIconWrap}>
                    <Text style={s.catIcon}>{CAT_ICONS[i % CAT_ICONS.length]}</Text>
                  </View>
                  <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2 — Services */}
          {step === 2 && (
            <View style={s.listWrap}>
              {services.length === 0
                ? <View style={s.emptyBox}><Text style={s.emptyText}>No services in this category</Text></View>
                : services.map(svc => (
                  <TouchableOpacity key={toStr(svc._id)} style={s.svcCard} onPress={() => handleSelectService(svc)} activeOpacity={0.85}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.svcName}>{svc.serviceName}</Text>
                      {svc.description && <Text style={s.svcDesc} numberOfLines={2}>{svc.description}</Text>}
                      <Text style={s.svcPrice}>Up to ₹{svc.maximumPrice}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#555A66" />
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
                  <TouchableOpacity key={toStr(w._id)} style={s.workerCard} onPress={() => handleSelectWorker(w)} activeOpacity={0.85}>
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
          serviceman={{ ...selWorker.serviceman, charge: selWorker.charge, _id: selWorker.serviceman?._id || selWorker.servicemanId }}
          visible={showBook}
          onClose={() => { setShowBook(false); setSelWorker(null); }}
          onSuccess={() => {}}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  loadingRoot:   { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center' },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  backBtn:       { width: 36, height: 36, backgroundColor: 'rgba(255,77,77,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:     { fontSize: 11, color: '#555A66', marginTop: 2 },
  stepRow:       { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingHorizontal: 20, marginBottom: 20, position: 'relative' },
  stepLine:      { position: 'absolute', top: 12, left: '22%', right: '22%', height: 2, backgroundColor: 'rgba(255,77,77,0.15)' },
  stepItem:      { alignItems: 'center', gap: 4 },
  stepDot:       { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { borderColor: '#FF4D4D', backgroundColor: '#FF4D4D' },
  stepNum:       { fontSize: 11, fontWeight: '700', color: '#555A66' },
  stepNumActive: { color: '#fff' },
  stepLabel:     { fontSize: 9, fontWeight: '700', color: '#555A66' },
  stepLabelActive:{ color: '#FF6B6B' },
  list:          { flex: 1, paddingHorizontal: 20 },
  listWrap:      { gap: 10 },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard:       { width: '22%', alignItems: 'center', gap: 8 },
  catIconWrap:   { width: 60, height: 60, backgroundColor: '#0D1117', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  catIcon:       { fontSize: 28 },
  catName:       { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  emptyBox:      { alignItems: 'center', paddingVertical: 60 },
  emptyText:     { color: '#555A66', fontSize: 13 },
  svcCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 },
  svcName:       { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  svcDesc:       { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  svcPrice:      { fontSize: 12, fontWeight: '700', color: '#4ADE80' },
  workerCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0D1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 },
  workerAvatar:  { width: 48, height: 48, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  workerName:    { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  workerCity:    { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  workerRole:    { fontSize: 11, color: '#FF6B6B', fontWeight: '600' },
  workerRight:   { alignItems: 'flex-end' },
  workerCharge:  { fontSize: 18, fontWeight: '900', color: '#4ADE80' },
  workerChargeLabel: { fontSize: 10, color: '#555A66' },
});
