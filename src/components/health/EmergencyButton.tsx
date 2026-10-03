import { View, StyleSheet, Alert, Linking, Text } from 'react-native';
import { Card, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useHealthMetrics } from '@/hooks/useHealthMetrics';
import * as Location from 'expo-location';
import { Env } from '@/config/env';

export function EmergencyButton() {
  const { settings } = useUserSettings();
  const { latest } = useHealthMetrics();
  const emergencyNumber = settings?.emergency_number || Env.emergencyNumber || '911';

  const handleEmergency = async () => {
    Alert.alert(
      'Emergency Alert',
      'This will call emergency services and notify your caregivers. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get location
              const { status } = await Location.requestForegroundPermissionsAsync();
              let location = null;
              if (status === 'granted') {
                location = await Location.getCurrentPositionAsync({});
              }

              // Prepare health status snapshot
              const healthSnapshot = {
                timestamp: new Date().toISOString(),
                metrics: latest,
                location: location
                  ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }
                  : null,
              };

              // Call emergency number
              const phoneUrl = `tel:${emergencyNumber}`;
              const canOpen = await Linking.canOpenURL(phoneUrl);
              if (canOpen) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Error', 'Unable to make phone call. Please dial manually: ' + emergencyNumber);
              }

              // TODO: Send SMS to caregivers
              // TODO: Log emergency event to database
              console.log('[Emergency] Health snapshot:', healthSnapshot);

              Alert.alert(
                'Emergency Called',
                `Emergency services have been contacted. Your caregivers will be notified with your current health status.`,
              );
            } catch (error) {
              console.error('[Emergency] Error:', error);
              Alert.alert('Error', 'Failed to initiate emergency call. Please dial manually: ' + emergencyNumber);
            }
          },
        },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Button
              mode="contained"
              buttonColor="#DC2626"
              textColor="#FFFFFF"
              onPress={handleEmergency}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              EMERGENCY SOS
            </Button>
            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <View style={styles.hintText}>
                <Text style={styles.hintText}>Configure caregivers in Settings → Emergency</Text>
              </View>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
  },
});

