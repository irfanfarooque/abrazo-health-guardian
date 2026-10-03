import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserSettings } from '@/hooks/useUserSettings';

export default function SettingsEmergencyScreen() {
  const { profileFormValues, saveProfile, supabaseReady: profileReady } = useUserProfile();
  const { settings, updateSettings, supabaseReady: settingsReady } = useUserSettings();
  const [form, setForm] = useState({
    caregiverName: '',
    caregiverPhone: '',
    relationship: '',
    emergencyNumber: settings.emergency_number ?? '911',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      caregiverName: profileFormValues.emergency_contact_name ?? '',
      caregiverPhone: profileFormValues.emergency_contact_phone ?? '',
      relationship: profileFormValues.emergency_contact_relation ?? '',
    }));
  }, [profileFormValues]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      emergencyNumber: settings.emergency_number ?? '911',
    }));
  }, [settings.emergency_number]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await Promise.all([
        saveProfile({
          ...profileFormValues,
          emergency_contact_name: form.caregiverName,
          emergency_contact_phone: form.caregiverPhone,
          emergency_contact_relation: form.relationship,
        }),
        updateSettings({ emergency_number: form.emergencyNumber }),
      ]);
      setMessage('Emergency details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save emergency details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer title="Emergency contacts" subtitle="Configure SOS workflows.">
      <View style={styles.form}>
        <TextInput label="Caregiver name" mode="outlined" value={form.caregiverName} onChangeText={(text) => setForm((prev) => ({ ...prev, caregiverName: text }))} />
        <TextInput
          label="Caregiver phone"
          mode="outlined"
          value={form.caregiverPhone}
          onChangeText={(text) => setForm((prev) => ({ ...prev, caregiverPhone: text }))}
          keyboardType="phone-pad"
        />
        <TextInput label="Relationship" mode="outlined" value={form.relationship} onChangeText={(text) => setForm((prev) => ({ ...prev, relationship: text }))} />
        <TextInput
          label="Emergency number"
          mode="outlined"
          value={form.emergencyNumber}
          onChangeText={(text) => setForm((prev) => ({ ...prev, emergencyNumber: text }))}
          keyboardType="phone-pad"
        />
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!profileReady || !settingsReady}
        >
          Save caregiver
        </Button>
        <Text style={styles.hint}>
          SOS actions will call the configured emergency number and notify caregivers with your latest vitals.
        </Text>
        {!profileReady || !settingsReady ? (
          <HelperText type="error">Connect Supabase to sync emergency data.</HelperText>
        ) : null}
        {message ? <HelperText type="info">{message}</HelperText> : null}
        {error ? <HelperText type="error">{error}</HelperText> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  hint: {
    color: '#64748B',
  },
});

