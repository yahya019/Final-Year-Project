import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerRegister } from '../../utils/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]       = useState({ fullName: '', contactNumber: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    setError(''); setSuccess('');
    if (!form.fullName.trim())      return setError('Full name is required');
    if (!form.contactNumber.trim()) return setError('Contact number is required');
    if (!/^[0-9]{10}$/.test(form.contactNumber)) return setError('Contact number must be 10 digits');
    if (!form.password)             return setError('Password is required');
    if (form.password.length < 6)   return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await customerRegister({
        fullName:      form.fullName.trim(),
        contactNumber: form.contactNumber.trim(),
        email:         form.email.trim() || null,
        password:      form.password,
      });
      if (res.data.Status === 'OK') {
        setSuccess('Account created! You can now login.');
        setTimeout(() => navigation.navigate('Login'), 2000);
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FF4D4D" />
          </TouchableOpacity>
          <View style={s.logoBox}>
            <Text style={{ fontSize: 28 }}>🔧</Text>
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.sub}>Book home services with ease</Text>
        </View>

        <View style={s.card}>
          {error   ? <View style={s.errorBox}><Ionicons name="alert-circle" size={14} color="#F87171" /><Text style={s.errorText}>{error}</Text></View> : null}
          {success ? <View style={s.successBox}><Ionicons name="checkmark-circle" size={14} color="#4ADE80" /><Text style={s.successText}>{success}</Text></View> : null}

          {[
            { label: 'FULL NAME',      key: 'fullName',      icon: 'person-outline',  placeholder: 'Your full name',      keyboard: 'default' },
            { label: 'CONTACT NUMBER', key: 'contactNumber', icon: 'call-outline',    placeholder: '10-digit number',     keyboard: 'phone-pad' },
            { label: 'EMAIL (optional)',key: 'email',        icon: 'mail-outline',    placeholder: 'you@email.com',       keyboard: 'email-address' },
          ].map(f => (
            <View key={f.key}>
              <Text style={s.label}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Ionicons name={f.icon} size={16} color="#555A66" style={{ marginRight: 10 }} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder={f.placeholder}
                  placeholderTextColor="#555A66"
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}

          <Text style={s.label}>PASSWORD</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Min 6 characters" placeholderTextColor="#555A66" value={form.password} onChangeText={v => set('password', v)} secureTextEntry={!showPwd} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPwd(p => !p)}>
              <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#555A66" />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>CONFIRM PASSWORD</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Re-enter password" placeholderTextColor="#555A66" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} secureTextEntry={!showPwd} autoCapitalize="none" />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.rowText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#080B0F' },
  scroll:      { flexGrow: 1, padding: 24, paddingTop: 56 },
  header:      { alignItems: 'center', marginBottom: 28 },
  backBtn:     { position: 'absolute', left: 0, top: 0, padding: 4 },
  logoBox:     { width: 64, height: 64, backgroundColor: '#FF4D4D', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  title:       { fontSize: 22, fontWeight: '900', color: '#fff' },
  sub:         { fontSize: 13, color: '#555A66', marginTop: 4 },
  card:        { backgroundColor: '#0D1117', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:   { color: '#F87171', fontSize: 12, fontWeight: '600', flex: 1 },
  successBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  successText: { color: '#4ADE80', fontSize: 12, fontWeight: '600', flex: 1 },
  label:       { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0d12', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:       { flex: 1, color: '#E8EAF0', fontSize: 14 },
  btn:         { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  row:         { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  rowText:     { color: '#555A66', fontSize: 13 },
  link:        { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },
});
