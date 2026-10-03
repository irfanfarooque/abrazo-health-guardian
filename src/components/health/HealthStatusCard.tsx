import { View, StyleSheet, Text } from 'react-native';
import { Card, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import type { LatestHealthMetrics } from '@/types/health';

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

function MetricRow({ label, value, unit, timestamp }: { label: string; value: string; unit?: string; timestamp?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {value} {unit && <Text style={styles.metricUnit}>{unit}</Text>}
        </Text>
        {timestamp && <Text style={styles.metricTime}>{formatTimestamp(timestamp)}</Text>}
      </View>
    </View>
  );
}

export function HealthStatusCard() {
  const { latest, isLoading, supabaseReady } = useHealthMetrics();

  if (!supabaseReady) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Ionicons name="pulse-outline" size={24} color="#2563EB" />
            <Text style={styles.title}>Health Status</Text>
          </View>
          <Text style={styles.emptyText}>Connect a BLE device to start monitoring your vitals.</Text>
        </Card.Content>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Ionicons name="pulse-outline" size={24} color="#2563EB" />
            <Text style={styles.title}>Health Status</Text>
          </View>
          <ActivityIndicator style={styles.loader} />
        </Card.Content>
      </Card>
    );
  }

  const hasData = Object.keys(latest).length > 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Ionicons name="pulse-outline" size={24} color="#2563EB" />
          <Text style={styles.title}>Health Status</Text>
        </View>

        {!hasData ? (
          <Text style={styles.emptyText}>No recent readings. Connect a device to start tracking.</Text>
        ) : (
          <View style={styles.metrics}>
            {latest.blood_pressure && (
              <MetricRow
                label="Blood Pressure"
                value={`${latest.blood_pressure.systolic}/${latest.blood_pressure.diastolic}`}
                unit="mmHg"
                timestamp={latest.blood_pressure.recorded_at}
              />
            )}
            {latest.heart_rate && (
              <MetricRow
                label="Heart Rate"
                value={latest.heart_rate.value.toFixed(0)}
                unit={latest.heart_rate.unit || 'bpm'}
                timestamp={latest.heart_rate.recorded_at}
              />
            )}
            {latest.spo2 && (
              <MetricRow
                label="SpO₂"
                value={latest.spo2.value.toFixed(1)}
                unit={latest.spo2.unit || '%'}
                timestamp={latest.spo2.recorded_at}
              />
            )}
            {latest.temperature && (
              <MetricRow
                label="Temperature"
                value={latest.temperature.value.toFixed(1)}
                unit={latest.temperature.unit || '°C'}
                timestamp={latest.temperature.recorded_at}
              />
            )}
            {latest.respiration && (
              <MetricRow
                label="Respiration"
                value={latest.respiration.value.toFixed(0)}
                unit={latest.respiration.unit || 'bpm'}
                timestamp={latest.respiration.recorded_at}
              />
            )}
            {latest.steps && (
              <MetricRow
                label="Steps"
                value={latest.steps.value.toFixed(0)}
                unit={latest.steps.unit || ''}
                timestamp={latest.steps.recorded_at}
              />
            )}
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
  metrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  metricValueRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
  },
  metricTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

