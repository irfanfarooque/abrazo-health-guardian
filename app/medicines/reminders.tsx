import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Text, ActivityIndicator, Dialog, Portal, TextInput, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useMedicines } from '@/hooks/useMedicines';
import { useMedicineReminders } from '@/hooks/useMedicineReminders';
import Ionicons from '@expo/vector-icons/Ionicons';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicineRemindersScreen() {
  const router = useRouter();
  const { medicines } = useMedicines();
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDaily, setIsDaily] = useState(true);

  const selectedMedicine = medicines.find((m) => m.id === selectedMedicineId);
  const { reminders, isLoading, addReminder, removeReminder, supabaseReady } = useMedicineReminders(
    selectedMedicineId || undefined,
  );

  const handleAddReminder = useCallback(async () => {
    if (!selectedMedicineId) {
      Alert.alert('Error', 'Please select a medicine first');
      return;
    }

    try {
      await addReminder({
        user_medicine_id: selectedMedicineId,
        reminder_time: reminderTime,
        days_of_week: isDaily ? null : selectedDays.length > 0 ? selectedDays : null,
      });
      setDialogVisible(false);
      setReminderTime('09:00');
      setSelectedDays([]);
      setIsDaily(true);
      Alert.alert('Success', 'Reminder added successfully!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add reminder');
    }
  }, [selectedMedicineId, reminderTime, isDaily, selectedDays, addReminder]);

  const handleRemove = useCallback(
    async (reminderId: string) => {
      Alert.alert('Remove Reminder', 'Are you sure you want to remove this reminder?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeReminder(reminderId);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove reminder');
            }
          },
        },
      ]);
    },
    [removeReminder],
  );

  return (
    <ScreenContainer title="Reminders" subtitle="Scheduled medicine reminders overview.">
      <ScrollView style={styles.scrollView}>
        {medicines.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No medicines found. Add medicines first to set up reminders.
              </Text>
              <Button mode="contained" onPress={() => router.push('/medicines/add')} style={styles.addButton}>
                Add Medicine
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Medicine</Text>
              {medicines.map((medicine) => (
                <Card
                  key={medicine.id}
                  style={[
                    styles.medicineCard,
                    selectedMedicineId === medicine.id && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedMedicineId(medicine.id)}
                >
                  <Card.Content>
                    <View style={styles.medicineRow}>
                      <Ionicons name="medical" size={20} color="#2563EB" />
                      <Text style={styles.medicineName}>{medicine.medicine_name}</Text>
                      {selectedMedicineId === medicine.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>

            {selectedMedicineId && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Reminders for {selectedMedicine?.medicine_name}
                  </Text>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => setDialogVisible(true)}
                    disabled={!supabaseReady}
                  >
                    Add Reminder
                  </Button>
                </View>

                {isLoading ? (
                  <ActivityIndicator style={styles.loader} />
                ) : reminders.length === 0 ? (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text style={styles.emptyText}>No reminders set. Add one to get notified.</Text>
                    </Card.Content>
                  </Card>
                ) : (
                  reminders.map((reminder) => (
                    <Card key={reminder.id} style={styles.reminderCard}>
                      <Card.Content>
                        <View style={styles.reminderHeader}>
                          <View style={styles.reminderInfo}>
                            <Ionicons name="time-outline" size={20} color="#2563EB" />
                            <Text style={styles.reminderTime}>{reminder.reminder_time}</Text>
                          </View>
                          <Button
                            mode="text"
                            compact
                            textColor="#DC2626"
                            onPress={() => handleRemove(reminder.id)}
                          >
                            Remove
                          </Button>
                        </View>
                        {reminder.days_of_week && reminder.days_of_week.length > 0 ? (
                          <View style={styles.daysContainer}>
                            {reminder.days_of_week.map((day) => (
                              <View key={day} style={styles.dayBadge}>
                                <Text style={styles.dayText}>{dayLabels[day]}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.dailyText}>Daily</Text>
                        )}
                      </Card.Content>
                    </Card>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Add Reminder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Time"
              mode="outlined"
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="HH:MM (e.g., 09:00)"
              style={styles.dialogInput}
            />
            <SegmentedButtons
              value={isDaily ? 'daily' : 'weekly'}
              onValueChange={(value) => setIsDaily(value === 'daily')}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Specific Days' },
              ]}
              style={styles.segmentedButtons}
            />
            {!isDaily && (
              <View style={styles.daysSelector}>
                {dayLabels.map((label, index) => (
                  <Button
                    key={index}
                    mode={selectedDays.includes(index) ? 'contained' : 'outlined'}
                    compact
                    onPress={() => {
                      setSelectedDays((prev) =>
                        prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index],
                      );
                    }}
                    style={styles.dayButton}
                  >
                    {label}
                  </Button>
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddReminder}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  addButton: {
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  medicineCard: {
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicineName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  reminderCard: {
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  dayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  dailyText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  loader: {
    paddingVertical: 24,
  },
  dialogInput: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    minWidth: 50,
  },
});
