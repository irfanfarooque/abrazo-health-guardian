import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';

export default function MedicinesTab() {
  return (
    <ScreenContainer title="Medicines" subtitle="Track prescriptions, reminders, and orders.">
      <View style={styles.list}>
        <PlaceholderCard
          title="No active medicines"
          description="Once you add your medications, reminders and refill alerts will surface here."
        />
      </View>
      <View style={styles.actions}>
        <Link href="/medicines/add" asChild>
          <Button mode="contained">Add medicine</Button>
        </Link>
        <Link href="/medicines/orders" asChild>
          <Button mode="outlined">Order history</Button>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
});

