import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useConsultations } from '@/hooks/useConsultations';
import { format } from 'date-fns';
import type { ConsultationStatus } from '@/types/consultation';

export default function ConsultationListScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | undefined>(undefined);
  const { consultations, isLoading, error, supabaseReady, cancelConsultation } = useConsultations();

  const filteredConsultations = statusFilter
    ? consultations.filter((c) => c.status === statusFilter)
    : consultations;

  const handleCancel = useCallback(
    async (consultationId: string, doctorName: string) => {
      Alert.alert('Cancel Consultation', `Are you sure you want to cancel your appointment with ${doctorName}?`, [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelConsultation(consultationId);
              Alert.alert('Success', 'Consultation cancelled');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to cancel consultation');
            }
          },
        },
      ]);
    },
    [cancelConsultation],
  );

  return (
    <ScreenContainer title="Consultations" subtitle="All of your scheduled and past appointments.">
      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.filters}>
        <SegmentedButtons
          value={statusFilter || 'all'}
          onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : (value as ConsultationStatus))}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Upcoming' },
            { value: 'completed', label: 'Past' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : filteredConsultations.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                {statusFilter ? `No ${statusFilter} consultations.` : 'No consultations scheduled. Book your first appointment!'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.consultationsList}>
            {filteredConsultations.map((consultation) => (
              <Card key={consultation.id} style={styles.consultationCard}>
                <Card.Content>
                  <Text style={styles.date}>
                    {format(new Date(consultation.appointment_date), 'MMM d, yyyy')} at {consultation.appointment_time}
                  </Text>
                  <Text style={styles.type}>{consultation.consultation_type.replace('_', ' ')}</Text>
                  {consultation.status === 'scheduled' && (
                    <View style={styles.actions}>
                      <Button mode="outlined" compact onPress={() => router.push(`/consultation/${consultation.id}`)}>
                        View Details
                      </Button>
                      <Button
                        mode="text"
                        compact
                        textColor="#DC2626"
                        onPress={() => handleCancel(consultation.id, 'Doctor')}
                      >
                        Cancel
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Button
        mode="contained"
        style={styles.fab}
        onPress={() => router.push('/consultation/book')}
        disabled={!supabaseReady}
        icon="calendar-plus"
      >
        Book Consultation
      </Button>
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
  consultationsList: {
    paddingBottom: 80,
  },
  consultationCard: {
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
