import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/theme';

export default function AuthenticatedAppLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.m3.surface },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scanner"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="documents/[id]"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
