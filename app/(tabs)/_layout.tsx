import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[TabsLayout] user:', user?.id, 'isLoading:', isLoading);
    
    if (!isLoading && !user) {
      console.log('[TabsLayout] No user, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }} 
      />
      <Tabs.Screen 
        name="consultations" 
        options={{ 
          title: 'Consultations',
          tabBarLabel: 'Consult',
        }} 
      />
      <Tabs.Screen 
        name="medicines" 
        options={{ 
          title: 'Medicines',
          tabBarLabel: 'Meds',
        }} 
      />
      <Tabs.Screen 
        name="medical-records" 
        options={{ 
          title: 'Medical Records',
          tabBarLabel: 'Records',
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile',
        }} 
      />
    </Tabs>
  );
}

