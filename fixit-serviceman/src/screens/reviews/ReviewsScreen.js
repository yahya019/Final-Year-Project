import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function ReviewsScreen() {
  return (
    <View style={s.root}>
      <Text style={s.title}>ReviewsScreen</Text>
      <Text style={s.sub}>Coming soon...</Text>
    </View>
  );
}
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#080B0F', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#FF4D4D', marginBottom: 8 },
  sub:   { fontSize: 13, color: '#555A66' },
});
