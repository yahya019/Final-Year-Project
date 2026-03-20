import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicemanRegister } from '../../utils/api';

export default function RegisterScreen({ navigation }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', contactNumber: '', city: '', address: '',
    password: '', confirmPassword: '',
    aadhaarNumber: '', bankAccountHolderName: '', bankName: '',
    accountNumber: '', ifscCode: '', upiId: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep1 = () => {
    if (!form.fullName.trim())      return setError('Full name is required');
    if (!form.email.trim())         return setError('Email is required');
    if (!form.contactNumber.trim()) return setError('Contact number is required');
    if (!/^[0-9]{10}$/.test(form.contactNumber)) return setError('Contact number must be 10 digits');
    if (!form.city.trim())          return setError('City is required');
    if (!form.address.trim())       return setError('Address is required');
    if (!form.password)             return setError('Password is required');
    if (form.password.length < 6)   return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1() === true) setStep(2);
  };

  const handleRegister = async () => {
    setError(''); setSuccess('');
    if (!form.aadhaarNumber.trim())         return setError('Aadhaar number is required');
    if (!/^[0-9]{12}$/.test(form.aadhaarNumber)) return setError('Aadhaar must be 12 digits');
    if (!form.bankAccountHolderName.trim()) return setError('Account holder name is required');
    if (!form.bankName.trim())              return setError('Bank name is required');
    if (!form.accountNumber.trim())         return setError('Account number is required');
    if (!form.ifscCode.trim())              return setError('IFSC code is required');

    setLoading(true);
    try {
      const res = await servicemanRegister({
        fullName:              form.fullName.trim(),
        email:                 form.email.trim().toLowerCase(),
        contactNumber:         form.contactNumber.trim(),
        city:                  form.city.trim(),
        address:               form.address.trim(),
        password:              form.password,
        aadhaarNumber:         form.aadhaarNumber.trim(),
        bankAccountHolderName: form.bankAccountHolderName.trim(),
        bankName:              form.bankName.trim(),
        accountNumber:         form.accountNumber.trim(),
        ifscCode:              form.ifscCode.trim().toUpperCase(),
        upiId:                 form.upiId.trim() || null,
      });
      if (res.data.Status === 'OK') {
        setSuccess('Registered! Wait for admin approval then login.');
        setTimeout(() => navigation.navigate('Login'), 3000);
      } else {
        setError(res.data.Result);
      }
    } catch (err) {
      setError(err?.response?.data?.Result || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, icon, fieldKey, placeholder, keyboard = 'default', secure = false }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <Ionicons name={icon} size={16} color="#555A66" style={{ marginRight: 10 }} />
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#555A66"
          value={form[fieldKey]}
          onChangeText={v => set(fieldKey, v)}
          keyboardType={keyboard}
          autoCapitalize="none"
          secureTextEntry={secure}
        />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => step === 2 ? (setStep(1), setError('')) : navigation.goBack()}
            style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FF4D4D" />
          </TouchableOpacity>
          <View style={s.logoBox}>
            <Text style={{ fontSize: 26 }}>⚡</Text>
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.sub}>Register as a FixIt serviceman</Text>
        </View>

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={s.stepLine} />
          {[1, 2].map(n => (
            <View key={n} style={s.stepItem}>
              <View style={[s.stepCircle, step >= n && s.stepCircleActive]}>
                {step > n
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>}
              </View>
              <Text style={[s.stepLabel, step >= n && s.stepLabelActive]}>
                {n === 1 ? 'Basic Info' : 'Bank Details'}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          {error   ? <View style={s.errorBox}><Ionicons name="alert-circle" size={14} color="#F87171" /><Text style={s.errorText}>{error}</Text></View> : null}
          {success ? <View style={s.successBox}><Ionicons name="checkmark-circle" size={14} color="#4ADE80" /><Text style={s.successText}>{success}</Text></View> : null}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Text style={s.sectionTitle}>Personal Information</Text>
              <Field label="FULL NAME"      icon="person-outline"   fieldKey="fullName"      placeholder="Your full name" />
              <Field label="EMAIL ADDRESS"  icon="mail-outline"     fieldKey="email"         placeholder="you@email.com" keyboard="email-address" />
              <Field label="CONTACT NUMBER" icon="call-outline"     fieldKey="contactNumber" placeholder="10-digit number" keyboard="phone-pad" />
              <Field label="CITY"           icon="location-outline" fieldKey="city"          placeholder="Your city" />
              <Field label="ADDRESS"        icon="home-outline"     fieldKey="address"       placeholder="Full address" />

              <Text style={s.sectionTitle}>Set Password</Text>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#555A66" style={{ marginRight: 10 }} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#555A66"
                  value={form.password}
                  onChangeText={v => set('password', v)}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPwd(p => !p)}>
                  <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#555A66" />
                </TouchableOpacity>
              </View>
              <Field label="CONFIRM PASSWORD" icon="lock-closed-outline" fieldKey="confirmPassword" placeholder="Re-enter password" secure={!showPwd} />

              <TouchableOpacity style={s.btn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={s.btnText}>Next — Bank Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <Text style={s.sectionTitle}>Aadhaar Information</Text>
              <Field label="AADHAAR NUMBER" icon="card-outline" fieldKey="aadhaarNumber" placeholder="12-digit Aadhaar number" keyboard="number-pad" />

              <Text style={s.sectionTitle}>Bank Information</Text>
              <Field label="ACCOUNT HOLDER NAME" icon="person-outline"         fieldKey="bankAccountHolderName" placeholder="Name on bank account" />
              <Field label="BANK NAME"            icon="business-outline"       fieldKey="bankName"             placeholder="e.g. SBI, HDFC, ICICI" />
              <Field label="ACCOUNT NUMBER"       icon="wallet-outline"         fieldKey="accountNumber"        placeholder="Bank account number" keyboard="number-pad" />
              <Field label="IFSC CODE"            icon="barcode-outline"        fieldKey="ifscCode"             placeholder="e.g. SBIN0001234" />
              <Field label="UPI ID (OPTIONAL)"    icon="phone-portrait-outline" fieldKey="upiId"               placeholder="yourname@upi" />

              <View style={s.noteBox}>
                <Ionicons name="information-circle-outline" size={14} color="#FACC15" />
                <Text style={s.noteText}>Bank details are used only for receiving service payments from FixIt.</Text>
              </View>

              <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Create Account</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={s.row}>
            <Text style={s.rowText}>Already registered? </Text>
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
  root:             { flex: 1, backgroundColor: '#080B0F' },
  scroll:           { flexGrow: 1, padding: 24, paddingTop: 56 },
  header:           { alignItems: 'center', marginBottom: 24 },
  backBtn:          { position: 'absolute', left: 0, top: 0, padding: 4 },
  logoBox:          { width: 56, height: 56, backgroundColor: '#FF4D4D', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 },
  title:            { fontSize: 22, fontWeight: '900', color: '#fff' },
  sub:              { fontSize: 12, color: '#555A66', marginTop: 3 },
  stepRow:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 60, position: 'relative' },
  stepLine:         { position: 'absolute', top: 15, left: '25%', right: '25%', height: 2, backgroundColor: 'rgba(255,77,77,0.2)' },
  stepItem:         { alignItems: 'center', gap: 6 },
  stepCircle:       { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { borderColor: '#FF4D4D', backgroundColor: '#FF4D4D' },
  stepNum:          { fontSize: 13, fontWeight: '700', color: '#555A66' },
  stepNumActive:    { color: '#fff' },
  stepLabel:        { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 0.5 },
  stepLabelActive:  { color: '#FF4D4D' },
  card:             { backgroundColor: '#0D1117', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,77,77,0.15)' },
  sectionTitle:     { fontSize: 12, fontWeight: '800', color: '#FF6B6B', letterSpacing: 0.5, marginBottom: 14, marginTop: 4 },
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A1222', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:        { color: '#F87171', fontSize: 12, fontWeight: '600', flex: 1 },
  successBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 },
  successText:      { color: '#4ADE80', fontSize: 12, fontWeight: '600', flex: 1 },
  label:            { fontSize: 10, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  inputWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0d12', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16 },
  input:            { flex: 1, color: '#E8EAF0', fontSize: 14 },
  noteBox:          { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(250,204,21,0.06)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.15)', borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText:         { color: '#FACC15', fontSize: 11, flex: 1, lineHeight: 16 },
  btn:              { height: 52, backgroundColor: '#FF4D4D', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D4D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6, marginBottom: 4 },
  btnText:          { color: '#fff', fontSize: 15, fontWeight: '800' },
  row:              { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  rowText:          { color: '#555A66', fontSize: 13 },
  link:             { color: '#FF4D4D', fontSize: 13, fontWeight: '700' },
});
