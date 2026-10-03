import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { MedicineReminder } from '@/types/medicine';
import type { Consultation } from '@/types/consultation';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private notificationIds: Map<string, string> = new Map(); // Map of reminder/consultation IDs to notification IDs

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('medicine-reminders', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('consultations', {
          name: 'Consultations',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync('health-alerts', {
          name: 'Health Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Failed to request permissions:', error);
      return false;
    }
  }

  async scheduleMedicineReminder(
    reminder: MedicineReminder,
    medicineName: string,
    dosage: string,
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
      
      // Create trigger based on days of week
      let trigger: Notifications.NotificationTriggerInput;

      if (reminder.days_of_week && reminder.days_of_week.length > 0) {
        // Weekly trigger for specific days
        trigger = {
          weekday: reminder.days_of_week[0] + 1, // expo uses 1-7 (Monday-Sunday)
          hour: hours,
          minute: minutes,
          repeats: true,
        };
      } else {
        // Daily trigger
        trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medicine Reminder',
          body: `Time to take ${medicineName} (${dosage})`,
          sound: true,
          data: {
            type: 'medicine_reminder',
            reminder_id: reminder.id,
            medicine_name: medicineName,
          },
        },
        trigger,
        identifier: `medicine_reminder_${reminder.id}`,
      });

      this.notificationIds.set(reminder.id, notificationId);
      return notificationId;
    } catch (error) {
      console.error('[Notifications] Failed to schedule medicine reminder:', error);
      return null;
    }
  }

  async cancelMedicineReminder(reminderId: string): Promise<void> {
    try {
      const notificationId = this.notificationIds.get(reminderId);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        this.notificationIds.delete(reminderId);
      } else {
        // Try to cancel by identifier
        await Notifications.cancelScheduledNotificationAsync(`medicine_reminder_${reminderId}`);
      }
    } catch (error) {
      console.error('[Notifications] Failed to cancel medicine reminder:', error);
    }
  }

  async scheduleConsultationReminder(consultation: Consultation, doctorName: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      const appointmentDate = new Date(`${consultation.appointment_date}T${consultation.appointment_time}`);
      const now = new Date();

      // Schedule 24 hours before
      const reminder24h = new Date(appointmentDate);
      reminder24h.setHours(reminder24h.getHours() - 24);
      if (reminder24h > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 Consultation Reminder',
            body: `You have an appointment with ${doctorName} tomorrow at ${consultation.appointment_time}`,
            sound: true,
            data: {
              type: 'consultation_reminder',
              consultation_id: consultation.id,
            },
          },
          trigger: reminder24h,
          identifier: `consultation_24h_${consultation.id}`,
        });
      }

      // Schedule 1 hour before
      const reminder1h = new Date(appointmentDate);
      reminder1h.setHours(reminder1h.getHours() - 1);
      if (reminder1h > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 Consultation Soon',
            body: `Your appointment with ${doctorName} is in 1 hour`,
            sound: true,
            data: {
              type: 'consultation_reminder',
              consultation_id: consultation.id,
            },
          },
          trigger: reminder1h,
          identifier: `consultation_1h_${consultation.id}`,
        });
      }
    } catch (error) {
      console.error('[Notifications] Failed to schedule consultation reminder:', error);
    }
  }

  async cancelConsultationReminders(consultationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`consultation_24h_${consultationId}`);
      await Notifications.cancelScheduledNotificationAsync(`consultation_1h_${consultationId}`);
    } catch (error) {
      console.error('[Notifications] Failed to cancel consultation reminders:', error);
    }
  }

  async sendHealthAlert(title: string, message: string, severity: 'red' | 'yellow' | 'green'): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      const importance =
        severity === 'red'
          ? Notifications.AndroidImportance.MAX
          : severity === 'yellow'
            ? Notifications.AndroidImportance.HIGH
            : Notifications.AndroidImportance.DEFAULT;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Health Alert: ${title}`,
          body: message,
          sound: true,
          priority: severity === 'red' ? 'max' : 'default',
          data: {
            type: 'health_alert',
            severity,
          },
        },
        trigger: null, // Immediate
        identifier: `health_alert_${Date.now()}`,
      });
    } catch (error) {
      console.error('[Notifications] Failed to send health alert:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationIds.clear();
    } catch (error) {
      console.error('[Notifications] Failed to cancel all notifications:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get scheduled notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();

