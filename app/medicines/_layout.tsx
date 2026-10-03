import { Stack } from 'expo-router';

export default function MedicinesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Medicines' }} />
      <Stack.Screen name="[id]" options={{ title: 'Medicine detail' }} />
      <Stack.Screen name="add" options={{ title: 'Add medicine' }} />
      <Stack.Screen name="reminders" options={{ title: 'Reminders' }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
    </Stack>
  );
}

