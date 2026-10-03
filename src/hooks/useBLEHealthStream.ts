import { useCallback, useEffect, useRef } from 'react';
import { bleManager } from '@/services/ble/bleManager';
import { useHealthMetrics } from './useHealthMetrics';
import { parseHealthData } from '@/services/ble/dataParser';
import { BLE_SERVICE_UUIDS } from '@/types/ble';
import type { BLEDeviceRecord } from '@/types/ble';

export function useBLEHealthStream(device: BLEDeviceRecord | null) {
  const { addMetric } = useHealthMetrics();
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  const startMonitoring = useCallback(
    async (deviceRecord: BLEDeviceRecord) => {
      if (!deviceRecord.is_connected) {
        return;
      }

      const deviceId = deviceRecord.device_mac_address;

      try {
        // Heart Rate monitoring
        if (deviceRecord.device_type === 'heart_rate' || deviceRecord.device_type === 'smartwatch') {
          const unsubscribe = await bleManager.monitorCharacteristic(
            deviceId,
            BLE_SERVICE_UUIDS.heartRate,
            '00002a37-0000-1000-8000-00805f9b34fb', // Heart Rate Measurement characteristic
            async (value) => {
              if (value) {
                const parsed = parseHealthData(value, deviceRecord.device_type, BLE_SERVICE_UUIDS.heartRate);
                if (parsed && parsed.metric_type === 'heart_rate') {
                  await addMetric({
                    device_id: deviceRecord.id,
                    metric_type: 'heart_rate',
                    value: parsed.value || null,
                    unit: parsed.unit || 'bpm',
                    notes: `From ${deviceRecord.device_name}`,
                    recorded_at: new Date().toISOString(),
                  });
                }
              }
            },
          );
          subscriptionsRef.current.set(`${deviceId}-heartrate`, unsubscribe);
        }

        // Blood Pressure monitoring
        if (deviceRecord.device_type === 'bp_monitor') {
          const unsubscribe = await bleManager.monitorCharacteristic(
            deviceId,
            BLE_SERVICE_UUIDS.bloodPressure,
            '00002a35-0000-1000-8000-00805f9b34fb', // Blood Pressure Measurement characteristic
            async (value) => {
              if (value) {
                const parsed = parseHealthData(value, deviceRecord.device_type, BLE_SERVICE_UUIDS.bloodPressure);
                if (parsed && parsed.metric_type === 'blood_pressure' && parsed.systolic && parsed.diastolic) {
                  await addMetric({
                    device_id: deviceRecord.id,
                    metric_type: 'blood_pressure',
                    systolic: parsed.systolic,
                    diastolic: parsed.diastolic,
                    unit: parsed.unit || 'mmHg',
                    notes: `From ${deviceRecord.device_name}`,
                    recorded_at: new Date().toISOString(),
                  });
                }
              }
            },
          );
          subscriptionsRef.current.set(`${deviceId}-bp`, unsubscribe);
        }

        // SpO2 monitoring
        if (deviceRecord.device_type === 'spo2') {
          const unsubscribe = await bleManager.monitorCharacteristic(
            deviceId,
            BLE_SERVICE_UUIDS.pulseOximeter,
            '00002a5f-0000-1000-8000-00805f9b34fb', // Pulse Oximetry Measurement characteristic
            async (value) => {
              if (value) {
                const parsed = parseHealthData(value, deviceRecord.device_type, BLE_SERVICE_UUIDS.pulseOximeter);
                if (parsed && parsed.metric_type === 'spo2') {
                  await addMetric({
                    device_id: deviceRecord.id,
                    metric_type: 'spo2',
                    value: parsed.value || null,
                    unit: parsed.unit || '%',
                    notes: parsed.notes || `From ${deviceRecord.device_name}`,
                    recorded_at: new Date().toISOString(),
                  });
                }
              }
            },
          );
          subscriptionsRef.current.set(`${deviceId}-spo2`, unsubscribe);
        }

        // Temperature monitoring
        if (deviceRecord.device_type === 'temperature') {
          const unsubscribe = await bleManager.monitorCharacteristic(
            deviceId,
            BLE_SERVICE_UUIDS.healthThermometer,
            '00002a1c-0000-1000-8000-00805f9b34fb', // Temperature Measurement characteristic
            async (value) => {
              if (value) {
                const parsed = parseHealthData(value, deviceRecord.device_type, BLE_SERVICE_UUIDS.healthThermometer);
                if (parsed && parsed.metric_type === 'temperature') {
                  await addMetric({
                    device_id: deviceRecord.id,
                    metric_type: 'temperature',
                    value: parsed.value || null,
                    unit: parsed.unit || '°C',
                    notes: `From ${deviceRecord.device_name}`,
                    recorded_at: new Date().toISOString(),
                  });
                }
              }
            },
          );
          subscriptionsRef.current.set(`${deviceId}-temp`, unsubscribe);
        }
      } catch (error) {
        console.error('[BLE] Failed to start monitoring:', error);
      }
    },
    [addMetric],
  );

  const stopMonitoring = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => {
      unsubscribe();
    });
    subscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    if (device && device.is_connected) {
      startMonitoring(device);
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [device, startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
  };
}

