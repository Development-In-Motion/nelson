import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { SystemFontFamily, useColors } from '@/constants/theme';

export default function TabLayout() {
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: c.bg },
        tabBarActiveTintColor: c.label,
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: SystemFontFamily,
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.separator,
          borderTopWidth: 0.5,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Начало',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Памет',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'brain' : 'brain'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профил',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
