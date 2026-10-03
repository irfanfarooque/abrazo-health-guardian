import { Stack } from 'expo-router';

export default function ConsultationLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Consultations' }} />
      <Stack.Screen name="[id]" options={{ title: 'Consultation details' }} />
      <Stack.Screen name="book" options={{ title: 'Book consultation' }} />
      <Stack.Screen name="specialties" options={{ title: 'Browse specialties' }} />
    </Stack>
  );
}

