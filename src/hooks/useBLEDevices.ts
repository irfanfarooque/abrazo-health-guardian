import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { bleManager } from '@/services/ble/bleManager';
import type { BLEDeviceRecord, ScannedBLEDevice, BLEDeviceType } from '@/types/ble';
import { detectDeviceType, parseManufacturerData } from '@/services/ble/dataParser';

export function useBLEDevices() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [devices, setDevices] = useState<BLEDeviceRecord[]>([]);
  const [scannedDevices, setScannedDevices] = useState<ScannedBLEDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchDevices = useCallback(async () => {
    if (!supabase || !user) {
      setDevices([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('ble_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setDevices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  const startScanning = useCallback(async () => {
    if (isScanning) {
      return;
    }

    try {
      const state = await bleManager.checkBluetoothState();
      if (state !== 'PoweredOn') {
        Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices.');
        return;
      }

      setIsScanning(true);
      setScannedDevices([]);
      setError(null);

      await bleManager.startScanning((device) => {
        setScannedDevices((prev) => {
          // Avoid duplicates
          if (prev.some((d) => d.id === device.id)) {
            return prev;
          }
          return [...prev, device];
        });
      });
    } catch (err) {
      setIsScanning(false);
      const message = err instanceof Error ? err.message : 'Failed to start scanning';
      setError(message);
      Alert.alert('Scan Error', message);
    }
  }, [isScanning]);

  const stopScanning = useCallback(async () => {
    await bleManager.stopScanning();
    setIsScanning(false);
  }, []);

  const registerDevice = useCallback(
    async (
      scannedDevice: ScannedBLEDevice,
      deviceType: BLEDeviceType,
      customName?: string,
    ): Promise<BLEDeviceRecord | null> => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const manufacturerInfo = parseManufacturerData(scannedDevice.manufacturerData);
      const deviceName = customName || scannedDevice.name || scannedDevice.localName || 'Unknown Device';

      const { data, error: insertError } = await supabase
        .from('ble_devices')
        .insert({
          user_id: user.id,
          device_name: deviceName,
          device_mac_address: scannedDevice.id,
          device_type: deviceType,
          device_brand: manufacturerInfo.brand || null,
          device_model: manufacturerInfo.model || null,
          is_connected: false,
          is_active: true,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchDevices();
        return data;
      }

      return null;
    },
    [supabase, user, fetchDevices],
  );

  const connectDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      try {
        await bleManager.connectToDevice(deviceId);

        // Update device status in database
        if (supabase && user) {
          await supabase
            .from('ble_devices')
            .update({
              is_connected: true,
              last_connected_at: new Date().toISOString(),
            })
            .eq('device_mac_address', deviceId)
            .eq('user_id', user.id);

          await fetchDevices();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect to device';
        setError(message);
        throw new Error(message);
      }
    },
    [supabase, user, fetchDevices],
  );

  const disconnectDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      try {
        await bleManager.disconnectDevice(deviceId);

        // Update device status in database
        if (supabase && user) {
          await supabase
            .from('ble_devices')
            .update({
              is_connected: false,
            })
            .eq('device_mac_address', deviceId)
            .eq('user_id', user.id);

          await fetchDevices();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to disconnect device';
        setError(message);
        throw new Error(message);
      }
    },
    [supabase, user, fetchDevices],
  );

  const removeDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      try {
        // Disconnect if connected
        const device = devices.find((d) => d.id === deviceId);
        if (device?.is_connected) {
          await disconnectDevice(device.device_mac_address);
        }

        // Mark as inactive
        await supabase
          .from('ble_devices')
          .update({ is_active: false })
          .eq('id', deviceId)
          .eq('user_id', user.id);

        await fetchDevices();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove device';
        setError(message);
        throw new Error(message);
      }
    },
    [supabase, user, devices, disconnectDevice, fetchDevices],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchDevices();
    }
  }, [canUseSupabase, fetchDevices]);

  return {
    devices,
    scannedDevices,
    isScanning,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchDevices,
    startScanning,
    stopScanning,
    registerDevice,
    connectDevice,
    disconnectDevice,
    removeDevice,
  };
}

