import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Alert,
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
    if (!form.old)             return setError('Old password required');
    if (!form.new)             return setError('New password required');
    if (form.new.length < 6)   return setError('Min 6 characters');
    if (form.new !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await changePassword({ _id: toStr(customer._id), oldPassword: form.old, newPassword: form.new });
      if (res.data.Status === 'OK') {
        Alert.alert('✅ Success', 'Password changed successfully');
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
          <View style={p.modalHeader}>
            <Text style={p.modalTitle}>🔑 Change Password</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#555A66" /></TouchableOpacity>
          </View>
          {error ? <View style={p.errorBox}><Text style={p.errorText}>{error}</Text></View> : null}
          {[
            { label: 'OLD PASSWORD',     key: 'old',     placeholder: 'Current password' },
            { label: 'NEW PASSWORD',     key: 'new',     placeholder: 'Min 6 characters' },
            { label: 'CONFIRM PASSWORD', key: 'confirm', placeholder: 'Re-enter new password' },
          ].map(f => (
            <View key={f.key}>
              <Text style={p.label}>{f.label}</Text>
              <View style={p.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
                <TextInput style={[p.input, { flex: 1 }]} placeholder={f.placeholder} placeholderTextColor="#555A66" value={form[f.key]} onChangeText={v => set(f.key, v)} secureTextEntry={!showPwd} autoCapitalize="none" />
                {f.key === 'old' && <TouchableOpacity onPress={() => setShowPwd(x => !x)}><Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#555A66" /></TouchableOpacity>}
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
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '900', color: '#fff' },
  errorBox:    { backgroundColor: '#2A1222', borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:   { color: '#F87171', fontSize: 12 },
  label:       { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080B0F', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:       { flex: 1, color: '#E8EAF0', fontSize: 14 },
  btn:         { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '800' },
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

  const menuItems = [
    { icon: '🔑', label: 'Change Password', onPress: () => setShowPwd(true), color: '#60A5FA' },
    { icon: '🚪', label: 'Logout',          onPress: handleLogout,           color: '#F87171' },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* Profile header */}
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

      {/* Info cards */}
      <View style={s.infoCard}>
        {[
          { icon: '👤', label: 'Full Name',       value: customer?.fullName },
          { icon: '📞', label: 'Contact Number',  value: customer?.contactNumber },
          { icon: '📧', label: 'Email',            value: customer?.email || 'Not provided' },
          { icon: '📅', label: 'Member Since',    value: customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
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

      {/* Menu items */}
      <View style={s.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={item.label} style={[s.menuItem, i < menuItems.length - 1 && s.menuItemBorder]} onPress={item.onPress} activeOpacity={0.7}>
            <View style={[s.menuIconWrap, { backgroundColor: `${item.color}15` }]}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <Text style={[s.menuLabel, { color: item.color }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#555A66" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.version}>FixIt Customer App v1.0</Text>
      <View style={{ height: 24 }} />

      <ChangePwdModal visible={showPwd} onClose={() => setShowPwd(false)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  scroll:        { padding: 20, paddingTop: 56 },
  profileCard:   { backgroundColor: '#0D1117', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  avatarWrap:    { marginBottom: 14 },
  avatar:        { width: 80, height: 80, backgroundColor: '#FF4D4D', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  avatarText:    { fontSize: 36, fontWeight: '900', color: '#fff' },
  name:          { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  contact:       { fontSize: 14, color: '#9CA3AF', marginBottom: 2 },
  email:         { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
  activeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  activeDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  activeText:    { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  infoCard:      { backgroundColor: '#0D1117', borderRadius: 16, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoIcon:      { fontSize: 18, width: 24 },
  infoLabel:     { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 0.5, marginBottom: 2 },
  infoValue:     { fontSize: 13, fontWeight: '600', color: '#E8EAF0' },
  menuCard:      { backgroundColor: '#0D1117', borderRadius: 16, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  menuItemBorder:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  menuIconWrap:  { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel:     { flex: 1, fontSize: 14, fontWeight: '700' },
  version:       { textAlign: 'center', fontSize: 11, color: '#555A66' },
});
