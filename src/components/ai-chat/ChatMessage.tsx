import { View, StyleSheet, Text } from 'react-native';
import { Card } from 'react-native-paper';
import type { ChatMessage as ChatMessageType } from '@/types/ai';

type Props = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <Card
        style={[
          styles.messageCard,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <Card.Content style={styles.content}>
          <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
          {message.metadata?.action && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionText}>
                {message.metadata.action.type === 'book_consultation' && '📅 Consultation'}
                {message.metadata.action.type === 'order_medicine' && '💊 Medicine Order'}
                {message.metadata.action.type === 'analyze_health' && '📊 Health Analysis'}
                {message.metadata.action.type === 'first_aid' && '🚑 First Aid'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  messageCard: {
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#2563EB',
  },
  assistantMessage: {
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1E293B',
  },
  actionBadge: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

