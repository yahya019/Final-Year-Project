import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function MapPicker({ visible, onConfirm, onClose }) {
  const [location,   setLocation]   = useState(null);
  const [address,    setAddress]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [geocoding,  setGeocoding]  = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (visible) getCurrentLocation();
  }, [visible]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to pin your address.');
        onClose();
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);
      reverseGeocode(coords);
    } catch (err) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (coords) => {
    setGeocoding(true);
    try {
      const geo = await Location.reverseGeocodeAsync(coords);
      if (geo.length > 0) {
        const g = geo[0];
        const parts = [g.name, g.street, g.district, g.city, g.region, g.postalCode]
          .filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch (_) {
      setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setLocation(coords);
    reverseGeocode(coords);
  };

  const handleMarkerDrag = (e) => {
    const coords = e.nativeEvent.coordinate;
    setLocation(coords);
    reverseGeocode(coords);
  };

  const handleConfirm = () => {
    if (!location) return;
    onConfirm({
      latitude:  location.latitude,
      longitude: location.longitude,
      address,
    });
  };

  const recenter = async () => {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      reverseGeocode(coords);
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta:  0.005,
        longitudeDelta: 0.005,
      }, 500);
    } catch (_) {}
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1D23" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Pin Your Location</Text>
            <Text style={s.headerSub}>Tap map or drag pin to adjust</Text>
          </View>
        </View>

        {/* Map */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#FF4D4D" />
            <Text style={s.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={s.map}
            initialRegion={{
              latitude:       location?.latitude  || 21.1702,
              longitude:      location?.longitude || 72.8311,
              latitudeDelta:  0.005,
              longitudeDelta: 0.005,
            }}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}>
            {location && (
              <Marker
                coordinate={location}
                draggable
                onDragEnd={handleMarkerDrag}
                pinColor="#FF4D4D"
                title="Service Location"
                description={address}
              />
            )}
          </MapView>
        )}

        {/* Recenter button */}
        {!loading && (
          <TouchableOpacity style={s.recenterBtn} onPress={recenter}>
            <Ionicons name="navigate" size={22} color="#FF4D4D" />
          </TouchableOpacity>
        )}

        {/* Address bar + Confirm */}
        <View style={s.bottom}>
          <View style={s.addressBox}>
            <Ionicons name="location" size={18} color="#FF4D4D" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              {geocoding ? (
                <ActivityIndicator size="small" color="#FF4D4D" />
              ) : (
                <>
                  <Text style={s.addressLabel}>Selected Address</Text>
                  <Text style={s.addressText} numberOfLines={2}>{address || 'Tap on map to select'}</Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, (!location || geocoding) && s.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!location || geocoding}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#fff' },
  header:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:           { width: 40, height: 40, backgroundColor: '#F5F6FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle:       { fontSize: 17, fontWeight: '800', color: '#1A1D23' },
  headerSub:         { fontSize: 12, color: '#6B7280', marginTop: 1 },
  loadingBox:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:       { fontSize: 14, color: '#6B7280' },
  map:               { flex: 1 },
  recenterBtn:       { position: 'absolute', right: 16, top: '50%', width: 48, height: 48, backgroundColor: '#fff', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
  bottom:            { backgroundColor: '#fff', padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 14 },
  addressBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF0F0', borderRadius: 14, padding: 14, minHeight: 64 },
  addressLabel:      { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 0.5, marginBottom: 3 },
  addressText:       { fontSize: 13, fontWeight: '600', color: '#1A1D23', lineHeight: 18 },
  confirmBtn:        { height: 54, backgroundColor: '#FF4D4D', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  confirmBtnDisabled:{ backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  confirmBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
