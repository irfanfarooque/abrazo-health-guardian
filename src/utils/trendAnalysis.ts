import type { HealthMetric } from '@/types/health';
import { subDays, parseISO, isAfter, isBefore } from 'date-fns';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'unknown';

export type TrendAnalysis = {
  direction: TrendDirection;
  percentageChange: number;
  averageValue: number;
  recentAverage: number;
  previousAverage: number;
  dataPoints: number;
  message: string;
  severity: 'normal' | 'warning' | 'critical';
};

/**
 * Analyzes trend for a specific metric type over a given period
 */
export function analyzeTrend(
  metrics: HealthMetric[],
  metricType: string,
  days: number = 7,
): TrendAnalysis | null {
  const now = new Date();
  const periodStart = subDays(now, days);
  const periodMidpoint = subDays(now, days / 2);

  // Filter metrics by type and date range
  const periodMetrics = metrics
    .filter((m) => {
      const metricDate = parseISO(m.recorded_at);
      return (
        m.metric_type === metricType &&
        isAfter(metricDate, periodStart) &&
        isBefore(metricDate, now)
      );
    })
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  if (periodMetrics.length < 2) {
    return {
      direction: 'unknown',
      percentageChange: 0,
      averageValue: 0,
      recentAverage: 0,
      previousAverage: 0,
      dataPoints: periodMetrics.length,
      message: 'Insufficient data for trend analysis',
      severity: 'normal',
    };
  }

  // Split into recent and previous periods
  const recentMetrics = periodMetrics.filter((m) => {
    const metricDate = parseISO(m.recorded_at);
    return isAfter(metricDate, periodMidpoint);
  });

  const previousMetrics = periodMetrics.filter((m) => {
    const metricDate = parseISO(m.recorded_at);
    return isBefore(metricDate, periodMidpoint);
  });

  if (recentMetrics.length === 0 || previousMetrics.length === 0) {
    return {
      direction: 'unknown',
      percentageChange: 0,
      averageValue: 0,
      recentAverage: 0,
      previousAverage: 0,
      dataPoints: periodMetrics.length,
      message: 'Insufficient data for comparison',
      severity: 'normal',
    };
  }

  // Calculate averages
  const getAverage = (metrics: HealthMetric[]): number => {
    const values = metrics
      .map((m) => {
        if (metricType === 'blood_pressure' && m.systolic !== null) {
          return m.systolic;
        }
        return m.value !== null ? Number(m.value) : null;
      })
      .filter((v): v is number => v !== null);

    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const recentAverage = getAverage(recentMetrics);
  const previousAverage = getAverage(previousMetrics);
  const averageValue = getAverage(periodMetrics);

  // Calculate percentage change
  const percentageChange =
    previousAverage !== 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;

  // Determine direction
  let direction: TrendDirection = 'stable';
  if (Math.abs(percentageChange) < 2) {
    direction = 'stable';
  } else if (percentageChange > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }

  // Determine severity based on metric type and values
  const severity = determineSeverity(metricType, recentAverage, direction);

  // Generate message
  const message = generateTrendMessage(metricType, direction, percentageChange, severity);

  return {
    direction,
    percentageChange: Math.abs(percentageChange),
    averageValue,
    recentAverage,
    previousAverage,
    dataPoints: periodMetrics.length,
    message,
    severity,
  };
}

/**
 * Determines severity based on metric type and value
 */
function determineSeverity(
  metricType: string,
  value: number,
  direction: TrendDirection,
): 'normal' | 'warning' | 'critical' {
  // Normal ranges (can be customized per user profile)
  const ranges: Record<string, { normal: [number, number]; warning: [number, number] }> = {
    heart_rate: { normal: [60, 100], warning: [50, 120] },
    spo2: { normal: [95, 100], warning: [90, 95] },
    temperature: { normal: [36.1, 37.2], warning: [35.5, 38.0] },
    steps: { normal: [5000, Infinity], warning: [2000, 5000] },
  };

  const range = ranges[metricType];
  if (!range) return 'normal';

  if (value < range.normal[0] || value > range.normal[1]) {
    if (value < range.warning[0] || value > range.warning[1]) {
      return 'critical';
    }
    return 'warning';
  }

  // Check if trend is moving away from normal
  if (direction === 'increasing' && value > range.normal[1]) {
    return 'warning';
  }
  if (direction === 'decreasing' && value < range.normal[0]) {
    return 'warning';
  }

  return 'normal';
}

/**
 * Generates a human-readable trend message
 */
function generateTrendMessage(
  metricType: string,
  direction: TrendDirection,
  percentageChange: number,
  severity: 'normal' | 'warning' | 'critical',
): string {
  const metricNames: Record<string, string> = {
    heart_rate: 'Heart Rate',
    blood_pressure: 'Blood Pressure',
    spo2: 'Oxygen Saturation',
    temperature: 'Temperature',
    respiration: 'Respiration Rate',
    steps: 'Steps',
  };

  const metricName = metricNames[metricType] || metricType;

  if (direction === 'unknown') {
    return `${metricName}: Insufficient data`;
  }

  const changeText = Math.abs(percentageChange).toFixed(1);
  const directionText =
    direction === 'increasing' ? 'increased' : direction === 'decreasing' ? 'decreased' : 'remained stable';

  let message = `${metricName} has ${directionText} by ${changeText}%`;

  if (severity === 'critical') {
    message += '. This requires immediate attention.';
  } else if (severity === 'warning') {
    message += '. Monitor closely.';
  } else {
    message += ' over the past period.';
  }

  return message;
}

/**
 * Analyzes multiple metrics and returns overall health trend
 */
export function analyzeOverallTrend(metrics: HealthMetric[]): {
  overall: 'improving' | 'declining' | 'stable';
  criticalAlerts: number;
  warnings: number;
  trends: TrendAnalysis[];
} {
  const metricTypes = ['heart_rate', 'spo2', 'temperature', 'steps'];
  const trends = metricTypes
    .map((type) => analyzeTrend(metrics, type, 7))
    .filter((t): t is TrendAnalysis => t !== null && t.direction !== 'unknown');

  const criticalAlerts = trends.filter((t) => t.severity === 'critical').length;
  const warnings = trends.filter((t) => t.severity === 'warning').length;

  // Determine overall trend
  const increasingCount = trends.filter((t) => t.direction === 'increasing').length;
  const decreasingCount = trends.filter((t) => t.direction === 'decreasing').length;

  let overall: 'improving' | 'declining' | 'stable' = 'stable';
  if (criticalAlerts > 0 || warnings > 2) {
    overall = 'declining';
  } else if (decreasingCount > increasingCount && warnings === 0) {
    overall = 'improving';
  }

  return {
    overall,
    criticalAlerts,
    warnings,
    trends,
  };
}

