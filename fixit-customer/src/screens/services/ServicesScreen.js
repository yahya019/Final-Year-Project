import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform,
  KeyboardAvoidingView, Alert, StatusBar, Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import MapPicker from '../../components/MapPicker';
import { getCategories, getServicesByCategory, getServicemanServices, getSlotsByServiceman, createBooking } from '../../utils/api';
import { openRazorpay } from '../../components/RazorpayPayment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


const BASE_URL = 'http://10.241.161.126:3000';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const CAT_ICONS = ['🔧', '⚡', '❄️', '🏠', '🪑', '🎨', '🔌', '🚿', '🛁', '🪟'];
const CAT_COLORS = ['#FFD6D6', '#FFE8A3', '#B3D4FF', '#B2EED8', '#FFD6B3', '#D9B3FF', '#B3F0CC', '#FFB3B3', '#FFE8A3', '#B3D4FF'];

// ── Category Image or Emoji ───────────────────────────────────────────────────
function CatImage({ cat, index, size = 28 }) {
  const [imgError, setImgError] = useState(false);
  if (cat.imageUrl && !imgError) {
    const uri = cat.imageUrl.startsWith('http') ? cat.imageUrl : `${BASE_URL}${cat.imageUrl}`;
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 6 }}
        onError={() => setImgError(true)}
        resizeMode="cover"
      />
    );
  }
  return <Text style={{ fontSize: size }}>{CAT_ICONS[index % CAT_ICONS.length]}</Text>;
}

