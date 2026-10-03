import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, Chip, Card, ActivityIndicator } from 'react-native-paper';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HealthChart } from '@/components/health/HealthChart';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import { analyzeTrend, analyzeOverallTrend, type TrendAnalysis } from '@/utils/trendAnalysis';
import { PlaceholderCard } from '@/components/layout/PlaceholderCard';
import Ionicons from '@expo/vector-icons/Ionicons';

type Period = '7d' | '30d' | '90d' | 'all';

export default function HealthTrendsScreen() {
  const { metrics, isLoading, supabaseReady } = useHealthMetrics();
  const [period, setPeriod] = useState<Period>('30d');

  const days = useMemo(() => {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case 'all':
        return 365;
      default:
        return 30;
    }
  }, [period]);

  const filteredMetrics = useMemo(() => {
    if (!metrics || period === 'all') return metrics || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return (metrics || []).filter((m) => new Date(m.recorded_at) >= cutoffDate);
  }, [metrics, period, days]);

  const overallTrend = useMemo(() => {
    if (!filteredMetrics.length) return null;
    return analyzeOverallTrend(filteredMetrics);
  }, [filteredMetrics]);

  const heartRateTrend = useMemo(() => {
    if (!filteredMetrics.length) return null;
    return analyzeTrend(filteredMetrics, 'heart_rate', days);
  }, [filteredMetrics, days]);

  const spo2Trend = useMemo(() => {
    if (!filteredMetrics.length) return null;
    return analyzeTrend(filteredMetrics, 'spo2', days);
  }, [filteredMetrics, days]);

  const temperatureTrend = useMemo(() => {
    if (!filteredMetrics.length) return null;
    return analyzeTrend(filteredMetrics, 'temperature', days);
  }, [filteredMetrics, days]);

  const stepsTrend = useMemo(() => {
    if (!filteredMetrics.length) return null;
    return analyzeTrend(filteredMetrics, 'steps', days);
  }, [filteredMetrics, days]);

  if (!supabaseReady) {
    return (
      <ScreenContainer title="Health Trends" subtitle="Visualize your health data over time.">
        <PlaceholderCard
          title="Supabase not configured"
          description="Please ensure your Supabase keys are set in the .env file to enable trend analysis."
        />
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer title="Health Trends" subtitle="Visualize your health data over time.">
        <ActivityIndicator style={styles.loader} />
        <Text style={styles.loaderText}>Loading health data...</Text>
      </ScreenContainer>
    );
  }

  if (!filteredMetrics || filteredMetrics.length === 0) {
    return (
      <ScreenContainer title="Health Trends" subtitle="Visualize your health data over time.">
        <PlaceholderCard
          title="No data available"
          description="Start using BLE devices or manually log health metrics to see trends and charts."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Health Trends" subtitle="Visualize your health data over time.">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
            buttons={[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: 'all', label: 'All Time' },
            ]}
          />
        </View>

        {/* Overall Trend Summary */}
        {overallTrend && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Overall Health Trend</Text>
                <Chip
                  icon={() => (
                    <Ionicons
                      name={
                        overallTrend.overall === 'improving'
                          ? 'trending-up'
                          : overallTrend.overall === 'declining'
                            ? 'trending-down'
                            : 'remove'
                      }
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                  style={[
                    styles.summaryChip,
                    {
                      backgroundColor:
                        overallTrend.overall === 'improving'
                          ? '#10B981'
                          : overallTrend.overall === 'declining'
                            ? '#EF4444'
                            : '#64748B',
                    },
                  ]}
                  textStyle={styles.summaryChipText}
                >
                  {overallTrend.overall === 'improving'
                    ? 'Improving'
                    : overallTrend.overall === 'declining'
                      ? 'Declining'
                      : 'Stable'}
                </Chip>
              </View>
              <View style={styles.summaryStats}>
                {overallTrend.criticalAlerts > 0 && (
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#DC2626' }]}>
                      {overallTrend.criticalAlerts}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Critical</Text>
                  </View>
                )}
                {overallTrend.warnings > 0 && (
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
                      {overallTrend.warnings}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Warnings</Text>
                  </View>
                )}
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{filteredMetrics.length}</Text>
                  <Text style={styles.summaryStatLabel}>Data Points</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Individual Metric Charts */}
        <HealthChart
          metrics={filteredMetrics}
          metricType="heart_rate"
          title="Heart Rate"
          unit="bpm"
          color="#EF4444"
          isLoading={isLoading}
        />

        {heartRateTrend && (
          <Card style={styles.trendCard}>
            <Card.Content>
              <View style={styles.trendHeader}>
                <Ionicons
                  name={
                    heartRateTrend.direction === 'increasing'
                      ? 'arrow-up'
                      : heartRateTrend.direction === 'decreasing'
                        ? 'arrow-down'
                        : 'remove'
                  }
                  size={20}
                  color={
                    heartRateTrend.severity === 'critical'
                      ? '#DC2626'
                      : heartRateTrend.severity === 'warning'
                        ? '#F59E0B'
                        : '#64748B'
                  }
                />
                <Text
                  style={[
                    styles.trendMessage,
                    {
                      color:
                        heartRateTrend.severity === 'critical'
                          ? '#DC2626'
                          : heartRateTrend.severity === 'warning'
                            ? '#F59E0B'
                            : '#64748B',
                    },
                  ]}
                >
                  {heartRateTrend.message}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <HealthChart
          metrics={filteredMetrics}
          metricType="spo2"
          title="Oxygen Saturation (SpO₂)"
          unit="%"
          color="#3B82F6"
          isLoading={isLoading}
        />

        {spo2Trend && (
          <Card style={styles.trendCard}>
            <Card.Content>
              <View style={styles.trendHeader}>
                <Ionicons
                  name={
                    spo2Trend.direction === 'increasing'
                      ? 'arrow-up'
                      : spo2Trend.direction === 'decreasing'
                        ? 'arrow-down'
                        : 'remove'
                  }
                  size={20}
                  color={
                    spo2Trend.severity === 'critical'
                      ? '#DC2626'
                      : spo2Trend.severity === 'warning'
                        ? '#F59E0B'
                        : '#64748B'
                  }
                />
                <Text
                  style={[
                    styles.trendMessage,
                    {
                      color:
                        spo2Trend.severity === 'critical'
                          ? '#DC2626'
                          : spo2Trend.severity === 'warning'
                            ? '#F59E0B'
                            : '#64748B',
                    },
                  ]}
                >
                  {spo2Trend.message}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <HealthChart
          metrics={filteredMetrics}
          metricType="temperature"
          title="Body Temperature"
          unit="°C"
          color="#F59E0B"
          isLoading={isLoading}
        />

        {temperatureTrend && (
          <Card style={styles.trendCard}>
            <Card.Content>
              <View style={styles.trendHeader}>
                <Ionicons
                  name={
                    temperatureTrend.direction === 'increasing'
                      ? 'arrow-up'
                      : temperatureTrend.direction === 'decreasing'
                        ? 'arrow-down'
                        : 'remove'
                  }
                  size={20}
                  color={
                    temperatureTrend.severity === 'critical'
                      ? '#DC2626'
                      : temperatureTrend.severity === 'warning'
                        ? '#F59E0B'
                        : '#64748B'
                  }
                />
                <Text
                  style={[
                    styles.trendMessage,
                    {
                      color:
                        temperatureTrend.severity === 'critical'
                          ? '#DC2626'
                          : temperatureTrend.severity === 'warning'
                            ? '#F59E0B'
                            : '#64748B',
                    },
                  ]}
                >
                  {temperatureTrend.message}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <HealthChart
          metrics={filteredMetrics}
          metricType="steps"
          title="Daily Steps"
          unit="steps"
          color="#10B981"
          isLoading={isLoading}
        />

        {stepsTrend && (
          <Card style={styles.trendCard}>
            <Card.Content>
              <View style={styles.trendHeader}>
                <Ionicons
                  name={
                    stepsTrend.direction === 'increasing'
                      ? 'arrow-up'
                      : stepsTrend.direction === 'decreasing'
                        ? 'arrow-down'
                        : 'remove'
                  }
                  size={20}
                  color={
                    stepsTrend.severity === 'critical'
                      ? '#DC2626'
                      : stepsTrend.severity === 'warning'
                        ? '#F59E0B'
                        : '#64748B'
                  }
                />
                <Text
                  style={[
                    styles.trendMessage,
                    {
                      color:
                        stepsTrend.severity === 'critical'
                          ? '#DC2626'
                          : stepsTrend.severity === 'warning'
                            ? '#F59E0B'
                            : '#64748B',
                    },
                  ]}
                >
                  {stepsTrend.message}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Blood Pressure Chart */}
        <HealthChart
          metrics={filteredMetrics}
          metricType="blood_pressure"
          title="Blood Pressure"
          unit="mmHg"
          color="#8B5CF6"
          isLoading={isLoading}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loader: {
    paddingVertical: 48,
  },
  loaderText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 16,
  },
  periodSelector: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryChip: {
    height: 28,
  },
  summaryChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  summaryStat: {
    alignItems: 'center',
    gap: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  trendCard: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendMessage: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

