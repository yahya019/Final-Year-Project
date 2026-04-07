// PaymentSuccess.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccess({ navigation }) {
  return (
    <View style={s.container}>
      <Ionicons name="checkmark-circle" size={100} color="#10B981" />

      <Text style={s.title}>Payment Successful</Text>
      <Text style={s.subtitle}>
        Your booking has been confirmed successfully.
      </Text>

      <TouchableOpacity
        style={s.button}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={s.buttonText}>Go to Home</Text>
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
  button: {
    marginTop: 30,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});