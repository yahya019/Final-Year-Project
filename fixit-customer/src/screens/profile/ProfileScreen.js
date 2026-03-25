import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Platform,
  KeyboardAvoidingView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

function ChangePwdModal({ visible, onClose }) {
  const { customer } = useAuth();
  const [form,    setForm]    = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleChange = async () => {
    setError('');
    if (!form.old)           return setError('Old password required');
    if (!form.new)           return setError('New password required');
    if (form.new.length < 6) return setError('Min 6 characters');
    if (form.new !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await changePassword({ _id: toStr(customer._id), oldPassword: form.old, newPassword: form.new });
      if (res.data.Status === 'OK') {
        Alert.alert('✅ Password Updated', 'Your password has been changed successfully.');
        setForm({ old: '', new: '', confirm: '' });
        onClose();
      } else { setError(res.data.Result); }
    } catch (err) { setError(err?.response?.data?.Result || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={p.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={p.sheet}>
          <View style={p.handle} />
          <View style={p.mHeader}>
            <Text style={p.mTitle}>🔑 Change Password</Text>
            <TouchableOpacity onPress={onClose} style={p.closeBtn}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
          </View>
          {error ? <View style={p.errorBox}><Text style={p.errorText}>{error}</Text></View> : null}
          {[
            { label: 'CURRENT PASSWORD', key: 'old',     placeholder: 'Enter current password' },
            { label: 'NEW PASSWORD',      key: 'new',     placeholder: 'Min 6 characters' },
            { label: 'CONFIRM PASSWORD',  key: 'confirm', placeholder: 'Re-enter new password' },
          ].map(f => (
            <View key={f.key}>
              <Text style={p.label}>{f.label}</Text>
              <View style={p.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput style={[p.input, { flex: 1 }]} placeholder={f.placeholder} placeholderTextColor="#9CA3AF" value={form[f.key]} onChangeText={v => set(f.key, v)} secureTextEntry={!showPwd} autoCapitalize="none" />
                {f.key === 'old' && <TouchableOpacity onPress={() => setShowPwd(x => !x)}><Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" /></TouchableOpacity>}
              </View>
            </View>
          ))}
          <TouchableOpacity style={p.btn} onPress={handleChange} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={p.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const p = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:    { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  mHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mTitle:    { fontSize: 18, fontWeight: '900', color: '#1A1D23' },
  closeBtn:  { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  errorBox:  { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: '#EF4444', fontSize: 13 },
  label:     { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 16 },
  input:     { flex: 1, color: '#1A1D23', fontSize: 15 },
  btn:       { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default function ProfileScreen() {
  const { customer, logout } = useAuth();
  const [showPwd, setShowPwd] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{customer?.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={s.name}>{customer?.fullName}</Text>
        <Text style={s.contact}>{customer?.contactNumber}</Text>
        {customer?.email && <Text style={s.email}>{customer?.email}</Text>}
        <View style={s.activeBadge}>
          <View style={s.activeDot} />
          <Text style={s.activeText}>Active Account</Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.sectionTitle}><Text style={s.sectionTitleText}>Account Details</Text></View>
      <View style={s.infoCard}>
        {[
          { icon: '👤', label: 'Full Name',      value: customer?.fullName },
          { icon: '📞', label: 'Contact Number', value: customer?.contactNumber },
          { icon: '📧', label: 'Email',           value: customer?.email || 'Not provided' },
          { icon: '📅', label: 'Member Since',   value: customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
        ].map((item, i) => (
          <View key={item.label} style={[s.infoRow, i < 3 && s.infoRowBorder]}>
            <Text style={s.infoIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={s.sectionTitle}><Text style={s.sectionTitleText}>Account Settings</Text></View>
      <View style={s.menuCard}>
        <TouchableOpacity style={[s.menuItem, s.menuItemBorder]} onPress={() => setShowPwd(true)} activeOpacity={0.7}>
          <View style={[s.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={[s.menuLabel, { color: '#1A1D23' }]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[s.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={[s.menuLabel, { color: '#EF4444' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={s.version}>FixIt v1.0 • Home Services App</Text>
      <View style={{ height: 24 }} />

      <ChangePwdModal visible={showPwd} onClose={() => setShowPwd(false)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F5F6FA' },
  scroll:        { padding: 20, paddingTop: 56 },
  profileCard:   { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  avatarWrap:    { marginBottom: 14 },
  avatar:        { width: 88, height: 88, backgroundColor: '#FF4D4D', borderRadius: 26, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText:    { fontSize: 40, fontWeight: '900', color: '#fff' },
  name:          { fontSize: 22, fontWeight: '900', color: '#1A1D23', marginBottom: 4 },
  contact:       { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  email:         { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  activeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  activeDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeText:    { fontSize: 12, fontWeight: '700', color: '#10B981' },
  sectionTitle:  { marginBottom: 10 },
  sectionTitleText: { fontSize: 13, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  infoCard:      { backgroundColor: '#fff', borderRadius: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:      { fontSize: 20, width: 28 },
  infoLabel:     { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 },
  infoValue:     { fontSize: 14, fontWeight: '600', color: '#1A1D23' },
  menuCard:      { backgroundColor: '#fff', borderRadius: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuItemBorder:{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconWrap:  { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel:     { flex: 1, fontSize: 15, fontWeight: '700' },
  version:       { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
});
