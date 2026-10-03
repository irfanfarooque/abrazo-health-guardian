import { BottomNavigation } from 'react-native-paper';
import { useRouter, useSegments } from 'expo-router';

export function BottomTabNavigator() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentRoute = segments[1] || 'index';

  const routes = [
    { key: 'index', title: 'Dashboard', icon: 'home-outline' },
    { key: 'consultations', title: 'Consultations', icon: 'calendar-outline' },
    { key: 'medicines', title: 'Medicines', icon: 'pill' },
    { key: 'medical-records', title: 'Records', icon: 'file-document-outline' },
    { key: 'profile', title: 'Profile', icon: 'account-outline' },
  ];

  return (
    <BottomNavigation
      navigationState={{
        index: routes.findIndex(r => r.key === currentRoute),
        routes,
      }}
      onIndexChange={(index) => {
        const route = routes[index];
        router.push(`/(tabs)/${route.key}`);
      }}
      renderIcon={({ route, focused, color }) => {
        return null; // Icons handled by BottomNavigation
      }}
      renderLabel={({ route }) => route.title}
      shifting={false}
    />
  );
}
