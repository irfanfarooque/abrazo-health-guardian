import { View, StyleSheet, Text } from 'react-native';
import { Card, ActivityIndicator, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useHealthAlerts } from '@/hooks/useHealthAlerts';
import type { HealthAlertSeverity } from '@/types/health';

const severityColors: Record<HealthAlertSeverity, { bg: string; icon: string; text: string }> = {
  red: { bg: '#FEE2E2', icon: '#DC2626', text: '#991B1B' },
  yellow: { bg: '#FEF3C7', icon: '#F59E0B', text: '#92400E' },
  green: { bg: '#D1FAE5', icon: '#10B981', text: '#065F46' },
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function HealthAlertCard() {
  const { alerts, unreadCount, isLoading, supabaseReady, markAsRead, resolveAlert } = useHealthAlerts();

  if (!supabaseReady) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Ionicons name="warning-outline" size={24} color="#F97316" />
            <Text style={styles.title}>AI Health Alerts</Text>
          </View>
          <Text style={styles.emptyText}>AI-driven insights will appear here once we have enough historical data.</Text>
        </Card.Content>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Ionicons name="warning-outline" size={24} color="#F97316" />
            <Text style={styles.title}>AI Health Alerts</Text>
          </View>
          <ActivityIndicator style={styles.loader} />
        </Card.Content>
      </Card>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.is_resolved).slice(0, 3);
  const hasAlerts = activeAlerts.length > 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Ionicons name="warning-outline" size={24} color="#F97316" />
          <Text style={styles.title}>AI Health Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {!hasAlerts ? (
          <Text style={styles.emptyText}>All clear! No active health alerts.</Text>
        ) : (
          <View style={styles.alertsList}>
            {activeAlerts.map((alert) => {
              const colors = severityColors[alert.severity];
              return (
                <View key={alert.id} style={[styles.alertItem, { backgroundColor: colors.bg }]}>
                  <View style={styles.alertHeader}>
                    <Ionicons name="alert-circle" size={20} color={colors.icon} />
                    <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  {alert.recommended_action && (
                    <Text style={styles.alertAction}>💡 {alert.recommended_action}</Text>
                  )}
                  <View style={styles.alertFooter}>
                    <Text style={styles.alertTime}>{formatTimestamp(alert.created_at)}</Text>
                    {!alert.is_read && (
                      <Button
                        mode="text"
                        compact
                        onPress={() => markAsRead(alert.id)}
                        textColor={colors.text}
                        style={styles.alertButton}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      mode="text"
                      compact
                      onPress={() => resolveAlert(alert.id)}
                      textColor={colors.text}
                      style={styles.alertButton}
                    >
                      Resolve
                    </Button>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  loader: {
    paddingVertical: 16,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  alertAction: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  alertTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  alertButton: {
    marginLeft: 8,
  },
});

