import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Button, TextInput, SegmentedButtons, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useMedicines } from '@/hooks/useMedicines';
import type { MedicineFrequency } from '@/types/medicine';
import { format } from 'date-fns';

export default function MedicineAddScreen() {
  const router = useRouter();
  const { addMedicine, supabaseReady, isLoading } = useMedicines();
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicineFrequency>('once_daily');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [quantityTotal, setQuantityTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frequencyOptions = [
    { value: 'once_daily', label: 'Once' },
    { value: 'twice_daily', label: 'Twice' },
    { value: 'thrice_daily', label: '3x' },
    { value: 'four_times_daily', label: '4x' },
    { value: 'as_needed', label: 'As needed' },
  ];

  const handleSubmit = async () => {
    if (!medicineName.trim() || !dosage.trim()) {
      setError('Please fill in medicine name and dosage');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addMedicine({
        medicine_name: medicineName.trim(),
        dosage: dosage.trim(),
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        quantity_total: quantityTotal ? parseInt(quantityTotal, 10) : null,
        notes: notes.trim() || null,
      });

      Alert.alert('Success', 'Medicine added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer title="Add medicine" subtitle="Capture dosage, frequency, and reminders.">
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            label="Medicine name *"
            mode="outlined"
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder="e.g., Aspirin, Metformin"
            disabled={isSubmitting || !supabaseReady}
          />

          <TextInput
            label="Dosage *"
            mode="outlined"
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 1 tablet, 10ml, 500mg"
            disabled={isSubmitting || !supabaseReady}
          />

          <View style={styles.section}>
            <HelperText type="info" style={styles.sectionLabel}>
              Frequency
            </HelperText>
            <SegmentedButtons
              value={frequency}
              onValueChange={(value) => setFrequency(value as MedicineFrequency)}
              buttons={frequencyOptions}
              style={styles.segmentedButtons}
            />
          </View>

          <TextInput
            label="Start date *"
            mode="outlined"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting || !supabaseReady}
          />

          <TextInput
            label="End date (optional)"
            mode="outlined"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD (leave empty for ongoing)"
            disabled={isSubmitting || !supabaseReady}
          />

          <TextInput
            label="Total quantity (optional)"
            mode="outlined"
            value={quantityTotal}
            onChangeText={setQuantityTotal}
            placeholder="e.g., 30"
            keyboardType="numeric"
            disabled={isSubmitting || !supabaseReady}
          />

          <TextInput
            label="Notes (optional)"
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional information"
            multiline
            numberOfLines={3}
            disabled={isSubmitting || !supabaseReady}
          />

          {error && <HelperText type="error">{error}</HelperText>}

          {!supabaseReady && (
            <HelperText type="error">Supabase not configured. Add keys to .env to enable medicine tracking.</HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!supabaseReady || isLoading || isSubmitting}
            style={styles.submitButton}
          >
            Save Medicine
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            disabled={isSubmitting}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  form: {
    gap: 16,
    paddingBottom: 24,
  },
  section: {
    marginVertical: 8,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
});
