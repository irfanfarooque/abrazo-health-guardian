import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import type { HealthMetric } from '@/types/health';
import { format, subDays, parseISO } from 'date-fns';

// Helper to convert hex color to rgba
function hexToRgba(hex: string, opacity: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Fallback if already in rgba format
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  // Fallback if in rgb format
  if (hex.startsWith('rgb')) {
    return hex.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  return `rgba(37, 99, 235, ${opacity})`; // Default blue
}

type Props = {
  metrics: HealthMetric[];
  metricType: 'heart_rate' | 'blood_pressure' | 'spo2' | 'temperature' | 'steps';
  title: string;
  unit: string;
  color?: string;
  isLoading?: boolean;
};

const screenWidth = Dimensions.get('window').width - 32;

export function HealthChart({ metrics, metricType, title, unit, color = '#2563EB', isLoading }: Props) {
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <ActivityIndicator style={styles.loader} />
        </Card.Content>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.emptyText}>No data available for the selected period</Text>
        </Card.Content>
      </Card>
    );
  }

  // Filter and sort metrics
  const filteredMetrics = metrics
    .filter((m) => m.metric_type === metricType)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-30); // Last 30 readings

  if (filteredMetrics.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.emptyText}>No {metricType} data available</Text>
        </Card.Content>
      </Card>
    );
  }

  let data: number[] = [];
  let chartType: 'line' | 'bar' = 'line';
  let validMetrics: HealthMetric[] = [];

  if (metricType === 'blood_pressure') {
    // For BP, we'll show systolic and diastolic separately
    validMetrics = filteredMetrics.filter((m) => m.systolic !== null);
    data = validMetrics.map((m) => m.systolic!);
  } else {
    validMetrics = filteredMetrics.filter((m) => m.value !== null);
    data = validMetrics.map((m) => Number(m.value));
  }

  if (data.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.emptyText}>No valid data points</Text>
        </Card.Content>
      </Card>
    );
  }

  // Prepare labels based on valid metrics
  const labels = validMetrics.map((m, index) => {
    if (validMetrics.length <= 7) {
      return format(parseISO(m.recorded_at), 'MMM d');
    }
    // Show every nth label for readability
    const step = Math.ceil(validMetrics.length / 7);
    return index % step === 0 ? format(parseISO(m.recorded_at), 'MMM d') : '';
  });

  const chartData = {
    labels: labels.length === data.length ? labels : labels.slice(0, data.length),
    datasets: [
      {
        data,
        color: (opacity = 1) => hexToRgba(color, opacity),
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: metricType === 'temperature' || metricType === 'spo2' ? 1 : 0,
    color: (opacity = 1) => hexToRgba(color, opacity),
    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartContainer}>
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <BarChart
              data={chartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              withInnerLines={false}
              showValuesOnTopOfBars={true}
            />
          )}
        </View>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Latest</Text>
            <Text style={styles.statValue}>
              {data[data.length - 1].toFixed(metricType === 'temperature' || metricType === 'spo2' ? 1 : 0)} {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>
              {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(
                metricType === 'temperature' || metricType === 'spo2' ? 1 : 0,
              )}{' '}
              {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min</Text>
            <Text style={styles.statValue}>
              {Math.min(...data).toFixed(metricType === 'temperature' || metricType === 'spo2' ? 1 : 0)} {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>
              {Math.max(...data).toFixed(metricType === 'temperature' || metricType === 'spo2' ? 1 : 0)} {unit}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
});

