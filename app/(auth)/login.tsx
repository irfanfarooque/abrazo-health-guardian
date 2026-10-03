import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/layout/ScreenContainer';

export default function LoginScreen() {
  const router = useRouter();
  const supabase = getSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!supabase) {
      setError('Supabase not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[Login] Attempting sign in with:', email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Login] signInWithPassword result:', { data: data?.user?.id, error: signInError?.message });

      if (signInError) {
        // Allow login even if email not confirmed
        if (signInError.message.includes('Email not confirmed')) {
          console.log('[Login] Email not confirmed, but allowing access anyway');
          setTimeout(() => {
            console.log('[Login] Redirecting to dashboard');
            router.replace('/(tabs)');
          }, 500);
          return;
        }
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('[Login] User signed in:', data.user.id);
        // Wait a moment for session to persist, then navigate
        setTimeout(() => {
          console.log('[Login] Redirecting to dashboard');
          router.replace('/(tabs)');
        }, 500);
      } else {
        setError('Sign in failed - no user returned');
        setLoading(false);
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      setError((err as Error)?.message ?? 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue monitoring your health.
          </Text>
        </View>

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
          onPress={signIn}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Continue
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.linkButton}
        >
          Forgot password?
        </Button>

        <View style={styles.footer}>
          <Text>New to ABRAZO?</Text>
          <Button mode="text" onPress={() => router.push('/(auth)/signup')}>
            Create an account
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

