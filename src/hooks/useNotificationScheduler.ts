import { useEffect } from 'react';
import { notificationService } from '@/services/notifications/notificationService';
import { useMedicines } from './useMedicines';
import { useMedicineReminders } from './useMedicineReminders';
import { useConsultations } from './useConsultations';
import { useUserSettings } from './useUserSettings';

export function useNotificationScheduler() {
  const { medicines } = useMedicines();
  const { consultations } = useConsultations();
  const { settings } = useUserSettings();

  // Schedule medicine reminders
  useEffect(() => {
    if (!settings?.notification_medicine_reminders) {
      return;
    }

    const scheduleAllReminders = async () => {
      for (const medicine of medicines) {
        if (!medicine.is_active) continue;

        // Get reminders for this medicine
        // Note: This is a simplified version - in production, you'd want to fetch reminders per medicine
        // For now, we'll rely on the reminder hook to handle scheduling when reminders are added
      }
    };

    scheduleAllReminders();
  }, [medicines, settings?.notification_medicine_reminders]);

  // Schedule consultation reminders
  useEffect(() => {
    if (!settings?.notification_consultation_reminders) {
      return;
    }

    const scheduleConsultationReminders = async () => {
      const upcomingConsultations = consultations.filter(
        (c) => c.status === 'scheduled' && new Date(c.appointment_date) > new Date(),
      );

      for (const consultation of upcomingConsultations) {
        // Note: We'd need doctor name from a join - simplified for now
        await notificationService.scheduleConsultationReminder(consultation, 'Doctor');
      }
    };

    scheduleConsultationReminders();
  }, [consultations, settings?.notification_consultation_reminders]);
}

// Hook specifically for medicine reminder scheduling
export function useMedicineReminderNotifications(medicineId?: string) {
  const { medicines } = useMedicines();
  const { reminders } = useMedicineReminders(medicineId);
  const { settings } = useUserSettings();

  useEffect(() => {
    if (!settings?.notification_medicine_reminders || !medicineId) {
      return;
    }

    const medicine = medicines.find((m) => m.id === medicineId);
    if (!medicine) return;

    const scheduleReminders = async () => {
      for (const reminder of reminders) {
        if (!reminder.is_active) {
          await notificationService.cancelMedicineReminder(reminder.id);
          continue;
        }

        await notificationService.scheduleMedicineReminder(
          reminder,
          medicine.medicine_name,
          medicine.dosage,
        );
      }
    };

    scheduleReminders();
  }, [reminders, medicineId, medicines, settings?.notification_medicine_reminders]);
}

