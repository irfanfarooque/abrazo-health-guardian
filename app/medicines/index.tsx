import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { ActivityIndicator, Text, Card, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { MedicineCard } from '@/components/medicines/MedicineCard';
import { useMedicines } from '@/hooks/useMedicines';

export default function MedicineListScreen() {
  const router = useRouter();
  const { medicines, isLoading, error, supabaseReady, removeMedicine } = useMedicines();

  const handleRemove = useCallback(
    (medicineId: string, medicineName: string) => {
      Alert.alert('Remove Medicine', `Are you sure you want to remove ${medicineName}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMedicine(medicineId);
              Alert.alert('Success', 'Medicine removed');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove medicine');
            }
          },
        },
      ]);
    },
    [removeMedicine],
  );

  return (
    <ScreenContainer title="Medicines" subtitle="Track all prescriptions in one place.">
      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : medicines.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No medicines logged yet. Add your medications to track dosages, schedules, and adherence.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.medicinesList}>
            {medicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onPress={() => router.push(`/medicines/${medicine.id}`)}
                onRemove={() => handleRemove(medicine.id, medicine.medicine_name)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/medicines/add')}
        disabled={!supabaseReady}
        label="Add Medicine"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  loader: {
    paddingVertical: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  medicinesList: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
