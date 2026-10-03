import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Text, ActivityIndicator, SegmentedButtons, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { MedicalRecordCard } from '@/components/medical-records/MedicalRecordCard';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import type { MedicalRecordType } from '@/types/medical-record';

export default function MedicalRecordListScreen() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<MedicalRecordType | undefined>(undefined);
  const { records, isLoading, error, supabaseReady, deleteRecord } = useMedicalRecords();

  const filteredRecords = typeFilter ? records.filter((r) => r.record_type === typeFilter) : records;

  const handleDelete = useCallback(
    (recordId: string, recordTitle: string) => {
      Alert.alert('Delete Record', `Are you sure you want to delete "${recordTitle}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(recordId);
              Alert.alert('Success', 'Record deleted');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete record');
            }
          },
        },
      ]);
    },
    [deleteRecord],
  );

  return (
    <ScreenContainer title="Medical Records" subtitle="Your uploaded lab reports and prescriptions.">
      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.filters}>
        <SegmentedButtons
          value={typeFilter || 'all'}
          onValueChange={(value) => setTypeFilter(value === 'all' ? undefined : (value as MedicalRecordType))}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'lab_report', label: 'Lab' },
            { value: 'prescription', label: 'Rx' },
            { value: 'discharge_summary', label: 'Discharge' },
            { value: 'xray', label: 'X-Ray' },
            { value: 'scan', label: 'Scan' },
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : filteredRecords.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                {typeFilter
                  ? `No ${typeFilter.replace('_', ' ')} records.`
                  : 'No medical records uploaded yet. Upload your first record to get started!'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.recordsList}>
            {filteredRecords.map((record) => (
              <MedicalRecordCard
                key={record.id}
                record={record}
                onPress={() => router.push(`/medical-records/${record.id}`)}
                onDelete={() => handleDelete(record.id, record.title)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/medical-records/upload')}
        disabled={!supabaseReady}
        label="Upload Record"
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
  filters: {
    marginBottom: 16,
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
  recordsList: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
