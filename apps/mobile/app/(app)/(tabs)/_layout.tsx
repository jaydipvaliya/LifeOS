import { Tabs } from 'expo-router';
import { Calendar, FolderLock, Home, Laptop, User } from 'lucide-react-native';
import React from 'react';
import { M3NavigationBar } from '../../../src/components/ui';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <M3NavigationBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} strokeWidth={focused ? 2.25 : 1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, focused }) => (
            <FolderLock size={22} strokeWidth={focused ? 2.25 : 1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={22} strokeWidth={focused ? 2.25 : 1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
          tabBarIcon: ({ color, focused }) => (
            <Laptop size={22} strokeWidth={focused ? 2.25 : 1.75} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} strokeWidth={focused ? 2.25 : 1.75} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
