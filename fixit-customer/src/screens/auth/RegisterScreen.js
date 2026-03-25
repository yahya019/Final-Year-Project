import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerRegister } from '../../utils/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]       = useState({ fullName: '', contactNumber: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState('');

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
        setSuccess('Account created successfully! You can now sign in.');
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

  const fields = [
    { key: 'fullName',      label: 'FULL NAME',       icon: 'person-outline',  placeholder: 'Your full name',    keyboard: 'default' },
    { key: 'contactNumber', label: 'CONTACT NUMBER',  icon: 'call-outline',    placeholder: '10-digit number',   keyboard: 'phone-pad' },
    { key: 'email',         label: 'EMAIL (optional)',icon: 'mail-outline',    placeholder: 'you@email.com',     keyboard: 'email-address' },
  ];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1D23" />
          </TouchableOpacity>
          <View style={s.logoBox}>
            <Text style={{ fontSize: 32 }}>🔧</Text>
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.sub}>Join FixIt and book home services easily</Text>
        </View>

        <View style={s.card}>
          {error   ? <View style={s.errorBox}><Ionicons name="alert-circle" size={16} color="#EF4444" /><Text style={s.errorText}>{error}</Text></View> : null}
          {success ? <View style={s.successBox}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={s.successText}>{success}</Text></View> : null}

          {fields.map(f => (
            <View key={f.key}>
              <Text style={s.label}>{f.label}</Text>
              <View style={[s.inputWrap, focused === f.key && s.inputFocused]}>
                <Ionicons name={f.icon} size={18} color={focused === f.key ? '#FF4D4D' : '#9CA3AF'} style={{ marginRight: 10 }} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize="none"
                  onFocus={() => setFocused(f.key)}
                  onBlur={() => setFocused('')}
                />
              </View>
            </View>
          ))}

          <Text style={s.label}>PASSWORD</Text>
          <View style={[s.inputWrap, focused === 'password' && s.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? '#FF4D4D' : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Min 6 characters" placeholderTextColor="#9CA3AF" value={form.password} onChangeText={v => set('password', v)} secureTextEntry={!showPwd} autoCapitalize="none" onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
            <TouchableOpacity onPress={() => setShowPwd(p => !p)}>
              <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>CONFIRM PASSWORD</Text>
          <View style={[s.inputWrap, focused === 'confirm' && s.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focused === 'confirm' ? '#FF4D4D' : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Re-enter password" placeholderTextColor="#9CA3AF" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} secureTextEntry={!showPwd} autoCapitalize="none" onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account →</Text>}
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
  root:         { flex: 1, backgroundColor: '#F5F6FA' },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 56 },
  header:       { alignItems: 'center', marginBottom: 28 },
  backBtn:      { position: 'absolute', left: 0, top: 0, width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  logoBox:      { width: 72, height: 72, backgroundColor: '#FF4D4D', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 },
  title:        { fontSize: 24, fontWeight: '900', color: '#1A1D23' },
  sub:          { fontSize: 13, color: '#6B7280', marginTop: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:    { color: '#EF4444', fontSize: 13, flex: 1 },
  successBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 10, padding: 12, marginBottom: 16 },
  successText:  { color: '#10B981', fontSize: 13, flex: 1 },
  label:        { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 18 },
  inputFocused: { borderColor: '#FF4D4D', backgroundColor: '#FFF0F0' },
  input:        { flex: 1, color: '#1A1D23', fontSize: 15 },
  btn:          { height: 54, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4, shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  row:          { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  rowText:      { color: '#6B7280', fontSize: 13 },
  link:         { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },
});
