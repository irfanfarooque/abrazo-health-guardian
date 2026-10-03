import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { deepSeekClient } from '@/services/ai/deepseekClient';
import { useHealthMetrics } from './useHealthMetrics';
import { useHealthAlerts } from './useHealthAlerts';
import type { ChatConversation, ChatMessage, HealthContext } from '@/types/ai';

export function useAIChat(conversationId?: string) {
  const { user } = useAuth();
  const supabase = getSupabase();
  const { latest } = useHealthMetrics();
  const { alerts } = useHealthAlerts();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);
  const isAIConfigured = deepSeekClient.isConfigured();

  const buildHealthContext = useCallback((): HealthContext => {
    return {
      latest_metrics: latest,
      active_alerts: alerts
        .filter((a) => !a.is_resolved)
        .slice(0, 5)
        .map((a) => ({
          severity: a.severity,
          title: a.title,
          message: a.message,
        })),
    };
  }, [latest, alerts]);

  const fetchConversations = useCallback(async () => {
    if (!supabase || !user) {
      setConversations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  const fetchMessages = useCallback(
    async (convId: string) => {
      if (!supabase || !user) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setMessages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user],
  );

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!supabase || !user) {
      throw new Error('Supabase not configured or user not authenticated');
    }

    const { data, error: insertError } = await supabase
      .from('ai_chat_conversations')
      .insert({
        user_id: user.id,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (insertError && insertError.code !== '42P01') {
      throw new Error(insertError.message);
    }

    if (data) {
      await fetchConversations();
      return data.id;
    }

    return null;
  }, [supabase, user, fetchConversations]);

  const sendMessage = useCallback(
    async (content: string, convId?: string): Promise<ChatMessage | null> => {
      if (!isAIConfigured) {
        throw new Error('AI assistant not configured. Please add DeepSeek API key to .env');
      }

      let conversationId = convId;

      // Create conversation if needed
      if (!conversationId) {
        conversationId = await createConversation();
        if (!conversationId) {
          throw new Error('Failed to create conversation');
        }
      }

      setIsSending(true);
      setError(null);

      try {
        // Save user message
        const { data: userMessage, error: userMsgError } = await supabase!
          .from('ai_chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content,
          })
          .select()
          .single();

        if (userMsgError && userMsgError.code !== '42P01') {
          throw new Error(userMsgError.message);
        }

        if (userMessage) {
          setMessages((prev) => [...prev, userMessage as ChatMessage]);
        }

        // Get health context
        const healthContext = buildHealthContext();

        // Get conversation history for context
        const historyMessages = messages
          .filter((m) => m.conversation_id === conversationId)
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Call AI
        const aiResponse = await deepSeekClient.chat(
          [
            ...historyMessages,
            {
              role: 'user',
              content,
            },
          ],
          healthContext,
        );

        // Save AI response
        const { data: assistantMessage, error: assistantMsgError } = await supabase!
          .from('ai_chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse.content,
            metadata: aiResponse.action ? { action: aiResponse.action } : null,
          })
          .select()
          .single();

        if (assistantMsgError && assistantMsgError.code !== '42P01') {
          throw new Error(assistantMsgError.message);
        }

        // Update conversation title if it's the first message
        if (messages.length === 0 && userMessage) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          await supabase!
            .from('ai_chat_conversations')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
        } else {
          await supabase!
            .from('ai_chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
        }

        if (assistantMessage) {
          setMessages((prev) => [...prev, assistantMessage as ChatMessage]);
          await fetchConversations();
          return assistantMessage as ChatMessage;
        }

        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSending(false);
      }
    },
    [isAIConfigured, supabase, user, messages, createConversation, buildHealthContext, fetchConversations],
  );

  const deleteConversation = useCallback(
    async (convId: string) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('ai_chat_conversations')
        .delete()
        .eq('id', convId)
        .eq('user_id', user.id);

      if (deleteError && deleteError.code !== '42P01') {
        throw new Error(deleteError.message);
      }

      await fetchConversations();
      if (conversationId === convId) {
        setMessages([]);
      }
    },
    [supabase, user, fetchConversations],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchConversations();
    }
  }, [canUseSupabase, fetchConversations]);

  useEffect(() => {
    if (conversationId && canUseSupabase) {
      fetchMessages(conversationId);
    }
  }, [conversationId, canUseSupabase, fetchMessages]);

  return {
    conversations,
    messages,
    isLoading,
    isSending,
    error,
    supabaseReady: canUseSupabase,
    aiConfigured: isAIConfigured,
    refreshConversations: fetchConversations,
    sendMessage,
    deleteConversation,
    createConversation,
  };
}

