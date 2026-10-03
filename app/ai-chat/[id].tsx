import { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ActivityIndicator, Text, Card } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatMessage } from '@/components/ai-chat/ChatMessage';
import { ChatInput } from '@/components/ai-chat/ChatInput';
import { useAIChat } from '@/hooks/useAIChat';

export default function AiChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    messages,
    isLoading,
    isSending,
    error,
    supabaseReady,
    aiConfigured,
    sendMessage,
  } = useAIChat(id);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await sendMessage(content, id);
        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [sendMessage, id],
  );

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  if (!id) {
    return (
      <ScreenContainer title="Error" subtitle="Invalid conversation ID">
        <Card style={styles.card}>
          <Card.Content>
            <Text>Conversation not found. Please go back and start a new chat.</Text>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenContainer title="AI Health Assistant" subtitle="Ask about your health, book consultations, order medicines.">
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

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading && messages.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loaderText}>Loading conversation...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Start a conversation! You can ask about:{'\n\n'}
                • Your health metrics and what they mean{'\n'}
                • First aid guidance{'\n'}
                • Booking consultations{'\n'}
                • Ordering medicines{'\n'}
                • General health questions
              </Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <ChatInput onSend={handleSend} isSending={isSending} disabled={!supabaseReady || !aiConfigured} />
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesList: {
    gap: 4,
  },
  loaderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
