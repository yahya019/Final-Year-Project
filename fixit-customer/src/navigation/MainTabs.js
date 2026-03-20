import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1117',
          borderTopColor: 'rgba(255,77,77,0.15)',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 14,
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
