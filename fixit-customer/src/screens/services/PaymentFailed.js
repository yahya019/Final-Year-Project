// PaymentFailed.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentFailed({ navigation }) {
  return (
    <View style={s.container}>
      <Ionicons name="close-circle" size={100} color="#EF4444" />

      <Text style={s.title}>Payment Failed</Text>
      <Text style={s.subtitle}>
        Something went wrong. Please try again.
      </Text>

      <TouchableOpacity
        style={s.retryBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={s.retryText}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.homeBtn}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={s.homeText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    color: '#1A1D23',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  homeBtn: {
    marginTop: 10,
  },
  homeText: {
    color: '#6B7280',
  },
});