import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthLayout] user:', user?.id, 'isLoading:', isLoading);
    
    if (!isLoading && user) {
      console.log('[AuthLayout] User exists, redirecting to dashboard');
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