// ── Book Service Modal ────────────────────────────────────────────────────────
function BookModal({ service, serviceman, visible, onClose, onSuccess }) {
  const { customer } = useAuth();
  const [slots, setSlots] = useState([]);
  const [selSlot, setSelSlot] = useState(null);
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState(customer?.contactNumber || '');
  const [person, setPerson] = useState(customer?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const baseCharge = serviceman?.charge || service?.maximumPrice || 0;
  const navigation = useNavigation();

  useEffect(() => {
    if (visible && serviceman) fetchSlots();
    if (!visible) { setSelSlot(null); setError(''); setLatitude(null); setLongitude(null); }
  }, [visible, serviceman]);

  const fetchSlots = async () => {
    setFetching(true);
    try {
      const res = await getSlotsByServiceman(toStr(serviceman._id));
      if (res.data.Status === 'OK') {
        const available = res.data.Result.filter(s => {
          const d = new Date(s.availableDate);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          return d >= today && (s.totalSlots - s.bookedSlots) > 0;
        });
        setSlots(available);
      }
    } catch (_) { }
    finally { setFetching(false); }
  };

  const handleBook = async () => {
    setError('');

    if (!selSlot) return setError('Please select a date');
    if (!address.trim()) return setError('Address is required');
    if (!contact.trim()) return setError('Contact number is required');
    if (!person.trim()) return setError('Contact person name is required');

    setLoading(true);

    try {
      const bookingDetails = {
        customerId: toStr(customer._id),
        servicemanId: toStr(serviceman._id),
        serviceId: toStr(service._id),
        availableSlotId: toStr(selSlot._id),
        address: address.trim(),
        contactNumber: contact.trim(),
        contactPerson: person.trim(),
        paymentMode: 'Online',
        paymentStatus: 'Confirm',
        totalAmount: baseCharge,
        surgeCharges: 0,
        bookingDate: selSlot.availableDate,
        latitude,
        longitude,
      };

      // Save temporarily
      await AsyncStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));

      navigation.navigate('PaymentWebView', {
        amount: baseCharge
      });

    } catch (err) {
      console.log('Booking error', err);
      setError(err?.response?.data?.Result || 'Booking failed');
    } finally {
      setLoading(false);
    }
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
            {/* Service info */}
            <View style={b.serviceBox}>
              <Text style={b.serviceName}>{service?.serviceName}</Text>
              <Text style={b.workerName}>by {serviceman?.fullName}</Text>
              <Text style={b.price}>₹{baseCharge}</Text>
            </View>

            {error ? <View style={b.errorBox}><Text style={b.errorText}>{error}</Text></View> : null}

            {/* Select date */}
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

            {/* Address with map picker */}
            <Text style={b.label}>ADDRESS *</Text>
            <TouchableOpacity style={b.mapPickerBtn} onPress={() => setShowMap(true)} activeOpacity={0.85}>
              <Ionicons name="map" size={20} color={latitude ? '#10B981' : '#FF4D4D'} />
              <View style={{ flex: 1 }}>
                {address
                  ? <Text style={b.mapPickerAddress} numberOfLines={2}>{address}</Text>
                  : <Text style={b.mapPickerPlaceholder}>Tap to pin your location on map</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            {latitude && longitude && (
              <View style={b.locConfirm}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={b.locConfirmText}>📍 Location pinned on map</Text>
              </View>
            )}
            {!address && (
              <View style={b.inputWrap}>
                <Ionicons name="create-outline" size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput style={[b.input, { flex: 1 }]} placeholder="Or type address manually" placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />
              </View>
            )}

            {/* Contact person */}
            <Text style={b.label}>CONTACT PERSON *</Text>
            <View style={b.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput style={b.input} placeholder="Your name" placeholderTextColor="#9CA3AF" value={person} onChangeText={setPerson} />
            </View>

            {/* Contact number */}
            <Text style={b.label}>CONTACT NUMBER *</Text>
            <View style={b.inputWrap}>
              <Ionicons name="call-outline" size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput style={b.input} placeholder="10-digit number" placeholderTextColor="#9CA3AF" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            </View>

            {/* Payment info */}
            <View style={b.paymentNote}>
              <Ionicons name="card-outline" size={16} color="#3B82F6" />
              <Text style={b.paymentNoteText}>Payment: Online (Paid on booking)</Text>
            </View>

            <View style={b.noteBox}>
              <Ionicons name="information-circle-outline" size={14} color="#F97316" />
              <Text style={b.noteText}>Your booking will be confirmed once the serviceman accepts it.</Text>
            </View>

            <TouchableOpacity style={b.bookBtn} onPress={handleBook} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={b.bookBtnText}>Confirm Booking • ₹{baseCharge}</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <MapPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={(loc) => {
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setAddress(loc.address);
          setShowMap(false);
        }}
      />
    </Modal>
  );
}

const b = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceBox: { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 16, marginBottom: 16 },
  serviceName: { fontSize: 17, fontWeight: '900', color: '#1A1D23', marginBottom: 2 },
  workerName: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  price: { fontSize: 26, fontWeight: '900', color: '#10B981' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: '#EF4444', fontSize: 13 },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10 },
  noSlots: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 18, alignItems: 'center' },
  noSlotsText: { color: '#9CA3AF', fontSize: 13 },
  slotBtn: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 16, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 76 },
  slotBtnActive: { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  slotDay: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  slotDate: { fontSize: 15, fontWeight: '900', color: '#1A1D23', marginBottom: 2 },
  slotAvail: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  slotTextActive: { color: '#fff' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 16 },
  input: { flex: 1, color: '#1A1D23', fontSize: 14 },
  locBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  locConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 8, marginTop: -10, marginBottom: 16 },
  locConfirmText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  mapPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 14, padding: 14, marginBottom: 10 },
  mapPickerAddress: { fontSize: 13, fontWeight: '600', color: '#1A1D23' },
  mapPickerPlaceholder: { fontSize: 13, color: '#9CA3AF' },
  paymentNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 16 },
  paymentNoteText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText: { flex: 1, fontSize: 11, color: '#F97316', lineHeight: 16 },
  bookBtn: { height: 54, backgroundColor: '#FF4D4D', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ServicesScreen({ route }) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selCategory, setSelCategory] = useState(null);
  const [selService, setSelService] = useState(null);
  const [selWorker, setSelWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [step, setStep] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Auto refresh every 30s
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      if (res.data.Status === 'OK') setCategories(res.data.Result);
    } catch (_) { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchCategories();
    const interval = setInterval(fetchCategories, 30000);
    return () => clearInterval(interval);
  }, [fetchCategories]);

  // When screen focused with category param — jump to step 2
  useFocusEffect(
    useCallback(() => {
      const catId = route?.params?.categoryId;
      const catName = route?.params?.categoryName;
      if (catId) {
        const cat = categories.find(c => toStr(c._id) === catId) || { _id: catId, name: catName };
        setSelCategory(cat);
        setSelService(null);
        setWorkers([]);
        setStep(2);
        fetchServices(catId);
      }
    }, [route?.params?.categoryId, categories])
  );

  const fetchServices = async (catId) => {
    setFetching(true);
    try {
      const res = await getServicesByCategory(catId);
      if (res.data.Status === 'OK') setServices(res.data.Result);
    } catch (_) { }
    finally { setFetching(false); }
  };

  const fetchWorkers = async (svcId) => {
    setFetching(true);
    try {
      const res = await getServicemanServices(svcId);
      if (res.data.Status === 'OK') setWorkers(res.data.Result.filter(w => w.status === 'Approved'));
    } catch (_) { }
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

      {/* Header */}
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
          {['Category', 'Service', 'Worker'].map((label, i) => (
            <View key={label} style={[s.stepPill, step >= i + 1 && s.stepPillActive]}>
              <Text style={[s.stepPillText, step >= i + 1 && s.stepPillTextActive]}>
                {step > i + 1 ? '✓ ' : ''}{label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {fetching ? <ActivityIndicator color="#FF4D4D" style={{ marginTop: 40 }} /> : (
        <ScrollView
          style={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={step === 1 ? <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCategories(); }} tintColor="#FF4D4D" /> : undefined}>

          {/* Step 1 — Categories with real images */}
          {step === 1 && (
            <View style={s.catGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity key={toStr(cat._id)} style={[s.catCard, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} onPress={() => handleSelectCategory(cat)} activeOpacity={0.8}>
                  <CatImage cat={cat} index={i} size={32} />
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
          serviceman={{ ...selWorker.serviceman, charge: selWorker.charge, _id: selWorker.serviceman?._id || selWorker.servicemanId }}
          visible={showBook}
          onClose={() => { setShowBook(false); setSelWorker(null); }}
          onSuccess={() => { }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingRoot: { flex: 1, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stepPills: { flexDirection: 'row', gap: 8 },
  stepPill: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F5F6FA', borderRadius: 99, borderWidth: 1, borderColor: '#E8EBF0' },
  stepPillActive: { backgroundColor: '#FFF0F0', borderColor: '#FECACA' },
  stepPillText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  stepPillTextActive: { color: '#FF4D4D' },
  list: { flex: 1, padding: 20 },
  listWrap: { gap: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '22%', alignItems: 'center', borderRadius: 18, padding: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  catName: { fontSize: 10, fontWeight: '700', color: '#1A1D23', textAlign: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#9CA3AF', fontSize: 13 },
  svcCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  svcName: { fontSize: 16, fontWeight: '800', color: '#1A1D23', marginBottom: 4 },
  svcDesc: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  svcPrice: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  svcArrow: { width: 36, height: 36, backgroundColor: '#FFF0F0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  workerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  workerAvatar: { width: 52, height: 52, backgroundColor: '#FF4D4D', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  workerName: { fontSize: 15, fontWeight: '800', color: '#1A1D23', marginBottom: 2 },
  workerCity: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  workerRole: { fontSize: 11, color: '#FF4D4D', fontWeight: '600' },
  workerRight: { alignItems: 'flex-end', gap: 2 },
  workerCharge: { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  workerChargeLabel: { fontSize: 10, color: '#9CA3AF' },
  bookNowBtn: { backgroundColor: '#FF4D4D', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  bookNowText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
