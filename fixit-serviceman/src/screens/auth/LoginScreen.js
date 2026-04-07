import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { servicemanLogin, forgotPassword } from '../../utils/api';

export default function LoginScreen({ navigation }) {
  const { login }  = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail,    setFpEmail]    = useState('');
  const [fpLoading,  setFpLoading]  = useState(false);
  const [fpMsg,      setFpMsg]      = useState('');
  const [fpError,    setFpError]    = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim())    return setError('Email is required');
    if (!password.trim()) return setError('Password is required');
    setLoading(true);
    try {
      const res = await servicemanLogin({ email: email.trim().toLowerCase(), password });
      if (res.data.Status === 'OK') {
        await login({ token: res.data.Result.token, user: res.data.Result.serviceman });
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
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoIcon}>⚡</Text>
          </View>
          <Text style={s.logoTitle}>FixIt</Text>
          <Text style={s.logoSub}>SERVICEMAN</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome Back 👋</Text>
          <Text style={s.cardSub}>Sign in to your serviceman account</Text>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#F87171" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>EMAIL ADDRESS</Text>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor="#555A66" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <Text style={s.label}>PASSWORD</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Enter your password" placeholderTextColor="#555A66" value={password} onChangeText={setPassword} secureTextEntry={!showPwd} />
            <TouchableOpacity onPress={() => setShowPwd(p => !p)}>
              <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#555A66" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setShowForgot(true); setFpError(''); setFpMsg(''); }} style={{ alignSelf: 'center', marginTop: 14 }}>
            <Text style={s.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.rowText}>New serviceman? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>Register here</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgot} transparent animationType="slide" onRequestClose={() => setShowForgot(false)}>
        <View style={s.fpOverlay}>
          <View style={s.fpSheet}>
            <View style={s.fpHeader}>
              <Text style={s.fpTitle}>🔑 Forgot Password</Text>
              <TouchableOpacity onPress={() => setShowForgot(false)} style={s.fpCloseBtn}>
                <Ionicons name="close" size={20} color="#555A66" />
              </TouchableOpacity>
            </View>
            <Text style={s.fpSubtitle}>Enter your registered email. We'll send you a new password.</Text>

            {fpError ? (
              <View style={s.fpErrorBox}>
                <Ionicons name="alert-circle" size={14} color="#F87171" />
                <Text style={s.fpErrorText}>{fpError}</Text>
              </View>
            ) : null}
            {fpMsg ? (
              <View style={s.fpSuccessBox}>
                <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                <Text style={s.fpSuccessText}>{fpMsg}</Text>
              </View>
            ) : null}

            <Text style={s.label}>EMAIL ADDRESS</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Enter your email"
                placeholderTextColor="#555A66"
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
  root:          { flex: 1, backgroundColor: '#080B0F' },
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap:      { alignItems: 'center', marginBottom: 36 },
  logoBox:       { width: 72, height: 72, backgroundColor: '#FF4D4D', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#FF4D4D', shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 },
  logoIcon:      { fontSize: 36 },
  logoTitle:     { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  logoSub:       { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 3, marginTop: 2 },
  card:          { backgroundColor: '#0D1117', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  cardTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  cardSub:       { fontSize: 13, color: '#555A66', marginBottom: 20 },
  errorBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:     { color: '#F87171', fontSize: 12, fontWeight: '600', flex: 1 },
  label:         { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0d12', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:         { flex: 1, color: '#E8EAF0', fontSize: 14 },
  btn:           { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '800' },
  forgotLink:    { color: '#FF4D4D', fontSize: 13, fontWeight: '600' },
  row:           { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  rowText:       { color: '#555A66', fontSize: 13 },
  link:          { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },

  // Forgot password modal (dark theme)
  fpOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  fpSheet:       { backgroundColor: '#0D1117', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  fpHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fpTitle:       { fontSize: 20, fontWeight: '900', color: '#fff' },
  fpCloseBtn:    { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fpSubtitle:    { fontSize: 13, color: '#555A66', marginBottom: 20, lineHeight: 19 },
  fpErrorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  fpErrorText:   { color: '#F87171', fontSize: 12, flex: 1 },
  fpSuccessBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  fpSuccessText: { color: '#4ADE80', fontSize: 12, flex: 1 },
});
