import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { HealthAlert } from '@/types/health';

export function useHealthAlerts() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchAlerts = useCallback(
    async (includeResolved = false) => {
      if (!supabase || !user) {
        setAlerts([]);
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('health_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!includeResolved) {
          query = query.eq('is_resolved', false);
        }

        const { data, error: queryError } = await query;

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setAlerts(data || []);

        // Count unread
        const unread = (data || []).filter((a) => !a.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health alerts');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user],
  );

  const markAsRead = useCallback(
    async (alertId: string) => {
      if (!supabase || !user) return;

      const { error: updateError } = await supabase
        .from('health_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        console.warn('[Health] Failed to mark alert as read:', updateError.message);
        return;
      }

      await fetchAlerts();
    },
    [supabase, user, fetchAlerts],
  );

  const resolveAlert = useCallback(
    async (alertId: string) => {
      if (!supabase || !user) return;

      const { error: updateError } = await supabase
        .from('health_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        console.warn('[Health] Failed to resolve alert:', updateError.message);
        return;
      }

      await fetchAlerts();
    },
    [supabase, user, fetchAlerts],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchAlerts();
    }
  }, [canUseSupabase, fetchAlerts]);

  return {
    alerts,
    unreadCount,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchAlerts,
    markAsRead,
    resolveAlert,
  };
}

