import { View, StyleSheet, Text } from 'react-native';
import { Card, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { UserMedicine } from '@/types/medicine';
import { format } from 'date-fns';

type Props = {
  medicine: UserMedicine;
  onPress?: () => void;
  onRemove?: () => void;
};

const frequencyLabels: Record<string, string> = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  thrice_daily: 'Three times daily',
  four_times_daily: 'Four times daily',
  as_needed: 'As needed',
  custom: 'Custom schedule',
};

export function MedicineCard({ medicine, onPress, onRemove }: Props) {
  const startDate = new Date(medicine.start_date);
  const endDate = medicine.end_date ? new Date(medicine.end_date) : null;
  const isOngoing = !endDate || endDate > new Date();

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={24} color="#2563EB" />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{medicine.medicine_name}</Text>
            <Text style={styles.details}>
              {medicine.dosage} • {frequencyLabels[medicine.frequency] || medicine.frequency}
            </Text>
            {medicine.quantity_remaining !== null && (
              <Text style={styles.quantity}>
                Remaining: {medicine.quantity_remaining} {medicine.quantity_total ? `of ${medicine.quantity_total}` : ''}
              </Text>
            )}
            <View style={styles.dateRow}>
              <Text style={styles.date}>
                Started: {format(startDate, 'MMM d, yyyy')}
                {endDate && ` • Ends: ${format(endDate, 'MMM d, yyyy')}`}
              </Text>
            </View>
            {!isOngoing && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            )}
          </View>
        </View>
        {medicine.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{medicine.notes}</Text>
          </View>
        )}
        {onRemove && (
          <Button
            mode="text"
            compact
            textColor="#DC2626"
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={styles.removeButton}
          >
            Remove
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  details: {
    fontSize: 14,
    color: '#64748B',
  },
  quantity: {
    fontSize: 13,
    color: '#94A3B8',
  },
  dateRow: {
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  notes: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
  },
  removeButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
});

