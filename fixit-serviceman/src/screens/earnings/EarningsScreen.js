import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getMyEarnings } from '../../utils/api';

const toStr = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

export default function EarningsScreen() {
  const { serviceman } = useAuth();
  const [earnings,   setEarnings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('');

  const id = toStr(serviceman?._id);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await getMyEarnings(id);
      if (res.data.Status === 'OK') setEarnings(res.data.Result);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => {
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 30000);
    return () => clearInterval(interval);
  }, [fetchEarnings]);

  const onRefresh = () => { setRefreshing(true); fetchEarnings(); };

  // Stats
  const settled        = earnings.filter(e => e.settlementStatus === 'Settled');
  const pending        = earnings.filter(e => e.settlementStatus === 'Pending');
  const totalEarned    = Math.round(earnings.reduce((s, e) => s + Number(e.servicemanEarning || 0), 0));
  const settledAmount  = Math.round(settled.reduce((s, e)  => s + Number(e.servicemanEarning || 0), 0));
  const pendingAmount  = Math.round(pending.reduce((s, e)  => s + Number(e.servicemanEarning || 0), 0));
  const totalRevenue   = Math.round(earnings.reduce((s, e) => s + Number(e.totalAmount || 0), 0));
  const totalCommission = Math.round(earnings.reduce((s, e) => s + Number(e.commissionAmount || 0), 0));

  const filtered = filter ? earnings.filter(e => e.settlementStatus === filter) : earnings;

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color="#FF4D4D" />
        <Text style={s.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4D4D" />}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Earnings 💰</Text>
        <Text style={s.headerSub}>{earnings.length} transactions</Text>
      </View>

      {/* Big total card */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>TOTAL EARNINGS</Text>
        <Text style={s.totalAmount}>₹{totalEarned.toLocaleString()}</Text>
        <View style={s.totalRow}>
          <View style={s.totalItem}>
            <Text style={s.totalItemValue}>₹{settledAmount.toLocaleString()}</Text>
            <Text style={s.totalItemLabel}>Received</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalItemValue, { color: '#FACC15' }]}>₹{pendingAmount.toLocaleString()}</Text>
            <Text style={s.totalItemLabel}>Pending</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalItemValue, { color: '#F87171' }]}>₹{totalCommission.toLocaleString()}</Text>
            <Text style={s.totalItemLabel}>FixIt Cut</Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={s.statsGrid}>
        {[
          { icon: '📋', label: 'Total Jobs',      value: earnings.length,                color: '#60A5FA' },
          { icon: '✅', label: 'Settled',          value: settled.length,                 color: '#4ADE80' },
          { icon: '⏳', label: 'Pending',          value: pending.length,                 color: '#FACC15' },
          { icon: '💸', label: 'Service Revenue',  value: `₹${totalRevenue.toLocaleString()}`, color: '#C084FC' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Revenue breakdown bar */}
      {totalRevenue > 0 && (
        <View style={s.breakdownCard}>
          <Text style={s.breakdownTitle}>Revenue Split</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(totalEarned / totalRevenue) * 100}%`, backgroundColor: '#4ADE80' }]} />
            <View style={[s.progressFill, { width: `${(totalCommission / totalRevenue) * 100}%`, backgroundColor: '#F87171' }]} />
          </View>
          <View style={s.legendRow}>
            {[
              { color: '#4ADE80', label: 'Your Earnings', value: `₹${totalEarned.toLocaleString()}` },
              { color: '#F87171', label: 'FixIt Commission', value: `₹${totalCommission.toLocaleString()}` },
            ].map(l => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={s.legendLabel}>{l.label}</Text>
                <Text style={[s.legendValue, { color: l.color }]}>{l.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <View style={s.tabs}>
        {[
          { key: '',        label: `All (${earnings.length})` },
          { key: 'Pending', label: `⏳ Pending (${pending.length})` },
          { key: 'Settled', label: `✅ Settled (${settled.length})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, filter === tab.key && s.tabActive]}
            onPress={() => setFilter(tab.key)}>
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions list */}
      {filtered.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>💸</Text>
          <Text style={s.emptyTitle}>No transactions yet</Text>
          <Text style={s.emptySub}>Complete bookings to start earning</Text>
        </View>
      ) : (
        filtered.map(e => {
          const isSettled = e.settlementStatus === 'Settled';
          return (
            <View key={toStr(e._id)} style={s.txCard}>
              {/* Left */}
              <View style={s.txLeft}>
                <View style={[s.txIcon, { backgroundColor: isSettled ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)' }]}>
                  <Text style={{ fontSize: 18 }}>{isSettled ? '✅' : '⏳'}</Text>
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txBookingNum}>{e.booking?.bookingNumber || '—'}</Text>
                  <Text style={s.txService}>{e.service?.serviceName || '—'}</Text>
                  <Text style={s.txDate}>
                    {new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              {/* Right */}
              <View style={s.txRight}>
                <Text style={[s.txAmount, { color: isSettled ? '#4ADE80' : '#FACC15' }]}>
                  ₹{Number(e.servicemanEarning).toLocaleString()}
                </Text>
                <Text style={s.txTotal}>of ₹{Number(e.totalAmount).toLocaleString()}</Text>
                <View style={[s.txBadge, { backgroundColor: isSettled ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)' }]}>
                  <Text style={[s.txBadgeText, { color: isSettled ? '#4ADE80' : '#FACC15' }]}>
                    {isSettled ? 'Received' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Pending payout note */}
      {pendingAmount > 0 && (
        <View style={s.pendingNote}>
          <Ionicons name="information-circle" size={16} color="#FACC15" />
          <Text style={s.pendingNoteText}>
            ₹{pendingAmount.toLocaleString()} is pending settlement. Admin will process payment to your UPI: <Text style={{ fontWeight: '800' }}>{serviceman?.upiId || 'not set'}</Text>
          </Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#080B0F' },
  scroll:        { padding: 20, paddingTop: 56 },
  loadingRoot:   { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:   { color: '#555A66', fontSize: 13 },

  header:        { marginBottom: 20 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:     { fontSize: 12, color: '#555A66', marginTop: 2 },

  // Total card
  totalCard:     { backgroundColor: '#0D1117', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', alignItems: 'center' },
  totalLabel:    { fontSize: 11, fontWeight: '700', color: '#555A66', letterSpacing: 1, marginBottom: 8 },
  totalAmount:   { fontSize: 40, fontWeight: '900', color: '#4ADE80', marginBottom: 20 },
  totalRow:      { flexDirection: 'row', width: '100%' },
  totalItem:     { flex: 1, alignItems: 'center' },
  totalDivider:  { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  totalItemValue:{ fontSize: 16, fontWeight: '900', color: '#4ADE80', marginBottom: 2 },
  totalItemLabel:{ fontSize: 10, fontWeight: '700', color: '#555A66' },

  // Stats
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:      { width: '47%', backgroundColor: '#0D1117', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statIcon:      { fontSize: 20, marginBottom: 6 },
  statValue:     { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel:     { fontSize: 10, fontWeight: '700', color: '#555A66' },

  // Breakdown
  breakdownCard: { backgroundColor: '#0D1117', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  breakdownTitle:{ fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 12 },
  progressBar:   { height: 10, backgroundColor: '#1a1d24', borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginBottom: 12 },
  progressFill:  { height: '100%' },
  legendRow:     { gap: 8 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendLabel:   { flex: 1, fontSize: 12, color: '#9CA3AF' },
  legendValue:   { fontSize: 12, fontWeight: '800' },

  // Tabs
  tabs:          { flexDirection: 'row', backgroundColor: '#0D1117', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 4 },
  tab:           { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive:     { backgroundColor: '#FF4D4D' },
  tabText:       { fontSize: 11, fontWeight: '700', color: '#555A66' },
  tabTextActive: { color: '#fff' },

  // Empty
  emptyBox:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptySub:      { fontSize: 13, color: '#555A66', textAlign: 'center' },

  // Transaction card
  txCard:        { backgroundColor: '#0D1117', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  txLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon:        { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo:        { flex: 1 },
  txBookingNum:  { fontSize: 12, fontWeight: '800', color: '#FF6B6B', marginBottom: 2 },
  txService:     { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  txDate:        { fontSize: 11, color: '#555A66' },
  txRight:       { alignItems: 'flex-end', gap: 4 },
  txAmount:      { fontSize: 18, fontWeight: '900' },
  txTotal:       { fontSize: 11, color: '#555A66' },
  txBadge:       { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  txBadgeText:   { fontSize: 10, fontWeight: '800' },

  // Pending note
  pendingNote:   { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(250,204,21,0.06)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.15)', borderRadius: 12, padding: 14, marginTop: 8 },
  pendingNoteText:{ flex: 1, fontSize: 12, color: '#FACC15', lineHeight: 18 },
});
