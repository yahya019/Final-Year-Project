import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import PaymentWebView from './../components/PaymentWebView';
import PaymentSuccess from '../screens/services/PaymentSuccess';
import PaymentFailed from '../screens/services/PaymentFailed';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { customer, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080B0F' }}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {customer ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />

              {/* ✅ ADD PAYMENT SCREEN HERE */}
              <Stack.Screen name="PaymentWebView" component={PaymentWebView} />
              <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
              <Stack.Screen name="PaymentFailed" component={PaymentFailed} />
            </>
          ) : (
            <Stack.Screen name="AuthStack" component={AuthStack} />
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}