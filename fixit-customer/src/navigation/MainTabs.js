import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen     from '../screens/home/HomeScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import ProfileScreen  from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',     component: HomeScreen,     icon: 'home',     label: 'Home'     },
  { name: 'Bookings', component: BookingsScreen,  icon: 'calendar', label: 'Bookings' },
  { name: 'Services', component: ServicesScreen,  icon: 'construct',label: 'Services' },
  { name: 'Profile',  component: ProfileScreen,   icon: 'person',   label: 'Profile'  },
];

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor:   '#FF4D4D',
        tabBarInactiveTintColor: '#9CA3AF',
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
