import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HelperText, List, Switch } from 'react-native-paper';
import { useUserSettings } from '@/hooks/useUserSettings';

type ToggleKeys = 'notification_medicine_reminders' | 'notification_consultation_reminders' | 'notification_health_alerts' | 'notification_ble_status';

export default function SettingsNotificationsScreen() {
  const { settings, updateSettings, supabaseReady, isLoading, error } = useUserSettings();
  const [local, setLocal] = useState({
    notification_medicine_reminders: true,
    notification_consultation_reminders: true,
    notification_health_alerts: true,
    notification_ble_status: true,
  });
  const [savingKey, setSavingKey] = useState<ToggleKeys | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setLocal({
      notification_medicine_reminders: settings.notification_medicine_reminders,
      notification_consultation_reminders: settings.notification_consultation_reminders,
      notification_health_alerts: settings.notification_health_alerts,
      notification_ble_status: settings.notification_ble_status,
    });
  }, [settings.notification_medicine_reminders, settings.notification_consultation_reminders, settings.notification_health_alerts, settings.notification_ble_status]);

  const handleToggle = async (key: ToggleKeys, value: boolean) => {
    const previous = local[key];
    setLocal((prev) => ({ ...prev, [key]: value }));
    if (!supabaseReady) {
      setStatus('Connect Supabase to persist notification preferences.');
      return;
    }
    setSavingKey(key);
    setStatus(null);
    try {
      await updateSettings({ [key]: value });
      setStatus('Preferences updated.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to update preferences.');
      setLocal((prev) => ({ ...prev, [key]: previous }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <ScreenContainer title="Notifications" subtitle="Choose the reminders that matter most.">
      <List.Section>
        <List.Item
          title="Medicine reminders"
          description="Local + push notifications for schedules"
          right={() => (
            <Switch
              value={local.notification_medicine_reminders}
              onValueChange={(val) => handleToggle('notification_medicine_reminders', val)}
              disabled={!supabaseReady || isLoading}
            />
          )}
        />
        <List.Item
          title="Consultation reminders"
          description="24h + 1h alerts"
          right={() => (
            <Switch
              value={local.notification_consultation_reminders}
              onValueChange={(val) => handleToggle('notification_consultation_reminders', val)}
              disabled={!supabaseReady || isLoading}
            />
          )}
        />
        <List.Item
          title="AI health alerts"
          description="Critical trend warnings"
          right={() => (
            <Switch
              value={local.notification_health_alerts}
              onValueChange={(val) => handleToggle('notification_health_alerts', val)}
              disabled={!supabaseReady || isLoading}
            />
          )}
        />
        <List.Item
          title="Device connectivity"
          description="BLE battery low/disconnected"
          right={() => (
            <Switch
              value={local.notification_ble_status}
              onValueChange={(val) => handleToggle('notification_ble_status', val)}
              disabled={!supabaseReady || isLoading}
            />
          )}
        />
      </List.Section>
      {savingKey ? <HelperText type="info">Updating preference…</HelperText> : null}
      {status ? <HelperText type="info">{status}</HelperText> : null}
      {error ? <HelperText type="error">{error}</HelperText> : null}
      {!supabaseReady ? <HelperText type="error">Supabase not configured; toggles are local only.</HelperText> : null}
    </ScreenContainer>
  );
}

