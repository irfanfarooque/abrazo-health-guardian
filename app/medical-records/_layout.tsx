import { Stack } from 'expo-router';

export default function MedicalRecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Records' }} />
      <Stack.Screen name="[id]" options={{ title: 'Record detail' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload record' }} />
    </Stack>
  );
}

