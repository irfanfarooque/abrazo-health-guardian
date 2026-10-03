import type { ParsedHealthData, BLEDeviceType } from '@/types/ble';
import { BLE_SERVICE_UUIDS } from '@/types/ble';

export function detectDeviceType(serviceUUIDs: string[] | null): BLEDeviceType {
  if (!serviceUUIDs || serviceUUIDs.length === 0) {
    return 'other';
  }

  const services = serviceUUIDs.map((uuid) => uuid.toLowerCase());

  if (services.some((uuid) => uuid.includes(BLE_SERVICE_UUIDS.bloodPressure.toLowerCase()))) {
    return 'bp_monitor';
  }
  if (services.some((uuid) => uuid.includes(BLE_SERVICE_UUIDS.heartRate.toLowerCase()))) {
    return 'heart_rate';
  }
  if (services.some((uuid) => uuid.includes(BLE_SERVICE_UUIDS.pulseOximeter.toLowerCase()))) {
    return 'spo2';
  }
  if (services.some((uuid) => uuid.includes(BLE_SERVICE_UUIDS.healthThermometer.toLowerCase()))) {
    return 'temperature';
  }
  if (services.some((uuid) => uuid.includes(BLE_SERVICE_UUIDS.heartRate.toLowerCase()))) {
    return 'smartwatch'; // Smartwatches often include heart rate
  }

  return 'other';
}

export function parseHealthData(
  base64Value: string | null,
  deviceType: BLEDeviceType,
  serviceUUID: string,
): ParsedHealthData | null {
  if (!base64Value) {
    return null;
  }

  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Value);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const byteArray = Array.from(bytes);

    // Heart Rate Service (0x180D)
    if (serviceUUID.toLowerCase().includes(BLE_SERVICE_UUIDS.heartRate.toLowerCase())) {
      if (byteArray.length >= 2) {
        let heartRate = byteArray[1];
        // Check if 16-bit value flag is set
        if (byteArray[0] & 0x01) {
          heartRate = (byteArray[2] << 8) | byteArray[1];
        }
        return {
          metric_type: 'heart_rate',
          value: heartRate,
          unit: 'bpm',
        };
      }
    }

    // Blood Pressure Service (0x1810)
    if (serviceUUID.toLowerCase().includes(BLE_SERVICE_UUIDS.bloodPressure.toLowerCase())) {
      if (byteArray.length >= 7) {
        const flags = byteArray[0];
        const systolic = (byteArray[2] << 8) | byteArray[1];
        const diastolic = (byteArray[4] << 8) | byteArray[3];
        return {
          metric_type: 'blood_pressure',
          systolic,
          diastolic,
          unit: 'mmHg',
        };
      }
    }

    // Health Thermometer Service (0x1809)
    if (serviceUUID.toLowerCase().includes(BLE_SERVICE_UUIDS.healthThermometer.toLowerCase())) {
      if (byteArray.length >= 5) {
        const flags = byteArray[0];
        const tempInteger = (byteArray[2] << 8) | byteArray[1];
        const tempFraction = byteArray[3];
        const temperature = tempInteger + tempFraction / 100.0;
        // Check if Fahrenheit flag is set
        const isFahrenheit = flags & 0x01;
        return {
          metric_type: 'temperature',
          value: isFahrenheit ? (temperature - 32) * (5 / 9) : temperature, // Convert to Celsius
          unit: '°C',
        };
      }
    }

    // Pulse Oximeter Service (0x1822)
    if (serviceUUID.toLowerCase().includes(BLE_SERVICE_UUIDS.pulseOximeter.toLowerCase())) {
      if (byteArray.length >= 4) {
        const flags = byteArray[0];
        const spo2 = byteArray[1];
        const pulseRate = (byteArray[3] << 8) | byteArray[2];
        return {
          metric_type: 'spo2',
          value: spo2,
          unit: '%',
          notes: `Pulse: ${pulseRate} bpm`,
        };
      }
    }

    // Generic parsing for unknown formats
    if (byteArray.length > 0) {
      return {
        metric_type: 'other',
        value: byteArray[0],
        unit: 'raw',
        notes: `Raw data: ${base64Value}`,
      };
    }
  } catch (error) {
    console.error('[BLE] Failed to parse health data:', error);
  }

  return null;
}

export function parseManufacturerData(manufacturerData: string | null): { brand?: string; model?: string } {
  if (!manufacturerData) {
    return {};
  }

  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(manufacturerData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const companyId = (bytes[1] << 8) | bytes[0];

    // Common manufacturer IDs
    const manufacturers: Record<number, string> = {
      0x0006: 'Microsoft',
      0x000d: 'Texas Instruments',
      0x001d: '3M',
      0x000f: 'Motorola',
      0x0010: 'Apple',
      0x004c: 'Apple', // Also Apple
      0x0059: 'Nordic Semiconductor',
      0x0060: 'Garmin',
      0x006d: 'Fitbit',
    };

    return {
      brand: manufacturers[companyId] || `Unknown (0x${companyId.toString(16)})`,
    };
  } catch (error) {
    console.error('[BLE] Failed to parse manufacturer data:', error);
  }

  return {};
}

