import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

import { customerLogin, forgotPassword } from '../../utils/api';

export default function LoginScreen({ navigation }) {
  const { login }      = useAuth();
  const [contact,  setContact]  = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [focused,  setFocused]  = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail,    setFpEmail]    = useState('');
  const [fpLoading,  setFpLoading]  = useState(false);
  const [fpMsg,      setFpMsg]      = useState('');
  const [fpError,    setFpError]    = useState('');

  const handleLogin = async () => {
    setError('');
    if (!contact.trim())  return setError('Contact number is required');
    if (!password.trim()) return setError('Password is required');
    setLoading(true);
    try {
      const res = await customerLogin({ contactNumber: contact.trim(), password });
      if (res.data.Status === 'OK') {
        await login({ token: res.data.Result.token, user: res.data.Result.customer });
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Connection failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setFpError(''); setFpMsg('');
    if (!fpEmail.trim()) return setFpError('Email is required');
    setFpLoading(true);
    try {
      const res = await forgotPassword({ email: fpEmail.trim().toLowerCase() });
      if (res.data.Status === 'OK') {
        setFpMsg('✅ New password sent to your email!');
        setTimeout(() => { setShowForgot(false); setFpEmail(''); setFpMsg(''); }, 2500);
      } else {
        setFpError(res.data.Result);
      }
    } catch (err) {
      setFpError(err?.response?.data?.Result || 'Failed. Check your network.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoBox}>
            <Text style={s.logoIcon}>🔧</Text>
          </View>
          <Text style={s.appName}>FixIt</Text>
          <Text style={s.tagline}>Home Services at Your Doorstep</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.title}>Sign In</Text>
          <Text style={s.sub}>Welcome back! Enter your details</Text>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>CONTACT NUMBER</Text>
          <View style={[s.inputWrap, focused === 'contact' && s.inputFocused]}>
            <Ionicons name="call-outline" size={18} color={focused === 'contact' ? '#FF4D4D' : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput
              style={s.input}
              placeholder="Enter your 10-digit number"
              placeholderTextColor="#9CA3AF"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              onFocus={() => setFocused('contact')}
              onBlur={() => setFocused('')}
            />
          </View>

          <Text style={s.label}>PASSWORD</Text>
          <View style={[s.inputWrap, focused === 'password' && s.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? '#FF4D4D' : '#9CA3AF'} style={{ marginRight: 10 }} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
            />
            <TouchableOpacity onPress={() => setShowPwd(p => !p)}>
              <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In →</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setShowForgot(true); setFpError(''); setFpMsg(''); }} style={{ alignSelf: 'center', marginTop: 12 }}>
            <Text style={s.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.rowText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>By signing in, you agree to our Terms & Privacy Policy</Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgot} transparent animationType="slide" onRequestClose={() => setShowForgot(false)}>
        <View style={s.fpOverlay}>
          <View style={s.fpSheet}>
            <View style={s.fpHeader}>
              <Text style={s.fpTitle}>🔑 Forgot Password</Text>
              <TouchableOpacity onPress={() => setShowForgot(false)} style={s.fpCloseBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={s.fpSubtitle}>Enter your registered email address. We'll send you a new password.</Text>
            {fpError ? <View style={s.errorBox}><Ionicons name="alert-circle" size={14} color="#EF4444" /><Text style={s.errorText}>{fpError}</Text></View> : null}
            {fpMsg   ? <View style={s.successBox}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={s.successText}>{fpMsg}</Text></View> : null}
            <Text style={s.label}>EMAIL ADDRESS</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="you@email.com"
                placeholderTextColor="#9CA3AF"
                value={fpEmail}
                onChangeText={setFpEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={s.btn} onPress={handleForgotPassword} disabled={fpLoading} activeOpacity={0.85}>
              {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send New Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F5F6FA' },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero:         { alignItems: 'center', marginBottom: 32 },
  logoBox:      { width: 80, height: 80, backgroundColor: '#FF4D4D', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  logoIcon:     { fontSize: 40 },
  appName:      { fontSize: 32, fontWeight: '900', color: '#1A1D23', letterSpacing: -1 },
  tagline:      { fontSize: 13, color: '#6B7280', marginTop: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title:        { fontSize: 24, fontWeight: '900', color: '#1A1D23', marginBottom: 4 },
  sub:          { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:    { color: '#EF4444', fontSize: 13, flex: 1 },
  label:        { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E8EBF0', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 18 },
  inputFocused: { borderColor: '#FF4D4D', backgroundColor: '#FFF0F0' },
  input:        { flex: 1, color: '#1A1D23', fontSize: 15 },
  btn:          { height: 54, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4, shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  row:          { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  rowText:      { color: '#6B7280', fontSize: 13 },
  link:         { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },
  footer:       { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 24 },
  forgotLink:   { color: '#FF4D4D', fontSize: 13, fontWeight: '600' },
  successBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 10, padding: 12, marginBottom: 16 },
  successText:  { color: '#10B981', fontSize: 13, flex: 1 },
  fpOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  fpSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  fpHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fpTitle:      { fontSize: 20, fontWeight: '900', color: '#1A1D23' },
  fpCloseBtn:   { width: 36, height: 36, backgroundColor: '#F5F6FA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fpSubtitle:   { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 19 },
});
