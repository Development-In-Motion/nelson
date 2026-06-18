import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { MonoFontFamily, Palette } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: Palette.bg,
        },
        tabBarActiveTintColor: Palette.ink,
        tabBarInactiveTintColor: Palette.inkFaint,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: MonoFontFamily,
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: Palette.bg,
          borderTopColor: Palette.line,
          borderTopWidth: 1,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Начало',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Памет',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="brain" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профил',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
