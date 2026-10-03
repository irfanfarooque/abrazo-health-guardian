import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
};

export function ChatInput({ onSend, isSending, disabled }: Props) {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending || disabled) {
      return;
    }

    setMessage('');
    try {
      await onSend(trimmed);
    } catch (error) {
      // Error handling is done in parent component
      console.error('[Chat] Failed to send message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Ask about your health, book consultations, order medicines..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            disabled={isSending || disabled}
            style={styles.input}
            contentStyle={styles.inputContent}
            right={
              isSending ? (
                <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
              ) : (
                <TextInput.Icon
                  icon="send"
                  onPress={handleSend}
                  disabled={!message.trim() || disabled}
                />
              )
            }
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>
        <Button
          mode="contained"
          onPress={handleSend}
          disabled={!message.trim() || isSending || disabled}
          style={styles.sendButton}
          contentStyle={styles.sendButtonContent}
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
  },
  inputContent: {
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
  sendButtonContent: {
    paddingVertical: 8,
  },
});

