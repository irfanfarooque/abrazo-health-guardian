import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/layout/ScreenContainer';

export default function SignUpScreen() {
  const router = useRouter();
  const supabase = getSupabase();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async () => {
    if (!email || !password || !fullName) {
      setError('All fields are required');
      return;
    }

    if (!supabase) {
      setError('Supabase not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Create user profile with email from auth
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: fullName,
        });

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        // Create user settings with defaults
        await supabase.from('user_settings').insert({
          user_id: authData.user.id,
          notification_medicine_reminders: true,
          notification_consultation_reminders: true,
          notification_health_alerts: true,
          data_sync_frequency_minutes: 5,
          emergency_number: '911',
        });

        router.replace('/(tabs)');
      }
    } catch (err) {
      setError((err as Error)?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Create account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Set up your ABRAZO Health Guardian profile.
          </Text>
        </View>

        <TextInput
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
          editable={!loading}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
          editable={!loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          editable={!loading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          mode="contained"
          onPress={signUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Sign up
        </Button>

        <View style={styles.footer}>
          <Text>Already have an account?</Text>
          <Button mode="text" onPress={() => router.push('/(auth)/login')}>
            Log in
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
  linkButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  error: {
    color: '#d32f2f',
    marginBottom: 16,
  },
});

