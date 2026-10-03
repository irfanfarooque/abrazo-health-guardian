import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, FAB } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HealthStatusCard } from '@/components/health/HealthStatusCard';
import { HealthAlertCard } from '@/components/health/HealthAlertCard';
import { EmergencyButton } from '@/components/health/EmergencyButton';
import { useAuth } from '@/hooks/useAuth';
import { useAIChat } from '@/hooks/useAIChat';

export default function DashboardScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const { createConversation, aiConfigured } = useAIChat();
  const displayName = profile?.full_name || user?.email || 'Guardian';

  const handleOpenAIChat = async () => {
    try {
      const convId = await createConversation();
      if (convId) {
        router.push(`/ai-chat/${convId}`);
      } else {
        router.push('/ai-chat');
      }
    } catch (error) {
      router.push('/ai-chat');
    }
  };

  return (
    <ScreenContainer title={`Welcome, ${displayName}`} subtitle="Your vitals in one glance.">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.cards}>
          <HealthStatusCard />
          <HealthAlertCard />
          <EmergencyButton />
        </View>
        <View style={styles.actions}>
          <Link href="/health/trends" asChild>
            <Button mode="contained" icon="chart-line">
              View Trends
            </Button>
          </Link>
          <Link href="/settings/devices" asChild>
            <Button mode="outlined" icon="watch">
              Manage devices
            </Button>
          </Link>
        </View>
      </ScrollView>
      <FAB
        icon="robot-happy"
        style={styles.fab}
        onPress={handleOpenAIChat}
        disabled={!aiConfigured}
        label="AI Assistant"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  cards: {
    gap: 16,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

