import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function SettingsProfileScreen() {
  const { profileFormValues, supabaseReady, isLoading, saveProfile } = useUserProfile();
  const [form, setForm] = useState(profileFormValues);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profileFormValues);
  }, [profileFormValues]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatus(null);
    setError(null);
    try {
      await saveProfile(form);
      setStatus('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer title="Profile" subtitle="Basic demographic information.">
      <View style={styles.form}>
        <TextInput label="Full name" mode="outlined" value={form.full_name} onChangeText={(text) => handleChange('full_name', text)} />
        <TextInput
          label="Phone number"
          mode="outlined"
          value={form.phone}
          onChangeText={(text) => handleChange('phone', text)}
          keyboardType="phone-pad"
        />
        <TextInput
          label="Preferred language"
          mode="outlined"
          value={form.language_preference}
          onChangeText={(text) => handleChange('language_preference', text)}
        />
        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!supabaseReady || isLoading}>
          Save changes
        </Button>
        {!supabaseReady ? <HelperText type="error">Connect Supabase to enable editing.</HelperText> : null}
        {status ? <HelperText type="info">{status}</HelperText> : null}
        {error ? <HelperText type="error">{error}</HelperText> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});

