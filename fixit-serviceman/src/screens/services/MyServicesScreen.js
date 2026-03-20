import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
  TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyServices, getServiceCategories, getServicesByCategory, applyForService } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const STATUS = {
  Pending:  { color: '#FACC15', bg: 'rgba(250,204,21,0.12)',  icon: '🕐' },
  Approved: { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  icon: '✅' },
  Rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
};

function ApplyModal({ visible, onClose, onSuccess, servicemanId }) {
  const [step,        setStep]        = useState(1);
  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [selCategory, setSelCategory] = useState(null);
  const [selService,  setSelService]  = useState(null);
  const [charge,      setCharge]      = useState('');
  const [role,        setRole]        = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => { if (visible) fetchCategories(); }, [visible]);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const res = await getServiceCategories();
      if (res.data.Status === 'OK') setCategories(res.data.Result);
    } catch (_) {}
    finally { setFetching(false); }
  };

  const handleSelectCategory = async (cat) => {
    setSelCategory(cat); setSelService(null); setServices([]);
    setFetching(true);
    try {
      const res = await getServicesByCategory(toStr(cat._id));
      if (res.data.Status === 'OK') setServices(res.data.Result);
    } catch (_) {}
    finally { setFetching(false); setStep(2); }
  };

  const handleApply = async () => {
    setError('');
    if (!charge.trim()) return setError('Charge is required');
    if (isNaN(Number(charge)) || Number(charge) <= 0) return setError('Enter a valid charge amount');
    if (selService?.maximumPrice && Number(charge) > selService.maximumPrice)
      return setError(`Charge cannot exceed ₹${selService.maximumPrice}`);
    setLoading(true);
    try {
      const res = await applyForService({
        servicemanId, serviceId: toStr(selService._id),
        categoryId: toStr(selCategory._id), charge: Number(charge),
        role: role.trim() || null, description: description.trim() || null,
      });
      if (res.data.Status === 'OK') { resetAll(); onSuccess(); onClose(); }
      else setError(res.data.Result);
    } catch (err) {
      setError(err?.response?.data?.Result || 'Failed to apply');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep(1); setSelCategory(null); setSelService(null);
    setCharge(''); setRole(''); setDescription(''); setError('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { resetAll(); onClose(); }}>
      <KeyboardAvoidingView style={a.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={a.sheet}>
          <View style={a.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {step > 1 && (
                <TouchableOpacity onPress={() => setStep(s => s - 1)}>
                  <Ionicons name="arrow-back" size={20} color="#FF4D4D" />
                </TouchableOpacity>
              )}
              <Text style={a.title}>
                {step === 1 ? 'Select Category' : step === 2 ? 'Select Service' : 'Set Your Charge'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { resetAll(); onClose(); }}>
              <Ionicons name="close" size={22} color="#555A66" />
            </TouchableOpacity>
          </View>

          <View style={a.stepRow}>
            <View style={a.stepLine} />
            {[1,2,3].map(n => (
              <View key={n} style={a.stepItem}>
                <View style={[a.stepDot, step >= n && a.stepDotActive]}>
                  {step > n
                    ? <Ionicons name="checkmark" size={10} color="#fff" />
                    : <Text style={[a.stepNum, step >= n && a.stepNumActive]}>{n}</Text>}
                </View>
                <Text style={[a.stepLabel, step >= n && a.stepLabelActive]}>
                  {n === 1 ? 'Category' : n === 2 ? 'Service' : 'Charge'}
                </Text>
              </View>
            ))}
          </View>

          {error ? <View style={a.errorBox}><Ionicons name="alert-circle" size={14} color="#F87171" /><Text style={a.errorText}>{error}</Text></View> : null}

          {fetching ? <View style={a.fetchingWrap}><ActivityIndicator color="#FF4D4D" /></View> : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 1 && (
                <View style={{ gap: 10 }}>
                  {categories.map(cat => (
                    <TouchableOpacity key={toStr(cat._id)} style={a.catCard} onPress={() => handleSelectCategory(cat)} activeOpacity={0.8}>
                      <Text style={{ fontSize: 22 }}>🗂️</Text>
                      <Text style={a.catName}>{cat.name}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#555A66" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {step === 2 && (
                <View>
                  <View style={a.selectedBox}>
                    <Text style={a.selectedLabel}>CATEGORY</Text>
                    <Text style={a.selectedValue}>{selCategory?.name}</Text>
                  </View>
                  {services.length === 0
                    ? <View style={a.fetchingWrap}><Text style={{ color: '#555A66' }}>No services in this category</Text></View>
                    : services.map(svc => (
                      <TouchableOpacity key={toStr(svc._id)} style={a.svcCard} onPress={() => { setSelService(svc); setStep(3); }} activeOpacity={0.8}>
                        <View style={{ flex: 1 }}>
                          <Text style={a.svcName}>{svc.serviceName}</Text>
                          {svc.description && <Text style={a.svcDesc} numberOfLines={2}>{svc.description}</Text>}
                          <Text style={a.svcMax}>Max: ₹{svc.maximumPrice}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#555A66" />
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {step === 3 && (
                <View>
                  <View style={a.selectedBox}>
                    <Text style={a.selectedLabel}>SERVICE</Text>
                    <Text style={a.selectedValue}>{selService?.serviceName}</Text>
                    <Text style={a.selectedSub}>Max allowed: ₹{selService?.maximumPrice}</Text>
                  </View>
                  <Text style={a.label}>YOUR CHARGE (₹) *</Text>
                  <View style={a.inputWrap}>
                    <Text style={a.rupee}>₹</Text>
                    <TextInput style={a.input} placeholder="Your service charge" placeholderTextColor="#555A66" value={charge} onChangeText={setCharge} keyboardType="number-pad" />
                  </View>
                  <Text style={a.label}>YOUR ROLE (optional)</Text>
                  <View style={a.inputWrap}>
                    <Ionicons name="person-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
                    <TextInput style={a.input} placeholder="e.g. Senior Plumber" placeholderTextColor="#555A66" value={role} onChangeText={setRole} />
                  </View>
                  <Text style={a.label}>DESCRIPTION (optional)</Text>
                  <View style={[a.inputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                    <TextInput style={[a.input, { textAlignVertical: 'top' }]} placeholder="Your expertise..." placeholderTextColor="#555A66" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
                  </View>
                  <View style={a.noteBox}>
                    <Ionicons name="information-circle-outline" size={14} color="#FACC15" />
                    <Text style={a.noteText}>Your application will be reviewed by admin before approval.</Text>
                  </View>
                  <TouchableOpacity style={a.applyBtn} onPress={handleApply} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={a.applyBtnText}>Submit Application</Text>}
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const a = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#fff' },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 20, position: 'relative' },
  stepLine: { position: 'absolute', top: 12, left: '15%', right: '15%', height: 2, backgroundColor: 'rgba(255,77,77,0.15)' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { borderColor: '#FF4D4D', backgroundColor: '#FF4D4D' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#555A66' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 9, fontWeight: '700', color: '#555A66' },
  stepLabelActive: { color: '#FF6B6B' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#F87171', fontSize: 12, flex: 1 },
  fetchingWrap: { paddingVertical: 40, alignItems: 'center' },
  catCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
  catName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  selectedBox: { backgroundColor: 'rgba(255,77,77,0.06)', borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)', borderRadius: 12, padding: 14, marginBottom: 16 },
  selectedLabel: { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 4 },
  selectedValue: { fontSize: 15, fontWeight: '800', color: '#FF6B6B' },
  selectedSub: { fontSize: 11, color: '#555A66', marginTop: 2 },
  svcCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 10 },
  svcName: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 },
  svcDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  svcMax: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  label: { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  rupee: { fontSize: 18, fontWeight: '700', color: '#4ADE80', marginRight: 8 },
  input: { flex: 1, color: '#E8EAF0', fontSize: 14 },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(250,204,21,0.06)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.15)', borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText: { color: '#FACC15', fontSize: 11, flex: 1, lineHeight: 16 },
  applyBtn: { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default function MyServicesScreen() {
  const { serviceman } = useAuth();
  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [filter,     setFilter]     = useState('');
  const id = toStr(serviceman?._id);

  const fetchServices = useCallback(async () => {
    try {
      const res = await getMyServices(id);
      if (res.data.Status === 'OK') setServices(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  const counts = services.reduce((acc, sv) => { acc[sv.status] = (acc[sv.status] || 0) + 1; return acc; }, {});
  const filtered = filter ? services.filter(sv => sv.status === filter) : services;

  if (loading) return (
    <View style={s.loadingRoot}>
      <ActivityIndicator size="large" color="#FF4D4D" />
      <Text style={s.loadingText}>Loading services...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Services 🛠️</Text>
          <Text style={s.headerSub}>{services.length} service{services.length !== 1 ? 's' : ''} applied</Text>
        </View>
        <TouchableOpacity style={s.applyBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[
          { label: 'Approved', value: counts.Approved || 0, color: '#4ADE80' },
          { label: 'Pending',  value: counts.Pending  || 0, color: '#FACC15' },
          { label: 'Rejected', value: counts.Rejected || 0, color: '#F87171' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabs}>
        {[
          { key: '', label: `All (${services.length})` },
          { key: 'Approved', label: `✅ Approved (${counts.Approved || 0})` },
          { key: 'Pending',  label: `🕐 Pending (${counts.Pending || 0})` },
          { key: 'Rejected', label: `❌ Rejected (${counts.Rejected || 0})` },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[s.tab, filter === tab.key && s.tabActive]} onPress={() => setFilter(tab.key)}>
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchServices(); }} tintColor="#FF4D4D" />}>
        {filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🛠️</Text>
            <Text style={s.emptyTitle}>No services yet</Text>
            <Text style={s.emptySub}>Apply for services to start receiving bookings</Text>
            <TouchableOpacity style={s.emptyApplyBtn} onPress={() => setShowModal(true)}>
              <Text style={s.emptyApplyBtnText}>+ Apply for Service</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.map(svc => {
          const c = STATUS[svc.status] || STATUS.Pending;
          return (
            <View key={toStr(svc._id)} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={s.svcName}>{svc.service?.serviceName || '—'}</Text>
                  <Text style={s.catName}>{svc.category?.name || '—'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: c.bg }]}>
                  <Text style={[s.statusText, { color: c.color }]}>{c.icon} {svc.status}</Text>
                </View>
              </View>
              <View style={s.cardDetails}>
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>CHARGE</Text>
                  <Text style={s.detailValue}>₹{Number(svc.charge || 0).toLocaleString()}</Text>
                </View>
                {svc.role && <View style={s.detailItem}><Text style={s.detailLabel}>ROLE</Text><Text style={s.detailValue}>{svc.role}</Text></View>}
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>APPLIED</Text>
                  <Text style={s.detailValue}>{new Date(svc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                </View>
              </View>
              {svc.description && <Text style={s.desc} numberOfLines={2}>{svc.description}</Text>}
              {svc.status === 'Rejected' && svc.adminRemark && (
                <View style={s.remarkBox}>
                  <Text style={s.remarkLabel}>Admin Remark:</Text>
                  <Text style={s.remarkText}>{svc.adminRemark}</Text>
                </View>
              )}
              {svc.status === 'Pending' && (
                <View style={s.pendingBox}>
                  <Ionicons name="time-outline" size={13} color="#FACC15" />
                  <Text style={s.pendingText}>Waiting for admin approval</Text>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>

      <ApplyModal visible={showModal} onClose={() => setShowModal(false)} onSuccess={fetchServices} servicemanId={id} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080B0F' },
  loadingRoot: { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#555A66', fontSize: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: '#555A66', marginTop: 2 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF4D4D', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0D1117', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#555A66' },
  tabs: { marginHorizontal: 20, backgroundColor: '#0D1117', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 9, minWidth: 80 },
  tabActive: { backgroundColor: '#FF4D4D' },
  tabText: { fontSize: 10, fontWeight: '700', color: '#555A66' },
  tabTextActive: { color: '#fff' },
  list: { flex: 1, paddingHorizontal: 20 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#555A66', textAlign: 'center', marginBottom: 20 },
  emptyApplyBtn: { backgroundColor: '#FF4D4D', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyApplyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: { backgroundColor: '#0D1117', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  svcName: { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 3 },
  catName: { fontSize: 12, color: '#FF6B6B', fontWeight: '600' },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardDetails: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, marginBottom: 10 },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '700', color: '#555A66', letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 13, fontWeight: '800', color: '#E8EAF0' },
  desc: { fontSize: 12, color: '#9CA3AF', lineHeight: 17, marginBottom: 8 },
  remarkBox: { backgroundColor: 'rgba(248,113,113,0.06)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)', borderRadius: 10, padding: 10 },
  remarkLabel: { fontSize: 10, fontWeight: '700', color: '#F87171', marginBottom: 3 },
  remarkText: { fontSize: 12, color: '#E8EAF0' },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingText: { fontSize: 11, color: '#FACC15', fontWeight: '600' },
});
