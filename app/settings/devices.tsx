import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput as RNTextInput } from 'react-native';
import { Card, Button, List, ActivityIndicator, Text, Dialog, Portal, TextInput } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useBLEDevices } from '@/hooks/useBLEDevices';
import { detectDeviceType } from '@/services/ble/dataParser';
import type { ScannedBLEDevice } from '@/types/ble';

export default function SettingsDevicesScreen() {
  const {
    devices,
    scannedDevices,
    isScanning,
    isLoading,
    error,
    supabaseReady,
    startScanning,
    stopScanning,
    registerDevice,
    connectDevice,
    disconnectDevice,
    removeDevice,
  } = useBLEDevices();

  const [registerDialogVisible, setRegisterDialogVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ScannedBLEDevice | null>(null);
  const [customName, setCustomName] = useState('');

  const handleStartScan = useCallback(async () => {
    await startScanning();
    // Auto-stop after 10 seconds
    setTimeout(() => {
      stopScanning();
    }, 10000);
  }, [startScanning, stopScanning]);

  const handleRegisterDevice = useCallback(
    async (scannedDevice: ScannedBLEDevice) => {
      const deviceType = detectDeviceType(scannedDevice.serviceUUIDs);
      setSelectedDevice(scannedDevice);
      setCustomName(scannedDevice.name || scannedDevice.localName || '');
      setRegisterDialogVisible(true);
    },
    [],
  );

  const handleConfirmRegister = useCallback(async () => {
    if (!selectedDevice) return;

    try {
      const deviceType = detectDeviceType(selectedDevice.serviceUUIDs);
      await registerDevice(selectedDevice, deviceType, customName || undefined);
      setRegisterDialogVisible(false);
      setSelectedDevice(null);
      setCustomName('');
      Alert.alert('Success', 'Device registered successfully!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to register device');
    }
  }, [selectedDevice, customName, registerDevice]);

  const handleConnect = useCallback(
    async (deviceMacAddress: string) => {
      try {
        await connectDevice(deviceMacAddress);
        Alert.alert('Success', 'Device connected successfully!');
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to connect device');
      }
    },
    [connectDevice],
  );

  const handleDisconnect = useCallback(
    async (deviceMacAddress: string) => {
      try {
        await disconnectDevice(deviceMacAddress);
        Alert.alert('Success', 'Device disconnected');
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to disconnect device');
      }
    },
    [disconnectDevice],
  );

  const handleRemove = useCallback(
    async (deviceId: string, deviceName: string) => {
      Alert.alert('Remove Device', `Are you sure you want to remove ${deviceName}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDevice(deviceId);
              Alert.alert('Success', 'Device removed');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove device');
            }
          },
        },
      ]);
    },
    [removeDevice],
  );

  return (
    <ScreenContainer title="Connected devices" subtitle="Bluetooth/BLE sensors paired with ABRAZO.">
      <ScrollView style={styles.scrollView}>
        {!supabaseReady && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.warningText}>
                Supabase not configured. Device management requires database connection.
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.scanSection}>
          <Button
            mode={isScanning ? 'outlined' : 'contained'}
            onPress={isScanning ? stopScanning : handleStartScan}
            loading={isScanning}
            disabled={!supabaseReady}
            icon={isScanning ? 'stop' : 'magnify'}
          >
            {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
          </Button>
          {isScanning && <Text style={styles.scanHint}>Scanning for 10 seconds...</Text>}
        </View>

        {error && (
          <Card style={[styles.card, styles.errorCard]}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {scannedDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Found Devices ({scannedDevices.length})</Text>
            {scannedDevices.map((device) => {
              const deviceType = detectDeviceType(device.serviceUUIDs);
              return (
                <Card key={device.id} style={styles.deviceCard}>
                  <Card.Content>
                    <View style={styles.deviceHeader}>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{device.name || device.localName || 'Unknown Device'}</Text>
                        <Text style={styles.deviceDetails}>
                          {deviceType} • RSSI: {device.rssi} dBm
                        </Text>
                      </View>
                    </View>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleRegisterDevice(device)}
                      style={styles.deviceButton}
                    >
                      Register
                    </Button>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Devices ({devices.length})</Text>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : devices.length === 0 ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.emptyText}>No devices registered yet. Start scanning to add devices.</Text>
              </Card.Content>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id} style={styles.deviceCard}>
                <Card.Content>
                  <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.device_name}</Text>
                      <Text style={styles.deviceDetails}>
                        {device.device_type} • {device.device_brand || 'Unknown brand'}
                        {device.battery_level !== null && ` • Battery: ${device.battery_level}%`}
                      </Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: device.is_connected ? '#10B981' : '#94A3B8' },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {device.is_connected ? 'Connected' : 'Disconnected'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.deviceActions}>
                    {device.is_connected ? (
                      <Button mode="outlined" compact onPress={() => handleDisconnect(device.device_mac_address)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button mode="contained" compact onPress={() => handleConnect(device.device_mac_address)}>
                        Connect
                      </Button>
                    )}
                    <Button
                      mode="text"
                      compact
                      textColor="#DC2626"
                      onPress={() => handleRemove(device.id, device.device_name)}
                    >
                      Remove
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={registerDialogVisible} onDismiss={() => setRegisterDialogVisible(false)}>
          <Dialog.Title>Register Device</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Device Name"
              value={customName}
              onChangeText={setCustomName}
              mode="outlined"
              style={styles.dialogInput}
            />
            {selectedDevice && (
              <Text style={styles.dialogHint}>
                Device ID: {selectedDevice.id}
                {'\n'}
                Type: {detectDeviceType(selectedDevice.serviceUUIDs)}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRegisterDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleConfirmRegister}>Register</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  scanSection: {
    marginBottom: 24,
    gap: 8,
  },
  scanHint: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  deviceCard: {
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  deviceDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  deviceButton: {
    marginTop: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  loader: {
    paddingVertical: 24,
  },
  dialogInput: {
    marginBottom: 12,
  },
  dialogHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
});
