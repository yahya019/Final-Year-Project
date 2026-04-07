import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen       from '../screens/home/HomeScreen';
import BookingsScreen   from '../screens/bookings/BookingsScreen';
import MyServicesScreen from '../screens/services/MyServicesScreen';
import SlotsScreen      from '../screens/slots/SlotsScreen';
import EarningsScreen   from '../screens/earnings/EarningsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',     component: HomeScreen,       icon: 'home',      label: 'Home'     },
  { name: 'Bookings', component: BookingsScreen,    icon: 'calendar',  label: 'Bookings' },
  { name: 'Services', component: MyServicesScreen,  icon: 'construct', label: 'Services' },
  { name: 'Slots',    component: SlotsScreen,       icon: 'time',      label: 'Slots'    },
  { name: 'Earnings', component: EarningsScreen,    icon: 'wallet',    label: 'Earnings' },
];

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1117',
          borderTopColor: 'rgba(255,77,77,0.15)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   '#FF4D4D',
        tabBarInactiveTintColor: '#555A66',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find(t => t.name === route.name);
          return <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={22} color={color} />;
        },
      })}>
      {TABS.map(t => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ tabBarLabel: t.label }} />
      ))}
    </Tab.Navigator>
  );
}
