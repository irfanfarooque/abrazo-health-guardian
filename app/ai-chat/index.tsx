import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, ActivityIndicator, Text, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAIChat } from '@/hooks/useAIChat';

export default function AiChatListScreen() {
  const router = useRouter();
  const { conversations, isLoading, error, supabaseReady, aiConfigured, createConversation, deleteConversation } =
    useAIChat();

  const handleNewChat = useCallback(async () => {
    try {
      const convId = await createConversation();
      if (convId) {
        router.push(`/ai-chat/${convId}`);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create conversation');
    }
  }, [createConversation, router]);

  const handleDelete = useCallback(
    async (convId: string, title: string) => {
      Alert.alert('Delete Conversation', `Are you sure you want to delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(convId);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete conversation');
            }
          },
        },
      ]);
    },
    [deleteConversation],
  );

  return (
    <ScreenContainer title="AI Health Assistant" subtitle="Conversations synced across devices.">
      {!aiConfigured && (
        <Card style={[styles.card, styles.warningCard]}>
          <Card.Content>
            <Text style={styles.warningText}>
              AI assistant not configured. Add EXPO_PUBLIC_DEEPSEEK_API_KEY to your .env file.
            </Text>
          </Card.Content>
        </Card>
      )}

      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : conversations.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No conversations yet. Start a new chat to ask about your health, book consultations, or order
                medicines.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                style={styles.conversationCard}
                onPress={() => router.push(`/ai-chat/${conv.id}`)}
              >
                <Card.Content>
                  <View style={styles.conversationHeader}>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.conversationTitle}>{conv.title || 'New Conversation'}</Text>
                      <Text style={styles.conversationDate}>
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Button
                      mode="text"
                      compact
                      textColor="#DC2626"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id, conv.title || 'Conversation');
                      }}
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNewChat}
        disabled={!supabaseReady || !aiConfigured}
        label="New Chat"
      />
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
  warningCard: {
    backgroundColor: '#FEF3C7',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
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
  conversationsList: {
    gap: 12,
    paddingBottom: 80,
  },
  conversationCard: {
    marginBottom: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    gap: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  conversationDate: {
    fontSize: 12,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
