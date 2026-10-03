import { Link, Stack } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text variant="headlineMedium">Screen not found</Text>
        <Text style={styles.subtitle}>
          The page you’re looking for doesn’t exist yet. We’ll add it as we implement more features.
        </Text>
        <Link href="/" asChild>
          <Button mode="contained">Go Home</Button>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748B',
  },
});

