import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Button,
  TextInput,
  Text,
  Card,
  ActivityIndicator,
  SegmentedButtons,
  HelperText,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useConsultations, useSpecialties, useDoctors } from '@/hooks/useConsultations';
import type { ConsultationType } from '@/types/consultation';
import { format } from 'date-fns';

export default function ConsultationBookScreen() {
  const router = useRouter();
  const { bookConsultation, supabaseReady } = useConsultations();
  const { specialties, isLoading: loadingSpecialties } = useSpecialties();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const { doctors, isLoading: loadingDoctors } = useDoctors(selectedSpecialtyId || undefined);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('online');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const selectedSpecialty = specialties.find((s) => s.id === selectedSpecialtyId);

  const handleSubmit = useCallback(async () => {
    if (!selectedSpecialtyId || !selectedDoctorId) {
      setError('Please select a specialty and doctor');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setError('Please select date and time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await bookConsultation({
        doctor_id: selectedDoctorId,
        specialty_id: selectedSpecialtyId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        consultation_type: consultationType,
        location: consultationType === 'in_person' ? location : null,
        meeting_link: consultationType === 'online' ? meetingLink : null,
        reason: reason || null,
      });

      Alert.alert('Success', 'Consultation booked successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book consultation');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedSpecialtyId,
    selectedDoctorId,
    appointmentDate,
    appointmentTime,
    consultationType,
    location,
    meetingLink,
    reason,
    bookConsultation,
    router,
  ]);

  return (
    <ScreenContainer title="Book consultation" subtitle="Select specialty, doctor, and preferred time.">
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Specialty Selection */}
          <View style={styles.section}>
            <HelperText type="info" style={styles.sectionLabel}>
              Select Specialty *
            </HelperText>
            {loadingSpecialties ? (
              <ActivityIndicator />
            ) : specialties.length === 0 ? (
              <Text style={styles.emptyText}>No specialties available</Text>
            ) : (
              <View style={styles.optionsList}>
                {specialties.map((specialty) => (
                  <Card
                    key={specialty.id}
                    style={[
                      styles.optionCard,
                      selectedSpecialtyId === specialty.id && styles.selectedCard,
                    ]}
                    onPress={() => {
                      setSelectedSpecialtyId(specialty.id);
                      setSelectedDoctorId(null); // Reset doctor when specialty changes
                    }}
                  >
                    <Card.Content>
                      <Text style={styles.optionTitle}>{specialty.name}</Text>
                      {specialty.description && (
                        <Text style={styles.optionDescription}>{specialty.description}</Text>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Doctor Selection */}
          {selectedSpecialtyId && (
            <View style={styles.section}>
              <HelperText type="info" style={styles.sectionLabel}>
                Select Doctor *
              </HelperText>
              {loadingDoctors ? (
                <ActivityIndicator />
              ) : doctors.length === 0 ? (
                <Text style={styles.emptyText}>No doctors available for this specialty</Text>
              ) : (
                <View style={styles.optionsList}>
                  {doctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      style={[
                        styles.optionCard,
                        selectedDoctorId === doctor.id && styles.selectedCard,
                      ]}
                      onPress={() => setSelectedDoctorId(doctor.id)}
                    >
                      <Card.Content>
                        <Text style={styles.optionTitle}>{doctor.full_name}</Text>
                        {doctor.qualification && (
                          <Text style={styles.optionDescription}>{doctor.qualification}</Text>
                        )}
                        {doctor.hospital_clinic_name && (
                          <Text style={styles.optionDescription}>{doctor.hospital_clinic_name}</Text>
                        )}
                        {doctor.rating > 0 && (
                          <Text style={styles.rating}>⭐ {doctor.rating.toFixed(1)} ({doctor.total_reviews} reviews)</Text>
                        )}
                        {doctor.consultation_fee && (
                          <Text style={styles.fee}>Fee: ${doctor.consultation_fee}</Text>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Consultation Type */}
          <View style={styles.section}>
            <HelperText type="info" style={styles.sectionLabel}>
              Consultation Type *
            </HelperText>
            <SegmentedButtons
              value={consultationType}
              onValueChange={(value) => setConsultationType(value as ConsultationType)}
              buttons={[
                { value: 'online', label: 'Online' },
                { value: 'in_person', label: 'In Person' },
                { value: 'phone', label: 'Phone' },
              ]}
            />
          </View>

          {/* Date & Time */}
          <TextInput
            label="Appointment Date *"
            mode="outlined"
            value={appointmentDate}
            onChangeText={setAppointmentDate}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting || !supabaseReady}
          />

          <TextInput
            label="Appointment Time *"
            mode="outlined"
            value={appointmentTime}
            onChangeText={setAppointmentTime}
            placeholder="HH:MM (e.g., 10:00)"
            disabled={isSubmitting || !supabaseReady}
          />

          {/* Location for in-person */}
          {consultationType === 'in_person' && (
            <TextInput
              label="Location"
              mode="outlined"
              value={location}
              onChangeText={setLocation}
              placeholder="Clinic/hospital address"
              disabled={isSubmitting || !supabaseReady}
            />
          )}

          {/* Meeting link for online */}
          {consultationType === 'online' && (
            <TextInput
              label="Meeting Link (optional)"
              mode="outlined"
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder="Zoom/Google Meet link"
              disabled={isSubmitting || !supabaseReady}
            />
          )}

          {/* Reason */}
          <TextInput
            label="Reason for consultation (optional)"
            mode="outlined"
            value={reason}
            onChangeText={setReason}
            placeholder="Brief description"
            multiline
            numberOfLines={3}
            disabled={isSubmitting || !supabaseReady}
          />

          {error && <HelperText type="error">{error}</HelperText>}

          {!supabaseReady && (
            <HelperText type="error">
              Supabase not configured. Add keys to .env to enable booking.
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!supabaseReady || isSubmitting || !selectedSpecialtyId || !selectedDoctorId}
            style={styles.submitButton}
          >
            Book Consultation
          </Button>

          <Button mode="text" onPress={() => router.back()} disabled={isSubmitting} style={styles.cancelButton}>
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
    fontSize: 14,
    fontWeight: '600',
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  rating: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  fee: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
});
